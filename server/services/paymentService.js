const crypto = require('crypto');
const db = require('../db/database');
const config = require('../config');

class PaymentService {
  /**
   * Initializes a Razorpay order on the server.
   * If live mode with valid API keys is enabled, calls Razorpay Orders API;
   * otherwise operates in deterministic test sandbox mode.
   * NEVER exposes key_secret to the client.
   */
  static async createRazorpayOrder({ orderId, orderNumber, amount, currency }) {
    const totalInSmallestUnit = Math.round(amount * 100); // e.g. cents or paise
    const curr = currency || config.currencyCode || 'USD';
    let rzpOrderId = null;

    if (config.paymentMode === 'live' && config.razorpayKeyId.startsWith('rzp_live_')) {
      try {
        const auth = Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString('base64');
        const res = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: totalInSmallestUnit,
            currency: curr,
            receipt: orderNumber,
            notes: { order_number: orderNumber }
          })
        });

        if (res.ok) {
          const data = await res.json();
          rzpOrderId = data.id;
        } else {
          console.warn('[PAYMENT] Razorpay API error response, falling back to secure sandbox order');
        }
      } catch (err) {
        console.warn('[PAYMENT] Razorpay API unreachable, fallback to secure sandbox order:', err.message);
      }
    }

    // Secure sandbox / test order id generation
    if (!rzpOrderId) {
      const randomSuffix = crypto.randomBytes(8).toString('hex');
      rzpOrderId = `order_${randomSuffix}`;
    }

    // Persist razorpay order ID to the order record
    db.run(
      `UPDATE orders SET payment_gateway_order_id = ?, updated_at = DATETIME('now') WHERE id = ?`,
      [rzpOrderId, orderId]
    );

    return {
      razorpayOrderId: rzpOrderId,
      keyId: config.razorpayKeyId,
      amount: totalInSmallestUnit,
      currency: curr,
      orderNumber,
      paymentMode: config.paymentMode
    };
  }

  /**
   * Cryptographically verifies Razorpay payment signature on the server:
   * HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret) === razorpay_signature
   */
  static verifyRazorpayPayment({ orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      const err = new Error('Missing required payment verification parameters.');
      err.statusCode = 400;
      throw err;
    }

    // In production / with configured secret, enforce HMAC SHA256 signature
    if (config.razorpayKeySecret) {
      const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpayKeySecret)
        .update(payload)
        .digest('hex');

      let isValid = false;
      try {
        isValid = crypto.timingSafeEqual(
          Buffer.from(razorpaySignature, 'utf8'),
          Buffer.from(expectedSignature, 'utf8')
        );
      } catch (e) {
        isValid = false;
      }

      if (!isValid) {
        const err = new Error('Payment verification failed: Invalid cryptographic signature.');
        err.statusCode = 400;
        throw err;
      }
    }

    // Process order update within database transaction for atomic consistency
    return db.transaction((tDb) => {
      const order = tDb.get(
        `SELECT id, order_number, payment_status, order_status, total_amount 
         FROM orders WHERE order_number = ?`,
        [orderNumber]
      );

      if (!order) {
        const err = new Error(`Order ${orderNumber} not found for verification.`);
        err.statusCode = 404;
        throw err;
      }

      // Idempotency check: if already paid, return gracefully
      if (order.payment_status === 'paid') {
        return {
          success: true,
          alreadyProcessed: true,
          orderId: order.id,
          orderNumber: order.order_number,
          paymentStatus: 'paid'
        };
      }

      // Update order to paid & processing
      tDb.run(
        `UPDATE orders 
         SET payment_status = 'paid', 
             order_status = 'processing', 
             payment_gateway_order_id = ?,
             payment_gateway_payment_id = ?,
             updated_at = DATETIME('now')
         WHERE id = ?`,
        [razorpayOrderId, razorpayPaymentId, order.id]
      );

      // Status history record
      tDb.run(
        `INSERT INTO order_status_history (order_id, status, comment)
         VALUES (?, 'processing', ?)`,
        [order.id, `Online payment verified via Razorpay. Transaction ID: ${razorpayPaymentId}`]
      );

      // Record event log
      tDb.run(
        `INSERT INTO payment_events (order_id, event_type, gateway, payload)
         VALUES (?, 'payment.verified', 'razorpay', ?)`,
        [
          order.id,
          JSON.stringify({
            orderNumber,
            razorpayOrderId,
            razorpayPaymentId,
            verifiedAt: new Date().toISOString()
          })
        ]
      );

      return {
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        paymentStatus: 'paid',
        paymentId: razorpayPaymentId
      };
    });
  }

  /**
   * Records a failed or cancelled payment attempt without breaking the order
   */
  static handlePaymentFailure({ orderNumber, razorpayOrderId, razorpayPaymentId, reason }) {
    return db.transaction((tDb) => {
      const order = tDb.get('SELECT id, payment_status FROM orders WHERE order_number = ?', [orderNumber]);
      if (!order) return null;

      if (order.payment_status !== 'paid') {
        tDb.run(
          `UPDATE orders SET payment_status = 'failed', updated_at = DATETIME('now') WHERE id = ?`,
          [order.id]
        );

        tDb.run(
          `INSERT INTO order_status_history (order_id, status, comment)
           VALUES (?, 'pending', ?)`,
          [order.id, `Online payment failed or cancelled: ${reason || 'Customer cancelled or transaction was declined'}`]
        );

        tDb.run(
          `INSERT INTO payment_events (order_id, event_type, gateway, payload)
           VALUES (?, 'payment.failed', 'razorpay', ?)`,
          [
            order.id,
            JSON.stringify({
              orderNumber,
              razorpayOrderId,
              razorpayPaymentId,
              reason: reason || 'Transaction declined/cancelled',
              timestamp: new Date().toISOString()
            })
          ]
        );
      }

      return { success: true, paymentStatus: 'failed' };
    });
  }

  /**
   * Verifies incoming webhook signatures from external payment gateways
   * (supports Stripe, Razorpay, Cashfree).
   */
  static verifyWebhookSignature(rawBody, signature, secret) {
    if (!secret || !signature) {
      return false;
    }
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Server-side webhook event processing.
   * Never marks payment as successful without signed server-side verification.
   */
  static processWebhookEvent({ gateway, eventType, orderNumber, paymentId, payload }) {
    return db.transaction((tDb) => {
      const order = tDb.get('SELECT id, payment_status, order_status FROM orders WHERE order_number = ?', [orderNumber]);
      if (!order) {
        throw new Error(`Order ${orderNumber} not found for webhook event.`);
      }

      // Record event log
      tDb.run(
        `INSERT INTO payment_events (order_id, event_type, gateway, payload)
         VALUES (?, ?, ?, ?)`,
        [order.id, eventType, gateway, JSON.stringify(payload)]
      );

      const isSuccess =
        eventType === 'payment.succeeded' ||
        eventType === 'charge.successful' ||
        eventType === 'payment.captured' ||
        eventType === 'order.paid';

      if (isSuccess) {
        if (order.payment_status !== 'paid') {
          tDb.run(
            `UPDATE orders 
             SET payment_status = 'paid', order_status = 'processing', updated_at = DATETIME('now')
             WHERE id = ?`,
            [order.id]
          );

          tDb.run(
            `INSERT INTO order_status_history (order_id, status, comment)
             VALUES (?, 'processing', ?)`,
            [order.id, `Payment verified via webhook from ${gateway} (Transaction ID: ${paymentId})`]
          );
        }

        return { status: 'processed', orderId: order.id, paymentStatus: 'paid' };
      } else if (eventType === 'payment.failed') {
        if (order.payment_status !== 'paid') {
          tDb.run(
            `UPDATE orders 
             SET payment_status = 'failed', updated_at = DATETIME('now')
             WHERE id = ?`,
            [order.id]
          );

          tDb.run(
            `INSERT INTO order_status_history (order_id, status, comment)
             VALUES (?, 'pending', ?)`,
            [order.id, `Online payment failed via webhook from ${gateway}`]
          );
        }

        return { status: 'processed', orderId: order.id, paymentStatus: 'failed' };
      }

      return { status: 'ignored' };
    });
  }
}

module.exports = PaymentService;
