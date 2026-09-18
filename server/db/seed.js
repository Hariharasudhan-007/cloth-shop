const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./database');
const config = require('../config');

function seed() {
  console.log('--- Initializing Database Schema ---');
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schemaSql);

  console.log('--- Checking Admin Account ---');
  const existingAdmin = db.get('SELECT id FROM users WHERE email = ?', [config.adminEmail]);
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(config.adminDefaultPassword, salt);
    db.run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Store Administrator', config.adminEmail, hash, 'admin']
    );
    console.log(`Created default admin account: ${config.adminEmail}`);
  } else {
    console.log('Admin account already exists.');
  }

  console.log('--- Checking Categories ---');
  const categoriesCount = db.get('SELECT COUNT(*) as count FROM categories').count;
  if (categoriesCount === 0) {
    const categories = [
      {
        name: 'Shirts & Tops',
        slug: 'shirts',
        description: 'Bespoke linen, organic cotton, and tailored oxford shirts.',
        image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Outerwear',
        slug: 'outerwear',
        description: 'Durable jackets, chore coats, and weather-resistant overshirts.',
        image_url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Knitwear',
        slug: 'knitwear',
        description: 'Extra-fine merino wool, ribbed cardigans, and cozy crewnecks.',
        image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Trousers',
        slug: 'trousers',
        description: 'Pleated twill chinos, relaxed denim, and tailored trousers.',
        image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Heavyweight canvas totes, woven scarves, and everyday leather essentials.',
        image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80'
      }
    ];

    const insertCat = 'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)';
    for (const cat of categories) {
      db.run(insertCat, [cat.name, cat.slug, cat.description, cat.image_url]);
    }
    console.log(`Seeded ${categories.length} categories.`);
  }

  console.log('--- Checking Products ---');
  const productsCount = db.get('SELECT COUNT(*) as count FROM products').count;
  if (productsCount === 0) {
    const catMap = {};
    const allCats = db.query('SELECT id, slug FROM categories');
    allCats.forEach(c => { catMap[c.slug] = c.id; });

    const products = [
      {
        name: 'Relaxed Linen Camp Collar Shirt',
        slug: 'relaxed-linen-camp-collar-shirt',
        description: 'Crafted from 100% French flax linen. Features an airy camp collar, mother-of-pearl buttons, and a straight hem perfect for warm weather layering.',
        price: 68.00,
        category_id: catMap['shirts'],
        stock: 24,
        image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
        is_featured: 1
      },
      {
        name: 'Tailored Oxford Button-Down',
        slug: 'tailored-oxford-button-down',
        description: 'A timeless staple woven from premium long-staple organic cotton. Structured collar roll, single chest pocket, and garment-washed softness.',
        price: 74.00,
        category_id: catMap['shirts'],
        stock: 18,
        image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
        is_featured: 1
      },
      {
        name: 'Selvedge Denim Trucker Jacket',
        slug: 'selvedge-denim-trucker-jacket',
        description: '14oz Japanese red-line selvedge denim. Custom antique brass hardware, dual chest flap pockets, and tailored welt hand pockets.',
        price: 135.00,
        category_id: catMap['outerwear'],
        stock: 12,
        image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
        is_featured: 1
      },
      {
        name: 'Waxed Canvas Field Overshirt',
        slug: 'waxed-canvas-field-overshirt',
        description: 'Water-resistant Scottish waxed cotton with corduroy-lined collar and cuffs. Ideal outer layer for transitional weather and outdoor work.',
        price: 119.00,
        category_id: catMap['outerwear'],
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=800&q=80',
        is_featured: 0
      },
      {
        name: 'Merino Wool Crewneck Sweater',
        slug: 'merino-wool-crewneck-sweater',
        description: 'Spun from 100% extrafine 19.5 micron merino wool. Incredibly soft against skin, naturally temperature-regulating, and pill-resistant.',
        price: 89.00,
        category_id: catMap['knitwear'],
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
        is_featured: 1
      },
      {
        name: 'Chunky Ribbed Cotton Cardigan',
        slug: 'chunky-ribbed-cotton-cardigan',
        description: 'Heavy 5-gauge knit from breathable organic cotton yarns. Features genuine horn buttons and comfortable raglan sleeve construction.',
        price: 98.00,
        category_id: catMap['knitwear'],
        stock: 9,
        image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80',
        is_featured: 0
      },
      {
        name: 'Pleated Cotton Twill Chinos',
        slug: 'pleated-cotton-twill-chinos',
        description: 'Mid-rise trousers with double forward pleats and a relaxed tapered leg. Woven from durable 8.5oz combed cotton twill.',
        price: 78.00,
        category_id: catMap['trousers'],
        stock: 22,
        image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
        is_featured: 1
      },
      {
        name: 'Straight Leg Japanese Denim',
        slug: 'straight-leg-japanese-denim',
        description: 'Raw indigo denim crafted on vintage shuttle looms in Okayama. Features chainstitched hems and branded leather patch.',
        price: 128.00,
        category_id: catMap['trousers'],
        stock: 14,
        image_url: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80',
        is_featured: 0
      },
      {
        name: 'Heavyweight Canvas Weekend Tote',
        slug: 'heavyweight-canvas-weekend-tote',
        description: '18oz rugged cotton duck canvas with full-grain bridle leather handles and solid copper rivets. Reinforced double-layer bottom.',
        price: 55.00,
        category_id: catMap['accessories'],
        stock: 30,
        image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
        is_featured: 1
      },
      {
        name: 'Brushed Lambswool Plaid Scarf',
        slug: 'brushed-lambswool-plaid-scarf',
        description: 'Woven in Scotland using pure lambswool for cloud-soft warmth and subtle drape. Finished with traditional purled fringes.',
        price: 42.00,
        category_id: catMap['accessories'],
        stock: 25,
        image_url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=800&q=80',
        secondary_image_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80',
        is_featured: 0
      },
      {
        name: 'Vintage Wash Heavyweight Pocket Tee',
        slug: 'vintage-wash-heavyweight-pocket-tee',
        description: '220 GSM combed cotton knit. Pigment dyed for a rich lived-in tone that softens and develops unique character with each wash.',
        price: 34.00,
        category_id: catMap['shirts'],
        stock: 35,
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        secondary_image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
        is_featured: 0
      },
      {
        name: 'Minimalist Vegetable Tanned Cardholder',
        slug: 'minimalist-vegetable-tanned-cardholder',
        description: 'Hand-stitched Italian vegetable-tanned leather. Holds up to 6 cards and folded cash. Low stock edition.',
        price: 28.00,
        category_id: catMap['accessories'],
        stock: 3, // Low stock for dashboard alerts
        image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
        secondary_image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
        is_featured: 0
      }
    ];

    const insertProd = `
      INSERT INTO products (name, slug, description, price, category_id, stock, image_url, secondary_image_url, is_featured, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    for (const prod of products) {
      db.run(insertProd, [
        prod.name,
        prod.slug,
        prod.description,
        prod.price,
        prod.category_id,
        prod.stock,
        prod.image_url,
        prod.secondary_image_url || null,
        prod.is_featured
      ]);
    }
    console.log(`Seeded ${products.length} products.`);
  }

  // Backfill secondary images if missing in existing database
  const secondaryMap = {
    'relaxed-linen-camp-collar-shirt': 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80',
    'tailored-oxford-button-down': 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=800&q=80',
    'selvedge-denim-trucker-jacket': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    'waxed-canvas-field-overshirt': 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80',
    'merino-wool-crewneck-sweater': 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80',
    'chunky-ribbed-cotton-cardigan': 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?auto=format&fit=crop&w=800&q=80',
    'pleated-cotton-twill-chinos': 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
    'straight-leg-japanese-denim': 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80',
    'heavyweight-canvas-weekend-tote': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    'brushed-lambswool-plaid-scarf': 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80',
    'vintage-wash-heavyweight-pocket-tee': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    'minimalist-vegetable-tanned-cardholder': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80'
  };

  for (const [slug, secUrl] of Object.entries(secondaryMap)) {
    db.run(
      "UPDATE products SET secondary_image_url = ? WHERE slug = ? AND (secondary_image_url IS NULL OR secondary_image_url = '')",
      [secUrl, slug]
    );
  }

  // Tag existing products with gender and discovery flags
  const metadataMap = {
    'relaxed-linen-camp-collar-shirt': { gender: 'men', is_new_arrival: 1, is_best_seller: 1, is_trending: 1, discount: 0 },
    'tailored-oxford-button-down': { gender: 'men', is_new_arrival: 0, is_best_seller: 1, is_trending: 0, discount: 10 },
    'selvedge-denim-trucker-jacket': { gender: 'men', is_new_arrival: 1, is_best_seller: 1, is_trending: 1, discount: 0 },
    'waxed-canvas-field-overshirt': { gender: 'men', is_new_arrival: 0, is_best_seller: 0, is_trending: 1, discount: 15 },
    'merino-wool-crewneck-sweater': { gender: 'unisex', is_new_arrival: 1, is_best_seller: 1, is_trending: 1, discount: 0 },
    'chunky-ribbed-cotton-cardigan': { gender: 'unisex', is_new_arrival: 0, is_best_seller: 0, is_trending: 0, discount: 20 },
    'pleated-cotton-twill-chinos': { gender: 'men', is_new_arrival: 0, is_best_seller: 1, is_trending: 0, discount: 0 },
    'straight-leg-japanese-denim': { gender: 'men', is_new_arrival: 1, is_best_seller: 0, is_trending: 1, discount: 0 },
    'heavyweight-canvas-weekend-tote': { gender: 'unisex', is_new_arrival: 0, is_best_seller: 1, is_trending: 1, discount: 0 },
    'brushed-lambswool-plaid-scarf': { gender: 'unisex', is_new_arrival: 1, is_best_seller: 0, is_trending: 0, discount: 15 },
    'vintage-wash-heavyweight-pocket-tee': { gender: 'men', is_new_arrival: 1, is_best_seller: 1, is_trending: 1, discount: 0 },
    'minimalist-vegetable-tanned-cardholder': { gender: 'unisex', is_new_arrival: 0, is_best_seller: 1, is_trending: 0, discount: 0 }
  };

  for (const [slug, meta] of Object.entries(metadataMap)) {
    db.run(
      `UPDATE products 
       SET gender = ?, is_new_arrival = ?, is_best_seller = ?, is_trending = ?, discount_percent = ? 
       WHERE slug = ?`,
      [meta.gender, meta.is_new_arrival, meta.is_best_seller, meta.is_trending, meta.discount, slug]
    );
  }

  // Seed Women's collection garments if not yet present
  const catMap = {};
  const allCats = db.query('SELECT id, slug FROM categories');
  allCats.forEach(c => { catMap[c.slug] = c.id; });

  const womenProducts = [
    {
      name: 'Tiered Linen Midi Sun Dress',
      slug: 'tiered-linen-midi-sun-dress',
      description: 'Airy 100% Normandy flax linen. Features delicate shoulder straps, hidden side pockets, and an easy fluid tiered drape.',
      price: 92.00,
      category_id: catMap['shirts'] || 1,
      stock: 18,
      image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
      secondary_image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
      is_featured: 1,
      gender: 'women',
      is_new_arrival: 1,
      is_best_seller: 1,
      is_trending: 1,
      discount_percent: 0
    },
    {
      name: 'Pleated Silk-Cotton Studio Blouse',
      slug: 'pleated-silk-cotton-studio-blouse',
      description: 'Lustrous blend of 30% mulberry silk and 70% organic cotton. Features subtle neck pleating and genuine mother-of-pearl buttons.',
      price: 84.00,
      category_id: catMap['shirts'] || 1,
      stock: 22,
      image_url: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?auto=format&fit=crop&w=800&q=80',
      secondary_image_url: 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80',
      is_featured: 1,
      gender: 'women',
      is_new_arrival: 1,
      is_best_seller: 0,
      is_trending: 1,
      discount_percent: 15
    },
    {
      name: 'High-Rise Tailored Linen Trousers',
      slug: 'high-rise-tailored-linen-trousers',
      description: 'Sculpted high-waist fit with wide flowing leg line. Breathable washed linen with tailored belt loops and deep slash pockets.',
      price: 88.00,
      category_id: catMap['trousers'] || 4,
      stock: 16,
      image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
      secondary_image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      is_featured: 1,
      gender: 'women',
      is_new_arrival: 0,
      is_best_seller: 1,
      is_trending: 1,
      discount_percent: 0
    },
    {
      name: 'Ribbed Cashmere-Blend Mockneck',
      slug: 'ribbed-cashmere-blend-mockneck',
      description: 'Sumptuous cloud-soft blend of 70% fine wool and 30% Mongolian cashmere. Elegant architectural ribbed collar.',
      price: 110.00,
      category_id: catMap['knitwear'] || 3,
      stock: 14,
      image_url: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80',
      secondary_image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
      is_featured: 0,
      gender: 'women',
      is_new_arrival: 1,
      is_best_seller: 0,
      is_trending: 1,
      discount_percent: 10
    }
  ];

  const insertProdStmt = `
    INSERT OR IGNORE INTO products (name, slug, description, price, category_id, stock, image_url, secondary_image_url, is_featured, is_active, gender, is_new_arrival, is_best_seller, is_trending, discount_percent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
  `;

  for (const wp of womenProducts) {
    const exists = db.get('SELECT id FROM products WHERE slug = ?', [wp.slug]);
    if (!exists) {
      db.run(insertProdStmt, [
        wp.name,
        wp.slug,
        wp.description,
        wp.price,
        wp.category_id,
        wp.stock,
        wp.image_url,
        wp.secondary_image_url,
        wp.is_featured,
        wp.gender,
        wp.is_new_arrival,
        wp.is_best_seller,
        wp.is_trending,
        wp.discount_percent
      ]);
    }
  }

  // Seed Promotional Coupons
  const coupons = [
    { code: 'ATELIER15', discount: 15, min: 100, max: 50, desc: '15% off orders over $100' },
    { code: 'LOOM10', discount: 10, min: 50, max: 30, desc: '10% off your wardrobe essentials' },
    { code: 'FESTIVE20', discount: 20, min: 150, max: 75, desc: '20% off seasonal luxury collection' }
  ];

  for (const c of coupons) {
    const existing = db.get('SELECT id FROM coupons WHERE code = ?', [c.code]);
    if (!existing) {
      db.run(
        'INSERT INTO coupons (code, discount_percent, min_order_amount, max_discount_amount, description, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        [c.code, c.discount, c.min, c.max, c.desc]
      );
    }
  }

  // Seed sample customer account
  const customerEmail = 'customer@threadandloom.com';
  const existingCustomer = db.get('SELECT id FROM users WHERE email = ?', [customerEmail]);
  if (!existingCustomer) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('CustomerPass123!', salt);
    const custRes = db.run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Eleanor Vance', customerEmail, hash, 'customer']
    );
    const customerId = custRes.lastInsertRowid;
    
    // Seed default address
    db.run(
      `INSERT INTO customer_addresses (user_id, full_name, phone, street_address, city, postal_code, is_default)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [customerId, 'Eleanor Vance', '+1 (555) 019-2834', '742 Evergreen Terrace, Apt 4B', 'New York', '10001']
    );
    console.log(`Created default customer test account: ${customerEmail}`);
  }

  console.log('--- Checking Site Content ---');
  const siteContentCount = db.get('SELECT COUNT(*) as count FROM site_content').count;
  if (siteContentCount === 0) {
    const defaultBanner = {
      badge: "2026 ARCHIVE EDITION",
      title: "Form meets fabric.",
      subtitle: "Woven to endure.",
      description: "Bespoke everyday silhouettes cut from unbleached French flax linen, Okayama raw denim, and Scottish lambswool. No synthetic fillers. Zero mass-production compromise.",
      image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=85",
      primary_button_text: "Shop Collection",
      primary_button_link: "shop",
      secondary_button_text: "Promotions & Codes",
      secondary_button_link: "offers"
    };

    const defaultAbout = {
      tag: "ATELIER PHILOSOPHY",
      title: "Slow fashion for deliberate everyday living.",
      description: "Modern retail is crowded with synthetic polyesters and rapid trend cycles designed to disintegrate after five washes. Thread & Loom was founded to build the antithesis: long-staple organic cotton, Normandy flax, and antique shuttle-loomed selvedge.",
      image_url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
      quote: "Garments that breathe with your body and soften with each passing season.",
      quote_badge: "PURITY // 0% SYNTHETIC",
      stat1_value: "100%",
      stat1_label: "Biodegradable natural fibers only",
      stat2_value: "Zero Risk",
      stat2_label: "Doorstep Cash on Delivery"
    };

    const defaultWhyChooseUs = [
      {
        id: 1,
        icon: "HeartHandshake",
        title: "Doorstep Cash on Delivery",
        description: "Inspect fabric, texture, and fit before paying. Pay via cash or mobile QR upon delivery."
      },
      {
        id: 2,
        icon: "Truck",
        title: "Complimentary Shipping",
        description: "Enjoy free doorstep shipping on all orders exceeding $100. Dispatched within 24 hours."
      },
      {
        id: 3,
        icon: "RotateCcw",
        title: "30-Day Fit Guarantee",
        description: "Hassle-free size exchanges or doorstep returns if the silhouette doesn't feel just right."
      },
      {
        id: 4,
        icon: "ShieldCheck",
        title: "100% Natural Yarns",
        description: "Zero polyester or synthetic fillers. Sourced ethically from heritage textile mills."
      }
    ];

    const defaultGallery = [
      {
        id: 1,
        title: "French Flax Camp Shirts",
        caption: "Hand-cut linen in our Normandy partner workshop",
        tag: "Atelier",
        image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: 2,
        title: "14oz Selvedge Denim",
        caption: "Antique shuttle loom weave with red-line ticker",
        tag: "Fabrics",
        image_url: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: 3,
        title: "Tailored Oxford Weaves",
        caption: "Finished with real mother-of-pearl buttons",
        tag: "Craft",
        image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: 4,
        title: "Merino Wool Knitwear",
        caption: "19.5 micron extra-fine Scottish lambswool",
        tag: "Runway",
        image_url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80"
      }
    ];

    const defaultContact = {
      phone: "+1 (555) 234-5678",
      whatsapp: "+1 (555) 234-5678",
      whatsapp_number_clean: "15552345678",
      instagram: "https://instagram.com/threadandloom",
      instagram_handle: "@threadandloom",
      email: "contact@threadandloom.com",
      address: "142 Silkweaver Lane, Atelier Row, New York, NY 10012",
      hours: "Mon – Sat: 9:30 AM – 8:00 PM (EST)",
      google_maps_url: "https://maps.google.com/?q=SoHo+New+York+NY",
      google_maps_embed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.517374020959!2d-74.00281652336338!3d40.72594613659223!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c2598c116c4f0b%3A0x6b4501a3574c8a14!2sSoHo%2C%20New%20York%2C%20NY!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
    };

    const insertContent = 'INSERT INTO site_content (key, value) VALUES (?, ?)';
    db.run(insertContent, ['homepage_banner', JSON.stringify(defaultBanner)]);
    db.run(insertContent, ['about_us', JSON.stringify(defaultAbout)]);
    db.run(insertContent, ['why_choose_us', JSON.stringify(defaultWhyChooseUs)]);
    db.run(insertContent, ['gallery_images', JSON.stringify(defaultGallery)]);
    db.run(insertContent, ['contact_info', JSON.stringify(defaultContact)]);
    console.log('Seeded default site content blocks.');
  }

  console.log('--- Checking Enquiries ---');
  const enquiriesCount = db.get('SELECT COUNT(*) as count FROM enquiries').count;
  if (enquiriesCount === 0) {
    db.run(
      `INSERT INTO enquiries (type, name, email, phone, company_name, subject, message, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'customer',
        'Charlotte Dubois',
        'charlotte.d@example.com',
        '+1 (555) 432-8765',
        '',
        'Sizing inquiry for Relaxed Linen Shirt',
        'Hello, I normally wear a European 38. Would you recommend size Medium or Small for the French Flax linen camp collar shirt? Thank you!',
        'new',
        ''
      ]
    );

    db.run(
      `INSERT INTO enquiries (type, name, email, phone, company_name, subject, message, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'distributor_wholesale',
        'Marcus Vance',
        'marcus@nordicboutiques.co',
        '+44 20 7946 0912',
        'Nordic Craft Boutiques Ltd',
        'Stockist Inquiry - Scandinavian Retail Distribution',
        'We represent 6 luxury concept boutiques across Copenhagen and Stockholm. We are interested in stocking your 2026 Linen and Selvedge Denim lines for our autumn season. Could you share wholesale line sheets and MOQs?',
        'in_progress',
        'Sent initial wholesale catalog on Sept 17. Awaiting reply on boutique volume.'
      ]
    );
    console.log('Seeded initial customer and wholesale enquiries.');
  }

  console.log('--- Database Seeding Complete ---');
}

if (require.main === module) {
  seed();
}

module.exports = seed;

