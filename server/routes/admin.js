const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const config = require('../config');
const { requireAdmin } = require('../middleware/auth');
const { validateProductInput, validateOrderStatusUpdate } = require('../middleware/validate');
const upload = require('../middleware/upload');
const OrderService = require('../services/orderService');
const { slugify } = require('../utils/helpers');

// POST /api/admin/login - Authenticate admin, issue secure HTTP-only cookie and JWT
router.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });

    // Set secure HTTP-Only cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token, // Also returned for client authorization headers
      user: payload
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/logout - Clear auth cookie
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/admin/me - Verify current admin session
router.get('/me', requireAdmin, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/admin/dashboard - Real SQL aggregates
router.get('/dashboard', requireAdmin, (req, res, next) => {
  try {
    // Total Revenue (excluding cancelled orders)
    const revenueRow = db.get(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM orders 
       WHERE order_status != 'cancelled'`
    );

    // Total Orders count
    const totalOrdersRow = db.get('SELECT COUNT(*) as count FROM orders');

    // Fulfillment & Status breakdown counts
    const pendingFulfillmentRow = db.get(
      `SELECT COUNT(*) as count FROM orders WHERE order_status IN ('pending', 'processing')`
    );
    const pendingOrdersRow = db.get(
      `SELECT COUNT(*) as count FROM orders WHERE order_status = 'pending'`
    );
    const processingOrdersRow = db.get(
      `SELECT COUNT(*) as count FROM orders WHERE order_status = 'processing'`
    );
    const shippedOrdersRow = db.get(
      `SELECT COUNT(*) as count FROM orders WHERE order_status = 'shipped'`
    );
    const deliveredOrdersRow = db.get(
      `SELECT COUNT(*) as count FROM orders WHERE order_status = 'delivered'`
    );
    const cancelledOrdersRow = db.get(
      `SELECT COUNT(*) as count FROM orders WHERE order_status = 'cancelled'`
    );

    // Low stock product count (stock <= 5 and active)
    const lowStockRow = db.get(
      `SELECT COUNT(*) as count FROM products WHERE stock <= 5 AND is_active = 1`
    );

    // Total Products count (active and total)
    const totalProductsRow = db.get('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
    const allProductsRow = db.get('SELECT COUNT(*) as count FROM products');

    // Featured Products count
    const featuredProductsRow = db.get('SELECT COUNT(*) as count FROM products WHERE is_featured = 1 AND is_active = 1');

    // Enquiries count (total and new)
    const totalEnquiriesRow = db.get('SELECT COUNT(*) as count FROM enquiries');
    const newEnquiriesRow = db.get(`SELECT COUNT(*) as count FROM enquiries WHERE status = 'new'`);
    const wholesaleEnquiriesRow = db.get(`SELECT COUNT(*) as count FROM enquiries WHERE type = 'distributor_wholesale'`);

    // Website Content Status
    const contentRows = db.query('SELECT key, value, updated_at FROM site_content');
    const contentMap = {};
    for (const r of contentRows) {
      try {
        contentMap[r.key] = JSON.parse(r.value);
      } catch (e) {
        contentMap[r.key] = r.value;
      }
    }
    const galleryCount = Array.isArray(contentMap.gallery_images) ? contentMap.gallery_images.length : 0;
    const contentStatus = {
      bannerConfigured: !!contentMap.homepage_banner,
      aboutConfigured: !!contentMap.about_us,
      whyChooseUsConfigured: Array.isArray(contentMap.why_choose_us) && contentMap.why_choose_us.length > 0,
      contactConfigured: !!(contentMap.contact_info && contentMap.contact_info.phone),
      galleryCount,
      allConfigured: !!(contentMap.homepage_banner && contentMap.about_us && contentMap.contact_info)
    };

    // Recent 5 orders
    const recentOrders = db.query(
      `SELECT id, order_number, customer_name, total_amount, order_status, created_at 
       FROM orders 
       ORDER BY id DESC 
       LIMIT 5`
    );

    // Recent 5 enquiries
    const recentEnquiries = db.query(
      `SELECT id, type, name, email, company_name, subject, status, created_at 
       FROM enquiries 
       ORDER BY id DESC 
       LIMIT 5`
    );

    // Low stock items list
    const lowStockProducts = db.query(
      `SELECT id, name, stock, price, image_url 
       FROM products 
       WHERE stock <= 5 AND is_active = 1 
       ORDER BY stock ASC 
       LIMIT 5`
    );

    res.json({
      metrics: {
        totalRevenue: Math.round(revenueRow.total * 100) / 100,
        totalOrders: totalOrdersRow.count,
        pendingFulfillment: pendingFulfillmentRow.count,
        pendingOrders: pendingOrdersRow.count,
        processingOrders: processingOrdersRow.count,
        shippedOrders: shippedOrdersRow.count,
        deliveredOrders: deliveredOrdersRow.count,
        cancelledOrders: cancelledOrdersRow.count,
        lowStockItems: lowStockRow.count,
        totalProducts: totalProductsRow.count,
        allProductsCount: allProductsRow.count,
        featuredProducts: featuredProductsRow.count,
        totalEnquiries: totalEnquiriesRow.count,
        newEnquiries: newEnquiriesRow.count,
        wholesaleEnquiries: wholesaleEnquiriesRow.count,
        contentStatus
      },
      recentOrders,
      recentEnquiries,
      lowStockProducts
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/products - List all products for management
router.get('/products', requireAdmin, (req, res, next) => {
  try {
    const products = db.query(
      `SELECT 
        p.*,
        c.name as category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.id DESC`
    );
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products - Create a new product
router.post('/products', requireAdmin, validateProductInput, (req, res, next) => {
  try {
    const { name, price, category_id, stock, description, image_url, secondary_image_url, sizes, is_featured, is_active } = req.sanitizedProduct;

    // Generate unique slug
    let baseSlug = slugify(name);
    let slug = baseSlug;
    const existing = db.get('SELECT id FROM products WHERE slug = ?', [slug]);
    if (existing) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const result = db.run(
      `INSERT INTO products (
        name, slug, description, price, category_id, stock, image_url, secondary_image_url, sizes, is_featured, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description, price, category_id, stock, image_url, secondary_image_url || null, sizes || 'S,M,L,XL', is_featured, is_active]
    );

    const newProduct = db.get(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON c.id = p.category_id 
       WHERE p.id = ?`,
      [result.lastInsertRowid]
    );

    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/products/:id - Edit an existing product
router.put('/products/:id', requireAdmin, validateProductInput, (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.get('SELECT id FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, price, category_id, stock, description, image_url, secondary_image_url, sizes, is_featured, is_active } = req.sanitizedProduct;

    db.run(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, category_id = ?, stock = ?, image_url = ?, secondary_image_url = ?, sizes = ?, is_featured = ?, is_active = ?, updated_at = DATETIME('now')
       WHERE id = ?`,
      [name, description, price, category_id, stock, image_url, secondary_image_url || null, sizes || 'S,M,L,XL', is_featured, is_active, id]
    );

    const updated = db.get(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON c.id = p.category_id 
       WHERE p.id = ?`,
      [id]
    );

    res.json({ success: true, product: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/products/:id/featured - Fast toggle featured status
router.patch('/products/:id/featured', requireAdmin, (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.get('SELECT id, name, is_featured FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newFeatured = req.body.is_featured !== undefined ? (req.body.is_featured ? 1 : 0) : (existing.is_featured ? 0 : 1);

    db.run(
      "UPDATE products SET is_featured = ?, updated_at = DATETIME('now') WHERE id = ?",
      [newFeatured, id]
    );

    res.json({
      success: true,
      message: `Product "${existing.name}" is now ${newFeatured ? 'featured on homepage' : 'removed from featured'}.`,
      is_featured: newFeatured
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/products/:id - Soft-deactivate product to preserve historical orders
router.delete('/products/:id', requireAdmin, (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.get('SELECT id, name FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product is linked to any order items
    const orderCount = db.get(
      'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?',
      [id]
    ).count;

    if (orderCount > 0) {
      // Soft-delete to protect historical records
      db.run('UPDATE products SET is_active = 0, updated_at = DATETIME(\'now\') WHERE id = ?', [id]);
      res.json({ success: true, message: `Product "${existing.name}" deactivated (historical orders preserved).` });
    } else {
      // Safe to hard delete if never ordered
      db.run('DELETE FROM products WHERE id = ?', [id]);
      res.json({ success: true, message: `Product "${existing.name}" deleted permanently.` });
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders - View customer orders with filtering
router.get('/orders', requireAdmin, (req, res, next) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT 
        o.*,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND o.order_status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      query += ` AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` GROUP BY o.id ORDER BY o.id DESC`;

    const orders = db.query(query, params);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders/:id - View order details
router.get('/orders/:id', requireAdmin, (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = OrderService.getOrderWithDetails(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orders/:id/status - Update order status
router.patch('/orders/:id/status', requireAdmin, validateOrderStatusUpdate, (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, comment } = req.sanitizedStatus;

    const updated = OrderService.updateOrderStatus(id, status, comment);
    res.json({ success: true, order: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/upload - Secure product image upload
router.post('/upload', requireAdmin, upload.single('image'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const relativeUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({
      success: true,
      url: relativeUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// CATEGORIES MANAGEMENT
// ==========================================

// POST /api/admin/categories - Create new category
router.post('/categories', requireAdmin, (req, res, next) => {
  try {
    const { name, description = '', image_url = '' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    let baseSlug = slugify(name.trim());
    let slug = baseSlug;
    const existing = db.get('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const result = db.run(
      'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
      [name.trim(), slug, description.trim(), image_url.trim()]
    );

    const newCategory = db.get('SELECT * FROM categories WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, category: newCategory });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/categories/:id - Update category
router.put('/categories/:id', requireAdmin, (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.get('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const { name, description = '', image_url = '' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    db.run(
      'UPDATE categories SET name = ?, description = ?, image_url = ? WHERE id = ?',
      [name.trim(), description.trim(), image_url.trim(), id]
    );

    const updated = db.get('SELECT * FROM categories WHERE id = ?', [id]);
    res.json({ success: true, category: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/categories/:id - Delete category (products unassigned safely)
router.delete('/categories/:id', requireAdmin, (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.get('SELECT id, name FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Set referencing products category_id to NULL
    db.run('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);
    db.run('DELETE FROM categories WHERE id = ?', [id]);

    res.json({ success: true, message: `Category "${existing.name}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// WEBSITE CONTENT MANAGEMENT
// ==========================================

// GET /api/admin/content - Fetch all content blocks
router.get('/content', requireAdmin, (req, res, next) => {
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
    res.json({ success: true, content });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/content/:key - Update a content block
router.put('/content/:key', requireAdmin, (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Content value is required.' });
    }

    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

    db.run(
      `INSERT INTO site_content (key, value, updated_at) 
       VALUES (?, ?, DATETIME('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = DATETIME('now')`,
      [key, valueStr]
    );

    res.json({
      success: true,
      message: `Content block "${key}" updated successfully.`,
      key,
      value
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// ENQUIRIES MANAGEMENT
// ==========================================

// GET /api/admin/enquiries - List enquiries with filters
router.get('/enquiries', requireAdmin, (req, res, next) => {
  try {
    const { type, status, search } = req.query;

    let query = 'SELECT * FROM enquiries WHERE 1=1';
    const params = [];

    if (type && type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR email LIKE ? OR company_name LIKE ? OR subject LIKE ? OR message LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    query += ' ORDER BY id DESC';

    const enquiries = db.query(query, params);
    res.json(enquiries);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/enquiries/:id - Get single enquiry
router.get('/enquiries/:id', requireAdmin, (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const enquiry = db.get('SELECT * FROM enquiries WHERE id = ?', [id]);
    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found.' });
    }
    res.json(enquiry);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/enquiries/:id - Update enquiry status or internal notes
router.patch('/enquiries/:id', requireAdmin, (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.get('SELECT * FROM enquiries WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Enquiry not found.' });
    }

    const { status, notes } = req.body;
    const allowedStatuses = ['new', 'in_progress', 'resolved'];

    const newStatus = status && allowedStatuses.includes(status) ? status : existing.status;
    const newNotes = notes !== undefined ? String(notes).trim() : existing.notes;

    db.run(
      "UPDATE enquiries SET status = ?, notes = ?, updated_at = DATETIME('now') WHERE id = ?",
      [newStatus, newNotes, id]
    );

    const updated = db.get('SELECT * FROM enquiries WHERE id = ?', [id]);
    res.json({ success: true, enquiry: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/enquiries/:id - Delete enquiry
router.delete('/enquiries/:id', requireAdmin, (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.get('SELECT id, name FROM enquiries WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Enquiry not found.' });
    }

    db.run('DELETE FROM enquiries WHERE id = ?', [id]);
    res.json({ success: true, message: `Enquiry from "${existing.name}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// SECURITY & PASSWORD MANAGEMENT
// ==========================================

// POST /api/admin/change-password - Change current admin password safely
router.post('/change-password', requireAdmin, (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const user = db.get("SELECT * FROM users WHERE id = ? AND role = 'admin'", [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Admin user not found.' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password does not match.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);

    res.json({
      success: true,
      message: 'Admin password updated securely. Please use your new password next time you log in.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

