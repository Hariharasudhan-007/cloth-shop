const db = require('../db/database');
const { generateOrderNumber } = require('../utils/helpers');

const FREE_SHIPPING_THRESHOLD = 100.00;
const STANDARD_SHIPPING_FEE = 10.00;

class OrderService {
  /**
   * Atomically creates an order within a database transaction,
   * enforces stock availability, decrements inventory, applies legitimate coupon discounts,
   * preserves snapshot pricing, and logs initial order status history.
   */
  static createOrder(orderData) {
    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      city,
      postal_code,
      payment_method = 'cod',
      items,
      notes,
      coupon_code,
      user_id
    } = orderData;

    // Idempotency check: prevent rapid duplicate submission (within 20 seconds)
    const recentDuplicate = db.get(
      `SELECT id, order_number, total_amount, created_at 
       FROM orders 
       WHERE customer_email = ? 
         AND customer_name = ? 
         AND shipping_address = ? 
         AND created_at >= DATETIME('now', '-20 seconds')
       ORDER BY id DESC LIMIT 1`,
      [customer_email, customer_name, shipping_address]
    );

    if (recentDuplicate) {
      // Return recent existing order to prevent double-charging or double-inventory deduction
      return this.getOrderWithDetails(recentDuplicate.id);
    }

    return db.transaction((tDb) => {
      let calculatedSubtotal = 0;
      const verifiedItems = [];

      // 1. Verify availability and lock inventory
      for (const item of items) {
        const product = tDb.get(
          `SELECT id, name, price, stock, is_active FROM products WHERE id = ?`,
          [item.product_id]
        );

        if (!product || product.is_active !== 1) {
          const err = new Error(`One or more items in your cart are no longer available.`);
          err.statusCode = 400;
          throw err;
        }

        if (product.stock < item.quantity) {
          const err = new Error(
            `Insufficient stock for "${product.name}". Only ${product.stock} left in stock.`
          );
          err.statusCode = 400;
          throw err;
        }

        const lineSubtotal = product.price * item.quantity;
        calculatedSubtotal += lineSubtotal;

        verifiedItems.push({
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          quantity: item.quantity,
          subtotal: lineSubtotal
        });
      }

      // 2. Promotional Coupon Validation & Server-Side Discount Calculation
      let appliedCouponCode = null;
      let calculatedDiscount = 0;

      if (coupon_code && typeof coupon_code === 'string' && coupon_code.trim()) {
        const cleanCode = coupon_code.trim().toUpperCase();
        const coupon = tDb.get(
          `SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1`,
          [cleanCode]
        );

        if (coupon) {
          if (calculatedSubtotal >= (coupon.min_order_amount || 0)) {
            let discount = (calculatedSubtotal * coupon.discount_percent) / 100;
            if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
              discount = coupon.max_discount_amount;
            }
            calculatedDiscount = Math.round(discount * 100) / 100;
            appliedCouponCode = coupon.code;
          }
        }
      }

      // 3. Shipping calculation
      const effectiveSubtotal = Math.max(0, calculatedSubtotal - calculatedDiscount);
      const shipping_fee = effectiveSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
      const total_amount = Math.max(0, Math.round((effectiveSubtotal + shipping_fee) * 100) / 100);
      const order_number = generateOrderNumber();

      // 4. Atomically decrement stock
      for (const item of verifiedItems) {
        const updateResult = tDb.run(
          `UPDATE products 
           SET stock = stock - ?, updated_at = DATETIME('now') 
           WHERE id = ? AND stock >= ?`,
          [item.quantity, item.product_id, item.quantity]
        );

        if (updateResult.changes === 0) {
          const err = new Error(
            `Inventory conflict: stock for "${item.product_name}" changed during checkout. Please try again.`
          );
          err.statusCode = 409;
          throw err;
        }
      }

      // 5. Create Order Record
      const payment_status = 'pending';
      const order_status = 'pending';

      const orderResult = tDb.run(
        `INSERT INTO orders (
          order_number, customer_name, customer_email, customer_phone,
          shipping_address, city, postal_code, payment_method, payment_status,
          order_status, subtotal, shipping_fee, discount_amount, coupon_code,
          total_amount, notes, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order_number,
          customer_name,
          customer_email,
          customer_phone,
          shipping_address,
          city,
          postal_code,
          payment_method,
          payment_status,
          order_status,
          calculatedSubtotal,
          shipping_fee,
          calculatedDiscount,
          appliedCouponCode,
          total_amount,
          notes || '',
          user_id || null
        ]
      );

      const orderId = orderResult.lastInsertRowid;

      // 6. Insert Order Items (Preserving current name & price snapshot)
      for (const item of verifiedItems) {
        tDb.run(
          `INSERT INTO order_items (
            order_id, product_id, product_name, product_price, quantity, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_id,
            item.product_name,
            item.product_price,
            item.quantity,
            item.subtotal
          ]
        );
      }

      // 7. Record Status History Log
      const isCod = payment_method === 'cod';
      const statusComment = isCod 
        ? 'Order placed with Cash on Delivery.' 
        : `Order created, awaiting ${payment_method} gateway payment verification.`;

      tDb.run(
        `INSERT INTO order_status_history (order_id, status, comment)
         VALUES (?, ?, ?)`,
        [orderId, 'pending', statusComment]
      );

      return {
        id: orderId,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        city,
        postal_code,
        payment_method,
        payment_status,
        order_status,
        subtotal: calculatedSubtotal,
        discount_amount: calculatedDiscount,
        coupon_code: appliedCouponCode,
        shipping_fee,
        total_amount,
        items: verifiedItems,
        created_at: new Date().toISOString()
      };
    });
  }

  static getOrderWithDetails(orderId) {
    const order = db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return null;

    const items = db.query(
      `SELECT oi.*, p.image_url, p.slug as product_slug 
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    const history = db.query(
      `SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id ASC`,
      [orderId]
    );

    return { ...order, items, history };
  }

  static getOrderByNumber(orderNumber) {
    const order = db.get('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
    if (!order) return null;
    return this.getOrderWithDetails(order.id);
  }

  static getCustomerOrders(email, userId = null) {
    let query = `
      SELECT o.*, COUNT(oi.id) as item_count 
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.customer_email = ?
    `;
    const params = [email];

    if (userId) {
      query += ` OR o.user_id = ?`;
      params.push(userId);
    }

    query += ` GROUP BY o.id ORDER BY o.id DESC`;

    const orders = db.query(query, params);
    return orders.map((ord) => this.getOrderWithDetails(ord.id));
  }

  static updateOrderStatus(orderId, newStatus, comment = null) {
    return db.transaction((tDb) => {
      const order = tDb.get('SELECT id, order_status FROM orders WHERE id = ?', [orderId]);
      if (!order) {
        const err = new Error('Order not found');
        err.statusCode = 404;
        throw err;
      }

      tDb.run(
        `UPDATE orders SET order_status = ?, updated_at = DATETIME('now') WHERE id = ?`,
        [newStatus, orderId]
      );

      tDb.run(
        `INSERT INTO order_status_history (order_id, status, comment) VALUES (?, ?, ?)`,
        [orderId, newStatus, comment || `Order status updated to ${newStatus}`]
      );

      return this.getOrderWithDetails(orderId);
    });
  }
}

module.exports = OrderService;
