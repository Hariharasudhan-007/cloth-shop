const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/categories - List all categories with product counts
router.get('/', (req, res, next) => {
  try {
    const query = `
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.description, 
        c.image_url,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
    const categories = db.query(query);
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
