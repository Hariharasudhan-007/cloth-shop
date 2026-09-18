const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/content - Return all public website content blocks
router.get('/', (req, res, next) => {
  try {
    const rows = db.query('SELECT key, value, updated_at FROM site_content');
    const content = {};
    for (const row of rows) {
      try {
        content[row.key] = JSON.parse(row.value);
      } catch (e) {
        content[row.key] = row.value;
      }
    }
    res.json({
      success: true,
      content
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/content/:key - Return specific content block
router.get('/:key', (req, res, next) => {
  try {
    const { key } = req.params;
    const row = db.get('SELECT key, value, updated_at FROM site_content WHERE key = ?', [key]);
    if (!row) {
      return res.status(404).json({ error: `Content block "${key}" not found.` });
    }
    let parsed;
    try {
      parsed = JSON.parse(row.value);
    } catch (e) {
      parsed = row.value;
    }
    res.json({
      success: true,
      key: row.key,
      value: parsed,
      updated_at: row.updated_at
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
