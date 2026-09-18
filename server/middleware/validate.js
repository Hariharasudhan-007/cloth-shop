const { isValidEmail, sanitizeString } = require('../utils/helpers');

function validateOrderInput(req, res, next) {
  const {
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    city,
    postal_code,
    payment_method,
    items,
    notes
  } = req.body;

  const errors = [];

  if (!customer_name || sanitizeString(customer_name).length < 2) {
    errors.push('Full name must be at least 2 characters.');
  }

  if (!customer_email || !isValidEmail(customer_email)) {
    errors.push('A valid email address is required.');
  }

  if (!customer_phone || sanitizeString(customer_phone).length < 7) {
    errors.push('A valid phone number is required (at least 7 digits).');
  }

  if (!shipping_address || sanitizeString(shipping_address).length < 5) {
    errors.push('Shipping address must be at least 5 characters.');
  }

  if (!city || sanitizeString(city).length < 2) {
    errors.push('City is required.');
  }

  if (!postal_code || sanitizeString(postal_code).length < 2) {
    errors.push('Postal code is required.');
  }

  // Payment method: 'cod' or online gateways ('razorpay', 'online', 'online_gateway')
  const validPaymentMethods = ['cod', 'razorpay', 'online', 'online_gateway'];
  if (!payment_method || !validPaymentMethods.includes(payment_method)) {
    errors.push('Invalid payment method selected. Please choose Cash on Delivery or Online Payment.');
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('Your shopping cart is empty. Please add items before checking out.');
  } else {
    for (let i = 0; i < items.length; i++) {
      const itm = items[i];
      const productId = parseInt(itm.product_id, 10);
      const quantity = parseInt(itm.quantity, 10);

      if (isNaN(productId) || productId <= 0) {
        errors.push(`Item #${i + 1} has an invalid product reference.`);
      }
      if (isNaN(quantity) || quantity <= 0 || quantity > 100) {
        errors.push(`Item #${i + 1} has an invalid quantity (must be between 1 and 100).`);
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  // Attach sanitized fields to req.sanitized
  req.sanitizedOrder = {
    customer_name: sanitizeString(customer_name, 100),
    customer_email: customer_email.trim().toLowerCase(),
    customer_phone: sanitizeString(customer_phone, 30),
    shipping_address: sanitizeString(shipping_address, 255),
    city: sanitizeString(city, 100),
    postal_code: sanitizeString(postal_code, 20),
    payment_method: payment_method,
    coupon_code: req.body.coupon_code ? sanitizeString(req.body.coupon_code, 50) : null,
    user_id: req.body.user_id ? parseInt(req.body.user_id, 10) : null,
    items: items.map(itm => ({
      product_id: parseInt(itm.product_id, 10),
      quantity: parseInt(itm.quantity, 10)
    })),
    notes: notes ? sanitizeString(notes, 500) : ''
  };

  next();
}

function validateProductInput(req, res, next) {
  const { name, price, category_id, stock, description, image_url, is_featured, is_active } = req.body;
  const errors = [];

  if (!name || sanitizeString(name).length < 2) {
    errors.push('Product name is required (at least 2 characters).');
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    errors.push('Product price must be a positive number.');
  }

  const parsedStock = parseInt(stock, 10);
  if (isNaN(parsedStock) || parsedStock < 0) {
    errors.push('Stock quantity must be zero or a positive integer.');
  }

  if (!description || sanitizeString(description).length < 5) {
    errors.push('Description is required (at least 5 characters).');
  }

  if (!image_url || sanitizeString(image_url).length < 3) {
    errors.push('A valid product image URL or upload path is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  req.sanitizedProduct = {
    name: sanitizeString(name, 150),
    price: parsedPrice,
    category_id: category_id ? parseInt(category_id, 10) : null,
    stock: parsedStock,
    description: sanitizeString(description, 2000),
    image_url: sanitizeString(image_url, 500),
    secondary_image_url: req.body.secondary_image_url ? sanitizeString(req.body.secondary_image_url, 500) : null,
    sizes: req.body.sizes ? sanitizeString(req.body.sizes, 255) : 'S,M,L,XL',
    is_featured: is_featured ? 1 : 0,
    is_active: is_active === undefined ? 1 : (is_active ? 1 : 0)
  };

  next();
}

function validateOrderStatusUpdate(req, res, next) {
  const { status, comment } = req.body;
  const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!status || !allowed.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Allowed statuses are: ${allowed.join(', ')}`
    });
  }

  req.sanitizedStatus = {
    status,
    comment: comment ? sanitizeString(comment, 255) : null
  };

  next();
}

module.exports = {
  validateOrderInput,
  validateProductInput,
  validateOrderStatusUpdate
};
