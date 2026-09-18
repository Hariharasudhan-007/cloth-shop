const express = require('express');
const router = express.Router();
const PaymentService = require('../services/paymentService');
const OrderService = require('../services/orderService');
const config = require('../config');

// POST /api/payments/razorpay/create-order
// Initializes a Razorpay order on the server for a pending checkout order
router.post('/razorpay/create-order', async (req, res, next) => {
  try {
    const { orderId, orderNumber } = req.body;
    if (!orderId && !orderNumber) {
      return res.status(400).json({ error: 'Order reference is required.' });
    }

    const order = orderId
      ? OrderService.getOrderWithDetails(orderId)
      : OrderService.getOrderByNumber(orderNumber);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'This order has already been paid.' });
    }

    const razorpayOrder = await PaymentService.createRazorpayOrder({
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.total_amount,
      currency: config.currencyCode
    });

    res.json({
      success: true,
      ...razorpayOrder
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/razorpay/verify
// Cryptographically verifies the payment signature returned by the gateway
router.post('/razorpay/verify', (req, res, next) => {
  try {
    const { orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderNumber || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        error: 'Missing required parameters for payment verification.'
      });
    }

    const verification = PaymentService.verifyRazorpayPayment({
      orderNumber,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    res.json(verification);
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/razorpay/fail
// Records failed or cancelled online payment attempts
router.post('/razorpay/fail', (req, res, next) => {
  try {
    const { orderNumber, razorpayOrderId, razorpayPaymentId, reason } = req.body;
    if (!orderNumber) {
      return res.status(400).json({ error: 'Order number is required.' });
    }

    const result = PaymentService.handlePaymentFailure({
      orderNumber,
      razorpayOrderId,
      razorpayPaymentId,
      reason
    });

    res.json(result || { success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/webhook - Gateway webhook listener (Stripe, Razorpay)
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  try {
    const signature =
      req.headers['x-razorpay-signature'] ||
      req.headers['x-webhook-signature'] ||
      req.headers['stripe-signature'];

    const secret = config.razorpayWebhookSecret || config.paymentWebhookSecret;

    // In production with configured webhook secret, enforce HMAC signature
    if (secret) {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const isValid = PaymentService.verifyWebhookSignature(rawBody, signature, secret);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature.' });
      }
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { gateway = 'razorpay', eventType, orderNumber, paymentId } = payload;

    // Support Razorpay native webhook payload formats
    let resolvedOrderNumber = orderNumber;
    let resolvedEventType = eventType;
    let resolvedPaymentId = paymentId;

    if (payload.event) {
      resolvedEventType = payload.event;
      if (payload.payload?.payment?.entity) {
        resolvedPaymentId = payload.payload.payment.entity.id;
        resolvedOrderNumber =
          payload.payload.payment.entity.notes?.order_number ||
          payload.payload.order?.entity?.receipt;
      }
    }

    if (!resolvedOrderNumber || !resolvedEventType) {
      return res.status(400).json({ error: 'Missing required webhook event parameters.' });
    }

    const result = PaymentService.processWebhookEvent({
      gateway,
      eventType: resolvedEventType,
      orderNumber: resolvedOrderNumber,
      paymentId: resolvedPaymentId || 'tx_unknown',
      payload
    });

    res.json({ received: true, result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
