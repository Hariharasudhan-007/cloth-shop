const assert = require('assert');
const http = require('http');
const app = require('../server/index');
const db = require('../server/db/database');
const config = require('../server/config');

let server;
let port;
let adminCookie = '';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (adminCookie && !defaultHeaders['Cookie']) {
      defaultHeaders['Cookie'] = adminCookie;
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

async function runSyncTests() {
  console.log('\n======================================================');
  console.log('   ADMIN REAL-TIME SYNC & CACHE INVARIANCE TEST SUITE  ');
  console.log('======================================================\n');

  server = app.listen(0);
  port = server.address().port;

  try {
    // 1. Authenticate as Admin
    console.log('1. Authenticating admin...');
    const loginRes = await request('POST', '/api/admin/login', {
      email: config.adminEmail,
      password: config.adminDefaultPassword
    });
    assert.strictEqual(loginRes.status, 200, 'Admin login failed');
    const setCookie = loginRes.headers['set-cookie'];
    assert(setCookie && setCookie.length > 0, 'No set-cookie returned');
    adminCookie = setCookie[0].split(';')[0];
    console.log('   [PASS] Authenticated successfully');

    // 2. Verify No-Cache Headers on /api endpoints
    console.log('2. Verifying HTTP no-cache headers...');
    const dashRes = await request('GET', '/api/admin/dashboard');
    assert.strictEqual(dashRes.status, 200);
    assert(
      dashRes.headers['cache-control'] && dashRes.headers['cache-control'].includes('no-store'),
      'Cache-Control header missing no-store'
    );
    assert.strictEqual(dashRes.headers['pragma'], 'no-cache');
    assert.strictEqual(dashRes.headers['expires'], '0');
    console.log('   [PASS] No-cache headers confirmed on /api/admin/dashboard');

    // 3. Verify Initial Metrics Integrity
    console.log('3. Verifying initial metrics schema and fulfillment breakdown...');
    const metrics1 = dashRes.body.metrics;
    assert(metrics1, 'Missing metrics object');
    assert(typeof metrics1.pendingFulfillment === 'number', 'Missing pendingFulfillment count');
    assert(typeof metrics1.pendingOrders === 'number', 'Missing pendingOrders count');
    assert(typeof metrics1.processingOrders === 'number', 'Missing processingOrders count');
    assert(typeof metrics1.shippedOrders === 'number', 'Missing shippedOrders count');
    assert(typeof metrics1.deliveredOrders === 'number', 'Missing deliveredOrders count');
    assert(typeof metrics1.cancelledOrders === 'number', 'Missing cancelledOrders count');
    assert.strictEqual(
      metrics1.pendingFulfillment,
      metrics1.pendingOrders + metrics1.processingOrders,
      'pendingFulfillment must equal pendingOrders + processingOrders'
    );
    console.log(`   [PASS] Initial Pending Fulfillment: ${metrics1.pendingFulfillment} (${metrics1.pendingOrders} Pending + ${metrics1.processingOrders} Processing)`);

    // 4. Create an order to test live fulfillment updates
    console.log('4. Creating test order...');
    const testProduct = db.get('SELECT * FROM products WHERE stock > 5 AND is_active = 1 LIMIT 1');
    assert(testProduct, 'No active test product found');

    const orderRes = await request('POST', '/api/orders', {
      customer_name: 'Dashboard Sync Tester',
      customer_email: `synctest.${Date.now()}@threadandloom.com`,
      customer_phone: '+1 555-0199',
      shipping_address: '100 Broadway, Suite 400',
      city: 'New York',
      postal_code: '10001',
      payment_method: 'cod',
      items: [
        {
          product_id: testProduct.id,
          quantity: 1
        }
      ]
    });
    assert.strictEqual(orderRes.status, 201, 'Failed to create test order');
    const newOrderId = orderRes.body.order.id;
    console.log(`   [PASS] Created Order #${newOrderId} (Status: pending)`);

    // 5. Check dashboard immediately reflects the new pending order
    console.log('5. Checking dashboard immediately reflects new order...');
    const dashAfterOrder = await request('GET', '/api/admin/dashboard');
    const metrics2 = dashAfterOrder.body.metrics;
    assert.strictEqual(
      metrics2.pendingOrders,
      metrics1.pendingOrders + 1,
      'pendingOrders should increment by 1'
    );
    assert.strictEqual(
      metrics2.pendingFulfillment,
      metrics1.pendingFulfillment + 1,
      'pendingFulfillment should increment by 1'
    );
    console.log(`   [PASS] Pending Fulfillment immediately incremented to ${metrics2.pendingFulfillment}`);

    // 6. Transition Order Status: pending -> processing
    console.log('6. Transitioning order from pending -> processing...');
    const updateRes1 = await request('PATCH', `/api/admin/orders/${newOrderId}/status`, {
      status: 'processing',
      comment: 'Started packing garment'
    });
    assert.strictEqual(updateRes1.status, 200);

    const dashAfterProcessing = await request('GET', '/api/admin/dashboard');
    const metrics3 = dashAfterProcessing.body.metrics;
    assert.strictEqual(
      metrics3.pendingOrders,
      metrics2.pendingOrders - 1,
      'pendingOrders should decrement by 1'
    );
    assert.strictEqual(
      metrics3.processingOrders,
      metrics2.processingOrders + 1,
      'processingOrders should increment by 1'
    );
    // Crucially: pendingFulfillment (pending + processing) must remain active!
    assert.strictEqual(
      metrics3.pendingFulfillment,
      metrics2.pendingFulfillment,
      'pendingFulfillment should remain constant during pending -> processing'
    );
    console.log(`   [PASS] pendingOrders decremented, processingOrders incremented, pendingFulfillment maintained (${metrics3.pendingFulfillment})`);

    // 7. Transition Order Status: processing -> shipped
    console.log('7. Transitioning order from processing -> shipped...');
    const updateRes2 = await request('PATCH', `/api/admin/orders/${newOrderId}/status`, {
      status: 'shipped',
      comment: 'Courier pickup complete'
    });
    assert.strictEqual(updateRes2.status, 200);

    const dashAfterShipped = await request('GET', '/api/admin/dashboard');
    const metrics4 = dashAfterShipped.body.metrics;
    assert.strictEqual(
      metrics4.processingOrders,
      metrics3.processingOrders - 1,
      'processingOrders should decrement by 1'
    );
    assert.strictEqual(
      metrics4.shippedOrders,
      metrics3.shippedOrders + 1,
      'shippedOrders should increment by 1'
    );
    // Crucially: pendingFulfillment MUST decrement now that the order has shipped!
    assert.strictEqual(
      metrics4.pendingFulfillment,
      metrics3.pendingFulfillment - 1,
      'pendingFulfillment must decrement by 1 when processing order transitions to shipped'
    );
    console.log(`   [PASS] Shipped order deducted from pendingFulfillment: now ${metrics4.pendingFulfillment}`);

    // 8. Toggle Featured Products and verify metrics immediately update
    console.log('8. Testing featured products toggle and dashboard reflection...');
    const currentFeaturedCount = metrics4.featuredProducts;
    const isFeaturedNow = !!testProduct.is_featured;
    const newFeaturedState = !isFeaturedNow;

    const toggleRes = await request('PATCH', `/api/admin/products/${testProduct.id}/featured`, {
      is_featured: newFeaturedState
    });
    assert.strictEqual(toggleRes.status, 200);

    const dashAfterFeatured = await request('GET', '/api/admin/dashboard');
    const metrics5 = dashAfterFeatured.body.metrics;
    assert.strictEqual(
      metrics5.featuredProducts,
      currentFeaturedCount + (newFeaturedState ? 1 : -1),
      'featuredProducts count in dashboard must reflect the toggle'
    );
    console.log(`   [PASS] Featured product count dynamically updated from ${currentFeaturedCount} to ${metrics5.featuredProducts}`);

    // Revert featured toggle
    await request('PATCH', `/api/admin/products/${testProduct.id}/featured`, {
      is_featured: isFeaturedNow
    });

    console.log('\n------------------------------------------------------');
    console.log('  ALL REAL-TIME DASHBOARD & CACHE TESTS PASSED!       ');
    console.log('------------------------------------------------------\n');
  } catch (err) {
    console.error('\n[FAIL] Test encountered error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runSyncTests();
