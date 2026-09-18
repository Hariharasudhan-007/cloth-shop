const express = require('express');
const router = express.Router();
const db = require('../db/database');

// POST /api/enquiries - Public enquiry submission (customer or distributor/wholesale)
router.post('/', (req, res, next) => {
  try {
    const {
      type = 'customer',
      name,
      email,
      phone = '',
      company_name = '',
      subject = '',
      message
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Please provide your name.' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Please provide a message or details of your enquiry.' });
    }

    const cleanType = type === 'distributor_wholesale' ? 'distributor_wholesale' : 'customer';
    const cleanName = name.trim().slice(0, 150);
    const cleanEmail = email.trim().toLowerCase().slice(0, 150);
    const cleanPhone = (phone || '').trim().slice(0, 50);
    const cleanCompany = (company_name || '').trim().slice(0, 150);
    const cleanSubject = (subject || (cleanType === 'distributor_wholesale' ? 'Wholesale Partnership Enquiry' : 'Customer Store Enquiry')).trim().slice(0, 200);
    const cleanMessage = message.trim().slice(0, 5000);

    const result = db.run(
      `INSERT INTO enquiries (
        type, name, email, phone, company_name, subject, message, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', '')`,
      [cleanType, cleanName, cleanEmail, cleanPhone, cleanCompany, cleanSubject, cleanMessage]
    );

    const created = db.get('SELECT * FROM enquiries WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({
      success: true,
      message: cleanType === 'distributor_wholesale'
        ? 'Thank you for your distributor partnership inquiry. Our wholesale atelier team will review your requirements and reach out promptly.'
        : 'Thank you for contacting Thread & Loom. Our customer care team has received your message and will respond shortly.',
      enquiry: {
        id: created.id,
        type: created.type,
        name: created.name,
        email: created.email,
        created_at: created.created_at
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
