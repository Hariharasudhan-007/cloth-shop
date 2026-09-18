// Automated verification test for Frontend API Integration
const assert = require('assert');

async function run() {
  console.log('--- Testing Frontend API Integration ---');

  // Test 1: Fetch live products from Render API
  const prodRes = await fetch('https://cloth-shop-api.onrender.com/api/products');
  assert.strictEqual(prodRes.status, 200, 'Render API must respond with status 200');
  const products = await prodRes.json();
  assert(Array.isArray(products), 'Products must be an array');
  assert(products.length >= 12, `Expected at least 12 products, got ${products.length}`);
  console.log(`[PASS] Live Render API products returned: ${products.length} products`);

  // Test 2: Field integrity on each product
  const sample = products[0];
  const requiredFields = ['id', 'name', 'slug', 'price', 'stock', 'image_url', 'gender'];
  for (const field of requiredFields) {
    assert(sample[field] !== undefined, `Product must have field "${field}"`);
  }
  console.log('[PASS] Product object structure and required fields verified');

  // Test 3: Filter tests
  const menRes = await (await fetch('https://cloth-shop-api.onrender.com/api/products?gender=men')).json();
  assert(Array.isArray(menRes) && menRes.length > 0, 'Men filter should return products');
  for (const p of menRes) {
    assert(p.gender === 'men' || p.gender === 'unisex', `Unexpected gender in men filter: ${p.gender}`);
  }
  console.log(`[PASS] Gender filter 'men' returned ${menRes.length} items`);

  const womenRes = await (await fetch('https://cloth-shop-api.onrender.com/api/products?gender=women')).json();
  assert(Array.isArray(womenRes) && womenRes.length > 0, 'Women filter should return products');
  for (const p of womenRes) {
    assert(p.gender === 'women' || p.gender === 'unisex', `Unexpected gender in women filter: ${p.gender}`);
  }
  console.log(`[PASS] Gender filter 'women' returned ${womenRes.length} items`);

  const searchRes = await (await fetch('https://cloth-shop-api.onrender.com/api/products?search=linen')).json();
  assert(Array.isArray(searchRes) && searchRes.length > 0, 'Search filter should return products');
  console.log(`[PASS] Search query 'linen' returned ${searchRes.length} items`);

  const sortAsc = await (await fetch('https://cloth-shop-api.onrender.com/api/products?sort=price_asc')).json();
  assert(Array.isArray(sortAsc) && sortAsc.length > 1, 'Sort price_asc should return products');
  assert(sortAsc[0].price <= sortAsc[sortAsc.length - 1].price, 'First item must have lower or equal price than last');
  console.log(`[PASS] Sort 'price_asc' verified: $${sortAsc[0].price} <= $${sortAsc[sortAsc.length - 1].price}`);

  // Test 4: Categories listing
  const catRes = await fetch('https://cloth-shop-api.onrender.com/api/categories');
  assert.strictEqual(catRes.status, 200, 'Categories endpoint must return 200');
  const categories = await catRes.json();
  assert(Array.isArray(categories) && categories.length > 0, 'Categories must be an array');
  console.log(`[PASS] Live categories returned: ${categories.length} categories`);

  console.log('\nAll Frontend API integration tests passed successfully!');
}

run().catch(err => {
  console.error('[FAIL]', err);
  process.exit(1);
});
