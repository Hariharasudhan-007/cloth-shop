const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/coupons/active - List active promotional coupons for Offers/Deals page
router.get('/active', (req, res, next) => {
  try {
    const coupons = db.query(
      `SELECT code, discount_percent, min_order_amount, max_discount_amount, description 
       FROM coupons 
       WHERE is_active = 1 
       ORDER BY discount_percent DESC`
    );
    res.json(coupons);
  } catch (err) {
    next(err);
  }
});

// POST /api/coupons/validate - Validates a coupon code against an order subtotal
router.post('/validate', (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, message: 'Coupon code is required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = db.get(
      `SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1`,
      [cleanCode]
    );

    if (!coupon) {
      return res.status(404).json({ valid: false, message: 'Invalid or expired promotional code.' });
    }

    const orderSubtotal = parseFloat(subtotal) || 0;
    if (orderSubtotal < (coupon.min_order_amount || 0)) {
      return res.status(400).json({
        valid: false,
        message: `This coupon requires a minimum spend of $${(coupon.min_order_amount || 0).toFixed(2)}.`
      });
    }

    let discount = (orderSubtotal * coupon.discount_percent) / 100;
    if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
      discount = coupon.max_discount_amount;
    }
    discount = Math.round(discount * 100) / 100;

    res.json({
      valid: true,
      code: coupon.code,
      discount_percent: coupon.discount_percent,
      discount_amount: discount,
      description: coupon.description,
      min_order_amount: coupon.min_order_amount
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
