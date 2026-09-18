const assert = require('assert');
const http = require('http');
const app = require('../server/index');
const db = require('../server/db/database');
const config = require('../server/config');

let server;
let port;
let adminCookie = '';
let adminToken = '';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (adminCookie && !defaultHeaders['Cookie']) {
      defaultHeaders['Cookie'] = adminCookie;
    }
    if (adminToken && !defaultHeaders['Authorization']) {
      defaultHeaders['Authorization'] = `Bearer ${adminToken}`;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: defaultHeaders
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = data;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json
          });
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================');
  console.log('   THREAD & LOOM PRODUCTION TEST SUITE  ');
  console.log('========================================\n');

  // Start test server on dynamic port
  server = app.listen(0);
  port = server.address().port;
  console.log(`Test server running on port ${port}`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
      failed++;
    }
  }

  // Ensure test products have sufficient stock for repeatable tests
  db.run("UPDATE products SET stock = 50 WHERE stock < 10 AND is_active = 1");

  try {
    // 1. Health check
    await test('Server Health Check', async () => {
      const res = await request('GET', '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
    });

    // 2. Categories API
    await test('Public Categories Listing', async () => {
      const res = await request('GET', '/api/categories');
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body));
      assert(res.body.length >= 5);
      assert(res.body[0].product_count >= 0);
    });

    // 3. Products Catalog, Filter & Search
    let testProduct = null;
    await test('Products Search & Filtering', async () => {
      // All products
      const resAll = await request('GET', '/api/products');
      assert.strictEqual(resAll.status, 200);
      assert(resAll.body.length >= 10);
      testProduct = resAll.body[0];

      // Search query
      const resSearch = await request('GET', '/api/products?search=Linen');
      assert.strictEqual(resSearch.status, 200);
      assert(resSearch.body.length >= 1);
      assert(resSearch.body.some(p => p.name.includes('Linen')));

      // Category filter
      const resCat = await request('GET', '/api/products?category=shirts');
      assert.strictEqual(resCat.status, 200);
      assert(resCat.body.length >= 1);
      assert(resCat.body.every(p => p.category_slug === 'shirts'));
    });

    // 4. Product Detail
    await test('Product Detail by Slug / ID', async () => {
      const res = await request('GET', `/api/products/${testProduct.slug}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, testProduct.id);
      assert.strictEqual(res.body.name, testProduct.name);
    });

    // 5. Inventory Protection: Prevent ordering more stock than available
    await test('Inventory Protection: Reject Excessive Quantity', async () => {
      const res = await request('POST', '/api/orders', {
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '+15551234567',
        shipping_address: '123 Fashion Blvd',
        city: 'New York',
        postal_code: '10001',
        payment_method: 'cod',
        items: [
          {
            product_id: testProduct.id,
            quantity: 9999 // Way beyond stock!
          }
        ]
      });

      assert.strictEqual(res.status, 400);
      assert(res.body.error.includes('Insufficient stock') || res.body.error.includes('Validation failed'));
    });

    // 6. Successful Order Placement with Atomic Inventory Decrement
    let placedOrder = null;
    let initialStock = 0;
    await test('Order Creation & Atomic Inventory Decrement', async () => {
      // Pick a specific known seeded product with plenty of stock
      testProduct = db.get('SELECT * FROM products WHERE slug = ?', ['relaxed-linen-camp-collar-shirt']);
      initialStock = testProduct.stock;
      assert(initialStock >= 2);

      const uniqueEmail = `jane.doe.${Date.now()}@example.com`;
      const orderPayload = {
        customer_name: 'Jane Doe',
        customer_email: uniqueEmail,
        customer_phone: '+15559876543',
        shipping_address: `${Date.now()} High Street, Apt 3B`,
        city: 'Chicago',
        postal_code: '60601',
        payment_method: 'cod',
        items: [
          {
            product_id: testProduct.id,
            quantity: 2
          }
        ],
        notes: 'Please leave at front door'
      };

      const res = await request('POST', '/api/orders', orderPayload);
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert(res.body.order.order_number.startsWith('ORD-'));
      placedOrder = res.body.order;

      // Verify database stock decremented atomically
      const productAfter = db.get('SELECT stock FROM products WHERE id = ?', [testProduct.id]);
      assert.strictEqual(productAfter.stock, initialStock - 2);

      // Verify order items saved
      const items = db.query('SELECT * FROM order_items WHERE order_id = ?', [placedOrder.id]);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].product_name, testProduct.name);
      assert.strictEqual(items[0].product_price, testProduct.price);
    });

    // 7. Historical Order Pricing Preservation
    await test('Historical Pricing Snapshot Preservation', async () => {
      // Modify original product price
      const originalPrice = testProduct.price;
      const newPrice = originalPrice + 50.00;
      db.run('UPDATE products SET price = ? WHERE id = ?', [newPrice, testProduct.id]);

      // Check existing historical order
      const order = db.get('SELECT subtotal, total_amount FROM orders WHERE id = ?', [placedOrder.id]);
      const orderItem = db.get('SELECT product_price, subtotal FROM order_items WHERE order_id = ?', [placedOrder.id]);

      assert.strictEqual(orderItem.product_price, originalPrice);
      assert.strictEqual(orderItem.subtotal, originalPrice * 2);

      // Restore product price
      db.run('UPDATE products SET price = ? WHERE id = ?', [originalPrice, testProduct.id]);
    });

    // 8. Public Order Tracking & Contact Masking
    await test('Public Order Lookup with Privacy Masking', async () => {
      const res = await request('GET', `/api/orders/track/${placedOrder.order_number}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.order_number, placedOrder.order_number);
      assert(res.body.customer_email_masked.includes('***'));
      assert(res.body.customer_phone_masked.includes('***'));
      assert.strictEqual(res.body.order_status, 'pending');
      assert(res.body.history.length >= 1);
    });

    // 9. Admin Security: Block Unauthenticated Requests
    await test('Admin Route Protection (Reject Unauthenticated)', async () => {
      const res = await request('GET', '/api/admin/dashboard', null, { Cookie: '', Authorization: '' });
      assert.strictEqual(res.status, 401);
    });

    // 10. Admin Authentication: Login & Set Cookie
    await test('Admin Authentication with Secure Cookie', async () => {
      // Invalid login attempt
      const resBad = await request('POST', '/api/admin/login', {
        email: config.adminEmail,
        password: 'WrongPassword999!'
      });
      assert.strictEqual(resBad.status, 401);

      // Valid login
      const resGood = await request('POST', '/api/admin/login', {
        email: config.adminEmail,
        password: config.adminDefaultPassword
      });

      assert.strictEqual(resGood.status, 200);
      assert.strictEqual(resGood.body.success, true);
      assert(resGood.body.token);

      adminToken = resGood.body.token;

      // Extract set-cookie
      const setCookieHeader = resGood.headers['set-cookie'];
      assert(setCookieHeader);
      const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : setCookieHeader;
      assert(cookieStr.includes('admin_token='));
      assert(cookieStr.includes('HttpOnly') || cookieStr.includes('httponly'));
      adminCookie = cookieStr.split(';')[0];
    });

    // 11. Admin Dashboard Real SQL Metrics
    await test('Admin Dashboard Aggregates', async () => {
      const res = await request('GET', '/api/admin/dashboard');
      assert.strictEqual(res.status, 200);
      assert(res.body.metrics.totalOrders >= 1);
      assert(res.body.metrics.totalRevenue > 0);
      assert(res.body.recentOrders.length >= 1);
      assert(Array.isArray(res.body.lowStockProducts));
    });

    // 12. Admin Product Management (Add, Edit, Stock)
    let newAdminProdId = null;
    await test('Admin Product CRUD & Stock Management', async () => {
      // Create product
      const newProdPayload = {
        name: 'Fine Gauge Silk Blend Polo',
        price: 95.00,
        category_id: 1,
        stock: 15,
        description: 'Luxurious silk-cotton blend knit polo shirt.',
        image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
        is_featured: 1
      };

      const resCreate = await request('POST', '/api/admin/products', newProdPayload);
      assert.strictEqual(resCreate.status, 201);
      assert.strictEqual(resCreate.body.product.name, newProdPayload.name);
      newAdminProdId = resCreate.body.product.id;

      // Edit product & update stock
      const resEdit = await request('PUT', `/api/admin/products/${newAdminProdId}`, {
        ...newProdPayload,
        stock: 45,
        price: 99.00
      });
      assert.strictEqual(resEdit.status, 200);
      assert.strictEqual(resEdit.body.product.stock, 45);
      assert.strictEqual(resEdit.body.product.price, 99.00);

      // Verify in public catalog
      const resPublic = await request('GET', `/api/products/${newAdminProdId}`);
      assert.strictEqual(resPublic.status, 200);
      assert.strictEqual(resPublic.body.stock, 45);
    });

    // 13. Admin Order Status Update
    await test('Admin Order Status Update with History Logging', async () => {
      const res = await request('PATCH', `/api/admin/orders/${placedOrder.id}/status`, {
        status: 'processing',
        comment: 'Package packaged and awaiting courier pickup.'
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.order.order_status, 'processing');

      // Verify on public tracking endpoint
      const resTrack = await request('GET', `/api/orders/track/${placedOrder.order_number}`);
      assert.strictEqual(resTrack.status, 200);
      assert.strictEqual(resTrack.body.order_status, 'processing');
      assert(resTrack.body.history.some(h => h.status === 'processing'));
    });

    // 14. Webhook Architecture: Server-side Payment Verification with HMAC
    await test('Server-side Payment Webhook Handler (HMAC Signature Verified)', async () => {
      const crypto = require('crypto');
      const webhookPayload = {
        gateway: 'stripe',
        eventType: 'payment.succeeded',
        orderNumber: placedOrder.order_number,
        paymentId: 'pi_test_123456789',
        amount: placedOrder.total_amount
      };

      const rawBody = JSON.stringify(webhookPayload);
      
      // Test 14a: Unsigned / Bad signature must be rejected with 401
      const resBadSig = await request('POST', '/api/payments/webhook', rawBody, {
        'x-webhook-signature': 'bad_fake_signature'
      });
      assert.strictEqual(resBadSig.status, 401);

      // Test 14b: Valid HMAC SHA256 signature must be accepted with 200
      const validSignature = crypto
        .createHmac('sha256', config.paymentWebhookSecret)
        .update(rawBody)
        .digest('hex');

      const res = await request('POST', '/api/payments/webhook', rawBody, {
        'x-webhook-signature': validSignature
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.received, true);

      // Verify payment status updated in database
      const orderInDb = db.get('SELECT payment_status FROM orders WHERE id = ?', [placedOrder.id]);
      assert.strictEqual(orderInDb.payment_status, 'paid');
    });

    // 15. Product Discovery: Filtering by Gender and Collection flags
    await test('Product Discovery: Filtering by Gender and Collection', async () => {
      // 15a: Gender filter
      const resWomen = await request('GET', '/api/products?gender=women');
      assert.strictEqual(resWomen.status, 200);
      assert(resWomen.body.length >= 1, 'Should return at least 1 women product');
      assert(resWomen.body.every(p => p.gender === 'women' || p.gender === 'unisex'), 'Every item should be women or unisex');

      // 15b: New arrivals collection
      const resNew = await request('GET', '/api/products?collection=new-arrivals');
      assert.strictEqual(resNew.status, 200);
      assert(resNew.body.length >= 1, 'Should return at least 1 new arrival');
      assert(resNew.body.every(p => p.is_new_arrival === 1), 'Every item should be a new arrival');

      // 15c: Deals / Sale collection
      const resDeals = await request('GET', '/api/products?collection=deals');
      assert.strictEqual(resDeals.status, 200);
      assert(resDeals.body.length >= 1, 'Should return at least 1 deal item');
      assert(resDeals.body.every(p => p.discount_percent > 0), 'Every item should have discount');
    });

    // 16. Promotional Coupon Validation & Server-Side Price Reduction
    let couponOrder = null;
    await test('Promotional Coupon Validation & Server-Side Price Reduction', async () => {
      // 16a: Non-existent coupon
      const resInvalid = await request('POST', '/api/coupons/validate', {
        code: 'NONEXISTENT99',
        subtotal: 200
      });
      assert.strictEqual(resInvalid.status, 404);
      assert.strictEqual(resInvalid.body.valid, false);

      // 16b: Coupon with insufficient subtotal
      const resMin = await request('POST', '/api/coupons/validate', {
        code: 'ATELIER15',
        subtotal: 30
      });
      assert.strictEqual(resMin.status, 400);
      assert.strictEqual(resMin.body.valid, false);

      // 16c: Valid coupon calculation
      const resValid = await request('POST', '/api/coupons/validate', {
        code: 'ATELIER15',
        subtotal: 200
      });
      assert.strictEqual(resValid.status, 200);
      assert.strictEqual(resValid.body.valid, true);
      assert.strictEqual(resValid.body.discount_percent, 15);
      assert.strictEqual(resValid.body.discount_amount, 30);

      // 16d: Create order with coupon and verify database record
      const testProd = db.get('SELECT * FROM products WHERE stock >= 5 LIMIT 1');
      const uniqueCustomer = `coupon.shopper.${Date.now()}@example.com`;
      const resOrder = await request('POST', '/api/orders', {
        customer_name: 'Coupon Shopper',
        customer_email: uniqueCustomer,
        customer_phone: '+15559876543',
        shipping_address: '789 Atelier Way',
        city: 'Milan',
        postal_code: '20121',
        payment_method: 'cod',
        coupon_code: 'ATELIER15',
        items: [{ product_id: testProd.id, quantity: 2 }]
      });

      assert.strictEqual(resOrder.status, 201);
      couponOrder = resOrder.body.order;
      assert.strictEqual(couponOrder.coupon_code, 'ATELIER15');
      assert(couponOrder.discount_amount >= 0);
      // Total amount should equal subtotal - discount + shipping
      const expectedTotal = Math.max(0, couponOrder.subtotal - couponOrder.discount_amount + couponOrder.shipping_fee);
      assert.strictEqual(couponOrder.total_amount, expectedTotal);
    });

    // 17. Razorpay Server-side Order Initialization
    let onlineOrder = null;
    let rzpInitData = null;
    await test('Razorpay Server-side Order Initialization', async () => {
      // First create a pending order with payment_method: 'online'
      const testProd = db.get('SELECT * FROM products WHERE stock >= 5 LIMIT 1');
      const uniqueCustomer = `online.shopper.${Date.now()}@example.com`;
      const resOrder = await request('POST', '/api/orders', {
        customer_name: 'Online Shopper',
        customer_email: uniqueCustomer,
        customer_phone: '+15551122334',
        shipping_address: '456 Via Montenapoleone',
        city: 'Milan',
        postal_code: '20121',
        payment_method: 'online',
        items: [{ product_id: testProd.id, quantity: 1 }]
      });
      assert.strictEqual(resOrder.status, 201);
      onlineOrder = resOrder.body.order;

      // Initialize Razorpay order on server
      const resRzp = await request('POST', '/api/payments/razorpay/create-order', {
        orderId: onlineOrder.id,
        orderNumber: onlineOrder.order_number
      });

      assert.strictEqual(resRzp.status, 200);
      assert.strictEqual(resRzp.body.success, true);
      assert(resRzp.body.razorpayOrderId.startsWith('order_'));
      assert.strictEqual(resRzp.body.keyId, config.razorpayKeyId);
      assert.strictEqual(resRzp.body.orderNumber, onlineOrder.order_number);
      rzpInitData = resRzp.body;

      // Check database updated with gateway order ID
      const orderInDb = db.get('SELECT payment_gateway_order_id FROM orders WHERE id = ?', [onlineOrder.id]);
      assert.strictEqual(orderInDb.payment_gateway_order_id, rzpInitData.razorpayOrderId);
    });

    // 18. Razorpay Cryptographic Signature Verification & Status Update
    await test('Razorpay Cryptographic Signature Verification & Status Update', async () => {
      const crypto = require('crypto');
      const fakePaymentId = `pay_${crypto.randomBytes(6).toString('hex')}`;

      // 18a: Verification with invalid signature must fail with 400
      const resBad = await request('POST', '/api/payments/razorpay/verify', {
        orderNumber: onlineOrder.order_number,
        razorpayOrderId: rzpInitData.razorpayOrderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: 'tampered_or_invalid_signature_hex'
      });
      assert.strictEqual(resBad.status, 400);

      // 18b: Verification with valid HMAC-SHA256 signature must succeed
      const validPayload = `${rzpInitData.razorpayOrderId}|${fakePaymentId}`;
      const validSig = crypto
        .createHmac('sha256', config.razorpayKeySecret)
        .update(validPayload)
        .digest('hex');

      const resGood = await request('POST', '/api/payments/razorpay/verify', {
        orderNumber: onlineOrder.order_number,
        razorpayOrderId: rzpInitData.razorpayOrderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: validSig
      });

      assert.strictEqual(resGood.status, 200);
      assert.strictEqual(resGood.body.success, true);
      assert.strictEqual(resGood.body.paymentStatus, 'paid');

      // Check DB updated
      const orderInDb = db.get('SELECT payment_status, order_status, payment_gateway_payment_id FROM orders WHERE id = ?', [onlineOrder.id]);
      assert.strictEqual(orderInDb.payment_status, 'paid');
      assert.strictEqual(orderInDb.order_status, 'processing');
      assert.strictEqual(orderInDb.payment_gateway_payment_id, fakePaymentId);

      // 18c: Idempotency check - repeat verification should return gracefully without double-mutating
      const resRepeat = await request('POST', '/api/payments/razorpay/verify', {
        orderNumber: onlineOrder.order_number,
        razorpayOrderId: rzpInitData.razorpayOrderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: validSig
      });
      assert.strictEqual(resRepeat.status, 200);
      assert.strictEqual(resRepeat.body.alreadyProcessed, true);
    });

    // 19. Razorpay Payment Failure & Cancellation Handling
    await test('Razorpay Payment Failure & Cancellation Handling', async () => {
      // Create another order for failure simulation
      const testProd = db.get('SELECT * FROM products WHERE stock >= 5 LIMIT 1');
      const uniqueCustomer = `fail.test.${Date.now()}@example.com`;
      const resOrder = await request('POST', '/api/orders', {
        customer_name: 'Cancelled Checkout',
        customer_email: uniqueCustomer,
        customer_phone: '+15550009999',
        shipping_address: '100 Fail Safe Blvd',
        city: 'New York',
        postal_code: '10001',
        payment_method: 'online',
        items: [{ product_id: testProd.id, quantity: 1 }]
      });
      assert.strictEqual(resOrder.status, 201);
      const failOrder = resOrder.body.order;

      const resFail = await request('POST', '/api/payments/razorpay/fail', {
        orderNumber: failOrder.order_number,
        reason: 'Payment dismissed by customer in gateway modal'
      });
      assert.strictEqual(resFail.status, 200);

      // Check history recorded the cancellation event
      const history = db.query('SELECT * FROM order_status_history WHERE order_id = ?', [failOrder.id]);
      assert(history.some(h => h.comment && h.comment.toLowerCase().includes('payment failed or cancelled')));
    });

    // 20. Customer Registration, Login, Profile & Order History
    await test('Customer Registration, Login, Profile & Order History', async () => {
      const uniqueEmail = `atelier.member.${Date.now()}@threadandloom.com`;
      const customerPassword = 'SecretMember123!';

      // 20a: Register new customer
      const resReg = await request('POST', '/api/customer/register', {
        name: 'Elena Rostova',
        email: uniqueEmail,
        password: customerPassword,
        phone: '+15558887777'
      });
      assert.strictEqual(resReg.status, 201);
      assert.strictEqual(resReg.body.success, true);
      assert(resReg.body.token);
      assert.strictEqual(resReg.body.user.email, uniqueEmail);
      const customerToken = resReg.body.token;

      // 20b: Duplicate registration must be rejected with 409
      const resDup = await request('POST', '/api/customer/register', {
        name: 'Elena Duplicate',
        email: uniqueEmail,
        password: customerPassword
      });
      assert.strictEqual(resDup.status, 409);

      // 20c: Login with valid credentials
      const resLogin = await request('POST', '/api/customer/login', {
        email: uniqueEmail,
        password: customerPassword
      });
      assert.strictEqual(resLogin.status, 200);
      assert.strictEqual(resLogin.body.success, true);
      assert.strictEqual(resLogin.body.user.name, 'Elena Rostova');

      // 20d: Fetch customer profile with token
      const resProfile = await request('GET', '/api/customer/me', null, {
        Authorization: `Bearer ${customerToken}`
      });
      assert.strictEqual(resProfile.status, 200);
      assert.strictEqual(resProfile.body.user.email, uniqueEmail);

      // 20e: Save a customer delivery address
      const resAddAddr = await request('POST', '/api/customer/addresses', {
        full_name: 'Elena Rostova',
        phone: '+15558887777',
        street_address: '45 Rue de Rivoli',
        city: 'Paris',
        postal_code: '75001',
        is_default: true
      }, {
        Authorization: `Bearer ${customerToken}`
      });
      assert.strictEqual(resAddAddr.status, 201);
      assert.strictEqual(resAddAddr.body.address.city, 'Paris');

      // 20f: List saved customer addresses
      const resGetAddr = await request('GET', '/api/customer/addresses', null, {
        Authorization: `Bearer ${customerToken}`
      });
      assert.strictEqual(resGetAddr.status, 200);
      assert.strictEqual(resGetAddr.body.length, 1);
      assert.strictEqual(resGetAddr.body[0].city, 'Paris');

      // 20g: Place an order linked to this customer
      const testProd = db.get('SELECT * FROM products WHERE stock >= 5 LIMIT 1');
      const resCustOrder = await request('POST', '/api/orders', {
        customer_name: 'Elena Rostova',
        customer_email: uniqueEmail,
        customer_phone: '+15558887777',
        shipping_address: '45 Rue de Rivoli',
        city: 'Paris',
        postal_code: '75001',
        payment_method: 'cod',
        user_id: resProfile.body.user.id,
        items: [{ product_id: testProd.id, quantity: 1 }]
      });
      assert.strictEqual(resCustOrder.status, 201);
      const custPlacedOrder = resCustOrder.body.order;

      // 20h: Query customer orders endpoint
      const resOrdersList = await request('GET', '/api/customer/orders', null, {
        Authorization: `Bearer ${customerToken}`
      });
      assert.strictEqual(resOrdersList.status, 200);
      assert(resOrdersList.body.length >= 1);
      assert(resOrdersList.body.some(o => o.order_number === custPlacedOrder.order_number));
    });

    // -------------------------------------------------------------
    // TEST 21: Public Content Retrieval & Enquiry Submission
    // -------------------------------------------------------------
    await test('Public Content Retrieval & Customer / Wholesale Enquiry Submission', async () => {
      // 21a: Retrieve public site content
      const resContent = await request('GET', '/api/content');
      assert.strictEqual(resContent.status, 200);
      assert(resContent.body.content);
      assert(resContent.body.content.homepage_banner);
      assert(resContent.body.content.about_us);
      assert(resContent.body.content.contact_info);
      assert(Array.isArray(resContent.body.content.why_choose_us));
      assert(Array.isArray(resContent.body.content.gallery_images));

      // 21b: Submit customer enquiry
      const resCustEnq = await request('POST', '/api/enquiries', {
        type: 'customer',
        name: 'Sophie Martin',
        email: 'sophie.m@example.com',
        phone: '+1 555 123 4567',
        subject: 'Custom Tailoring Question',
        message: 'Do you offer bespoke sleeve alterations on the linen overshirts?'
      });
      assert.strictEqual(resCustEnq.status, 201);
      assert(resCustEnq.body.success);
      assert.strictEqual(resCustEnq.body.enquiry.name, 'Sophie Martin');

      // 21c: Submit wholesale distributor enquiry
      const resWholesaleEnq = await request('POST', '/api/enquiries', {
        type: 'distributor_wholesale',
        name: 'Julian Sterling',
        email: 'julian@sterlingretail.co.uk',
        phone: '+44 20 1234 5678',
        company_name: 'Sterling Retail Group',
        subject: 'UK Distribution Partnership',
        message: 'Looking to stock Thread & Loom products in our 4 London stores.'
      });
      assert.strictEqual(resWholesaleEnq.status, 201);
      assert(resWholesaleEnq.body.success);
    });

    // -------------------------------------------------------------
    // TEST 22: Admin Dashboard Aggregates with CMS & Enquiries
    // -------------------------------------------------------------
    await test('Admin Dashboard Aggregates with CMS, Enquiries & Overview Metrics', async () => {
      const res = await request('GET', '/api/admin/dashboard');
      assert.strictEqual(res.status, 200);
      const metrics = res.body.metrics;
      assert(metrics.totalProducts > 0);
      assert(metrics.totalEnquiries >= 2);
      assert(metrics.newEnquiries >= 1);
      assert(typeof metrics.featuredProducts === 'number');
      assert(metrics.contentStatus);
      assert.strictEqual(metrics.contentStatus.bannerConfigured, true);
      assert.strictEqual(metrics.contentStatus.contactConfigured, true);
      assert(Array.isArray(res.body.recentEnquiries));
      assert(res.body.recentEnquiries.length > 0);
    });

    // -------------------------------------------------------------
    // TEST 23: Admin Content Update & Contact Information Management
    // -------------------------------------------------------------
    await test('Admin Content Update & Contact Information Management', async () => {
      // 23a: Update banner
      const newBanner = {
        badge: 'SPRING 2026 DROP',
        title: 'Tactile Poetry.',
        subtitle: 'Woven for tomorrow.',
        description: 'New season additions.',
        image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=85',
        primary_button_text: 'Shop Now',
        primary_button_link: 'shop',
        secondary_button_text: 'Offers',
        secondary_button_link: 'offers'
      };

      const resUpdateBanner = await request('PUT', '/api/admin/content/homepage_banner', { value: newBanner });
      assert.strictEqual(resUpdateBanner.status, 200);
      assert(resUpdateBanner.body.success);

      // Verify on public endpoint
      const resPub = await request('GET', '/api/content/homepage_banner');
      assert.strictEqual(resPub.status, 200);
      assert.strictEqual(resPub.body.value.title, 'Tactile Poetry.');

      // 23b: Update contact info
      const newContact = {
        phone: '+1 (555) 999-0000',
        whatsapp: '+1 (555) 999-0000',
        whatsapp_number_clean: '15559990000',
        instagram: 'https://instagram.com/threadandloom_official',
        instagram_handle: '@threadandloom_official',
        email: 'concierge@threadandloom.com',
        address: '200 Mercer St, SoHo, NY 10012',
        hours: 'Everyday 10am - 8pm',
        google_maps_url: 'https://maps.google.com/?q=SoHo+NY',
        google_maps_embed: 'https://maps.google.com/embed'
      };
      const resUpdateContact = await request('PUT', '/api/admin/content/contact_info', { value: newContact });
      assert.strictEqual(resUpdateContact.status, 200);
    });

    // -------------------------------------------------------------
    // TEST 24: Admin Enquiry Processing Workflow
    // -------------------------------------------------------------
    await test('Admin Enquiry Management Workflow (Filter, Status Update, Notes, Delete)', async () => {
      // 24a: List enquiries filtered by type
      const resListWholesale = await request('GET', '/api/admin/enquiries?type=distributor_wholesale');
      assert.strictEqual(resListWholesale.status, 200);
      assert(resListWholesale.body.length >= 1);
      assert(resListWholesale.body.every(e => e.type === 'distributor_wholesale'));

      const enquiryId = resListWholesale.body[0].id;

      // 24b: Update status to in_progress with internal staff notes
      const resPatch = await request('PATCH', `/api/admin/enquiries/${enquiryId}`, {
        status: 'in_progress',
        notes: 'Called buyer, requested sample swatch pack.'
      });
      assert.strictEqual(resPatch.status, 200);
      assert.strictEqual(resPatch.body.enquiry.status, 'in_progress');
      assert.strictEqual(resPatch.body.enquiry.notes, 'Called buyer, requested sample swatch pack.');

      // 24c: Delete a customer enquiry
      const resListCust = await request('GET', '/api/admin/enquiries?type=customer');
      assert(resListCust.body.length >= 1);
      const toDeleteId = resListCust.body[0].id;
      const resDelete = await request('DELETE', `/api/admin/enquiries/${toDeleteId}`);
      assert.strictEqual(resDelete.status, 200);
      assert(resDelete.body.success);
    });

    // -------------------------------------------------------------
    // TEST 25: Admin Category Management & Product Variant Controls
    // -------------------------------------------------------------
    await test('Admin Category CRUD & Product Sizes / Featured Toggles', async () => {
      // 25a: Create category
      const resNewCat = await request('POST', '/api/admin/categories', {
        name: 'Footwear & Loafers',
        description: 'Hand-welted leather and suede footwear.',
        image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80'
      });
      assert.strictEqual(resNewCat.status, 201);
      assert.strictEqual(resNewCat.body.category.name, 'Footwear & Loafers');
      const catId = resNewCat.body.category.id;

      // 25b: Update category
      const resUpdCat = await request('PUT', `/api/admin/categories/${catId}`, {
        name: 'Footwear & Mule Atelier',
        description: 'Updated footwear description'
      });
      assert.strictEqual(resUpdCat.status, 200);
      assert.strictEqual(resUpdCat.body.category.name, 'Footwear & Mule Atelier');

      // 25c: Create product with sizes variant
      const resNewProd = await request('POST', '/api/admin/products', {
        name: 'Hand-Stitched Suede Loafers',
        price: 185.00,
        stock: 12,
        category_id: catId,
        description: 'Soft calfskin suede with Vibram rubber sole.',
        image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
        secondary_image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
        sizes: '40,41,42,43,44,45',
        is_featured: 1
      });
      assert.strictEqual(resNewProd.status, 201);
      assert.strictEqual(resNewProd.body.product.sizes, '40,41,42,43,44,45');
      assert.strictEqual(resNewProd.body.product.is_featured, 1);
      const prodId = resNewProd.body.product.id;

      // 25d: Fast toggle featured status
      const resToggle = await request('PATCH', `/api/admin/products/${prodId}/featured`, {
        is_featured: 0
      });
      assert.strictEqual(resToggle.status, 200);
      assert.strictEqual(resToggle.body.is_featured, 0);

      // 25e: Safely delete category
      const resDelCat = await request('DELETE', `/api/admin/categories/${catId}`);
      assert.strictEqual(resDelCat.status, 200);
    });

    // -------------------------------------------------------------
    // TEST 26: Admin Password Change Security
    // -------------------------------------------------------------
    await test('Admin Password Change Security & Validation', async () => {
      // 26a: Reject mismatching current password
      const resWrong = await request('POST', '/api/admin/change-password', {
        currentPassword: 'WrongPassword999!',
        newPassword: 'NewAdminPass2026!'
      });
      assert.strictEqual(resWrong.status, 401);

      // 26b: Reject too short password (< 8 chars)
      const resShort = await request('POST', '/api/admin/change-password', {
        currentPassword: config.adminDefaultPassword,
        newPassword: 'short'
      });
      assert.strictEqual(resShort.status, 400);

      // 26c: Update password successfully
      const resSuccess = await request('POST', '/api/admin/change-password', {
        currentPassword: config.adminDefaultPassword,
        newPassword: 'NewAdminPass2026!'
      });
      assert.strictEqual(resSuccess.status, 200);
      assert(resSuccess.body.success);

      // 26d: Restore default password for consistency
      const resRestore = await request('POST', '/api/admin/change-password', {
        currentPassword: 'NewAdminPass2026!',
        newPassword: config.adminDefaultPassword
      });
      assert.strictEqual(resRestore.status, 200);
    });

  } finally {
    server.close();
  }

  console.log('\n----------------------------------------');
  console.log(`Tests Complete: ${passed} Passed, ${failed} Failed`);
  console.log('----------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
