const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/products - Filterable, searchable public catalog
router.get('/', (req, res, next) => {
  try {
    const { category, search, featured, sort, gender, collection, deal, limit } = req.query;

    let query = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.stock,
        p.image_url,
        p.secondary_image_url,
        p.is_featured,
        p.gender,
        p.is_new_arrival,
        p.is_best_seller,
        p.is_trending,
        p.discount_percent,
        p.category_id,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1
    `;
    const params = [];

    // Category filter by ID or by slug
    if (category) {
      if (!isNaN(parseInt(category, 10))) {
        query += ` AND p.category_id = ?`;
        params.push(parseInt(category, 10));
      } else {
        query += ` AND c.slug = ?`;
        params.push(category.trim().toLowerCase());
      }
    }

    // Gender filter (men, women)
    if (gender) {
      const g = gender.trim().toLowerCase();
      if (g === 'men') {
        query += ` AND (p.gender = 'men' OR p.gender = 'unisex')`;
      } else if (g === 'women') {
        query += ` AND (p.gender = 'women' OR p.gender = 'unisex')`;
      } else if (g === 'unisex') {
        query += ` AND p.gender = 'unisex'`;
      }
    }

    // Collection filter (new-arrivals, best-sellers, trending, deals)
    if (collection) {
      const c = collection.trim().toLowerCase();
      if (c === 'new-arrivals' || c === 'new_arrivals' || c === 'new') {
        query += ` AND p.is_new_arrival = 1`;
      } else if (c === 'best-sellers' || c === 'best_sellers' || c === 'best') {
        query += ` AND p.is_best_seller = 1`;
      } else if (c === 'trending') {
        query += ` AND p.is_trending = 1`;
      } else if (c === 'deals' || c === 'sale') {
        query += ` AND p.discount_percent > 0`;
      }
    }

    // Search query
    if (search && search.trim()) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    // Featured flag
    if (featured === '1' || featured === 'true') {
      query += ` AND p.is_featured = 1`;
    }

    // Deals flag
    if (deal === '1' || deal === 'true') {
      query += ` AND p.discount_percent > 0`;
    }

    // Sorting
    if (sort === 'price_asc') {
      query += ` ORDER BY p.price ASC`;
    } else if (sort === 'price_desc') {
      query += ` ORDER BY p.price DESC`;
    } else if (sort === 'name') {
      query += ` ORDER BY p.name ASC`;
    } else if (sort === 'discount') {
      query += ` ORDER BY p.discount_percent DESC`;
    } else {
      // Default: newest first
      query += ` ORDER BY p.id DESC`;
    }

    if (limit && !isNaN(parseInt(limit, 10))) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit, 10));
    }

    const products = db.query(query, params);
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:identifier - Single product detail by ID or Slug
router.get('/:identifier', (req, res, next) => {
  try {
    const identifier = req.params.identifier;
    let product;

    if (!isNaN(parseInt(identifier, 10))) {
      product = db.get(
        `SELECT 
          p.*,
          c.name as category_name,
          c.slug as category_slug
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.id = ? AND p.is_active = 1`,
        [parseInt(identifier, 10)]
      );
    } else {
      product = db.get(
        `SELECT 
          p.*,
          c.name as category_name,
          c.slug as category_slug
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.slug = ? AND p.is_active = 1`,
        [identifier.trim().toLowerCase()]
      );
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found or currently unavailable' });
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
