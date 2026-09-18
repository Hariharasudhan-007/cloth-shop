const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const config = require('../config');
const OrderService = require('../services/orderService');

// Customer authentication middleware
function authenticateCustomer(req, res, next) {
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];
  const tokenFromCookie = req.cookies && req.cookies.customer_token;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return res.status(401).json({ error: 'Customer authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.customer = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired customer session.' });
  }
}

// POST /api/customer/register - Register a new customer
router.post('/register', (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.get('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const result = db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')`,
      [name.trim(), cleanEmail, hash]
    );

    const user = {
      id: result.lastInsertRowid,
      name: name.trim(),
      email: cleanEmail,
      role: 'customer'
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    res.cookie('customer_token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      user,
      token
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/customer/login - Log in as customer
router.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.get('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    res.cookie('customer_token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/customer/logout - Log out customer
router.post('/logout', (req, res) => {
  res.clearCookie('customer_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/customer/me - Get current authenticated customer profile
router.get('/me', authenticateCustomer, (req, res) => {
  const user = db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.customer.id]);
  if (!user) {
    return res.status(404).json({ error: 'Customer not found.' });
  }
  res.json({ user });
});

// GET /api/customer/orders - Get customer's order history
router.get('/orders', authenticateCustomer, (req, res, next) => {
  try {
    const orders = OrderService.getCustomerOrders(req.customer.email, req.customer.id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// GET /api/customer/addresses - Get customer's saved addresses
router.get('/addresses', authenticateCustomer, (req, res, next) => {
  try {
    const addresses = db.query(
      `SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC`,
      [req.customer.id]
    );
    res.json(addresses);
  } catch (err) {
    next(err);
  }
});

// POST /api/customer/addresses - Save a new delivery address
router.post('/addresses', authenticateCustomer, (req, res, next) => {
  try {
    const { full_name, phone, street_address, city, postal_code, is_default } = req.body;

    if (!full_name || !phone || !street_address || !city || !postal_code) {
      return res.status(400).json({ error: 'All address fields are required.' });
    }

    if (is_default) {
      // Clear previous default
      db.run('UPDATE customer_addresses SET is_default = 0 WHERE user_id = ?', [req.customer.id]);
    }

    const result = db.run(
      `INSERT INTO customer_addresses (user_id, full_name, phone, street_address, city, postal_code, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.customer.id, full_name.trim(), phone.trim(), street_address.trim(), city.trim(), postal_code.trim(), is_default ? 1 : 0]
    );

    const address = db.get('SELECT * FROM customer_addresses WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, address });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/customer/addresses/:id - Delete a saved address
router.delete('/addresses/:id', authenticateCustomer, (req, res, next) => {
  try {
    const addressId = parseInt(req.params.id, 10);
    db.run('DELETE FROM customer_addresses WHERE id = ? AND user_id = ?', [addressId, req.customer.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
