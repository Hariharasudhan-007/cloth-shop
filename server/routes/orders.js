const express = require('express');
const router = express.Router();
const { validateOrderInput } = require('../middleware/validate');
const OrderService = require('../services/orderService');

// POST /api/orders - Create an order with transactional stock decrement
router.post('/', validateOrderInput, (req, res, next) => {
  try {
    const order = OrderService.createOrder(req.sanitizedOrder);
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/track/:orderNumber - Customer public order tracking with privacy masking
router.get('/track/:orderNumber', (req, res, next) => {
  try {
    const orderNumber = req.params.orderNumber.trim();
    const order = OrderService.getOrderByNumber(orderNumber);

    if (!order) {
      return res.status(404).json({ error: 'Order not found. Please verify the order reference number.' });
    }

    // Mask sensitive contact details for public lookup
    const maskedEmail = order.customer_email.replace(/^(.)(.*)(@.*)$/, (m, a, b, c) => `${a}${'*'.repeat(Math.max(b.length, 3))}${c}`);
    const maskedPhone = order.customer_phone.slice(-4).padStart(order.customer_phone.length, '*');

    const publicOrderView = {
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email_masked: maskedEmail,
      customer_phone_masked: maskedPhone,
      shipping_address: order.shipping_address,
      city: order.city,
      postal_code: order.postal_code,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      order_status: order.order_status,
      subtotal: order.subtotal,
      shipping_fee: order.shipping_fee,
      total_amount: order.total_amount,
      notes: order.notes,
      created_at: order.created_at,
      items: order.items,
      history: order.history
    };

    res.json(publicOrderView);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
