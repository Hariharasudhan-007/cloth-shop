const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');

// Ensure data directory exists
const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(config.databasePath);

// Enable WAL mode and foreign key constraints for integrity and performance
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Migration safety: ensure newly added columns exist in existing database tables
const productColumns = [
  'ALTER TABLE products ADD COLUMN secondary_image_url TEXT;',
  'ALTER TABLE products ADD COLUMN gender TEXT DEFAULT "unisex";',
  'ALTER TABLE products ADD COLUMN is_new_arrival INTEGER DEFAULT 0;',
  'ALTER TABLE products ADD COLUMN is_best_seller INTEGER DEFAULT 0;',
  'ALTER TABLE products ADD COLUMN is_trending INTEGER DEFAULT 0;',
  'ALTER TABLE products ADD COLUMN discount_percent REAL DEFAULT 0;',
  'ALTER TABLE products ADD COLUMN sizes TEXT DEFAULT "S,M,L,XL";'
];

for (const alterSql of productColumns) {
  try {
    db.exec(alterSql);
  } catch (e) {
    // Column already exists
  }
}

const orderColumns = [
  'ALTER TABLE orders ADD COLUMN payment_gateway_order_id TEXT;',
  'ALTER TABLE orders ADD COLUMN payment_gateway_payment_id TEXT;',
  'ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0;',
  'ALTER TABLE orders ADD COLUMN coupon_code TEXT;',
  'ALTER TABLE orders ADD COLUMN user_id INTEGER;'
];

for (const alterSql of orderColumns) {
  try {
    db.exec(alterSql);
  } catch (e) {
    // Column already exists
  }
}

// Ensure coupons, customer_addresses, site_content, and enquiries tables exist
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_percent REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      max_discount_amount REAL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (DATETIME('now'))
    );
    CREATE TABLE IF NOT EXISTS customer_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      street_address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (DATETIME('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (DATETIME('now'))
    );
    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'customer',
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company_name TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      notes TEXT,
      created_at TEXT DEFAULT (DATETIME('now')),
      updated_at TEXT DEFAULT (DATETIME('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
    CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products(is_new_arrival);
    CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(is_best_seller);
    CREATE INDEX IF NOT EXISTS idx_products_trending ON products(is_trending);
    CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
    CREATE INDEX IF NOT EXISTS idx_customer_addresses_user ON customer_addresses(user_id);
    CREATE INDEX IF NOT EXISTS idx_enquiries_type ON enquiries(type);
    CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
    CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at);
  `);
} catch (e) {
  // Tables already exist
}

const dbHelpers = {
  db,
  
  query(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params) || null;
  },

  run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },

  exec(sql) {
    return db.exec(sql);
  },

  transaction(fn) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn(dbHelpers);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
};

module.exports = dbHelpers;
