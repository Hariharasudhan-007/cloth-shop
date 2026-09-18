const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET || 'fallback_development_secret_thread_and_loom_2026',
  databasePath: process.env.DATABASE_PATH
    ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
    : path.resolve(__dirname, '../data/store.db'),
  uploadDir: process.env.UPLOAD_DIR
    ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
    : path.resolve(__dirname, '../uploads'),
  storeName: process.env.STORE_NAME || 'Thread & Loom',
  currencySymbol: process.env.CURRENCY_SYMBOL || '$',
  currencyCode: process.env.CURRENCY_CODE || 'USD',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@threadandloom.com',
  adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'AdminPass123!',
  paymentWebhookSecret: process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || 'whsec_dev_local_test_key',
  // Razorpay Payment Configuration
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_threadandloom',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_local_test',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || 'whsec_dev_local_test_key',
  paymentMode: process.env.PAYMENT_MODE || 'sandbox'
};

module.exports = config;
