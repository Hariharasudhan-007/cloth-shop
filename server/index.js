const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config');
const seed = require('./db/seed');
const errorHandler = require('./middleware/errorHandler');

// Route handlers
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const couponsRouter = require('./routes/coupons');
const customerRouter = require('./routes/customer');
const adminRouter = require('./routes/admin');
const contentRouter = require('./routes/content');
const enquiriesRouter = require('./routes/enquiries');

// Ensure database and schema are initialized
seed();

const app = express();

// Security headers with Helmet (allow CDN images from Unsplash, Google fonts, and Razorpay payment checkout)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://*.unsplash.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com"],
        connectSrc: ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
        frameSrc: ["'self'", "https://api.razorpay.com"]
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded assets securely
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}
app.use('/uploads', express.static(config.uploadDir));

// Prevent stale HTTP caching for all API endpoints
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    store: config.storeName,
    environment: config.nodeEnv,
    time: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/customer', customerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/content', contentRouter);
app.use('/api/enquiries', enquiriesRouter);

// Serve static frontend in production (or if client dist directory exists)
const clientDistPath = path.resolve(__dirname, '../client/dist');
const rootDistPath = path.resolve(__dirname, '../dist');
const distPath = fs.existsSync(clientDistPath) ? clientDistPath : (fs.existsSync(rootDistPath) ? rootDistPath : null);

if (distPath) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    // Avoid intercepting API calls
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Helpful development message when running backend standalone
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>${config.storeName} API Server</title></head>
        <body style="font-family: system-ui, sans-serif; padding: 40px; line-height: 1.6; max-width: 650px; margin: 0 auto;">
          <h2>${config.storeName} API Server is Online</h2>
          <p>The backend REST API and SQLite database are active on port <strong>${config.port}</strong>.</p>
          <p>Run <code>npm run build</code> or start the Vite development server to launch the frontend.</p>
          <ul>
            <li><a href="/api/products">/api/products</a></li>
            <li><a href="/api/categories">/api/categories</a></li>
            <li><a href="/api/health">/api/health</a></li>
          </ul>
        </body>
      </html>
    `);
  });
}

// Global Centralized Error Handler
app.use(errorHandler);

// Start server
if (require.main === module) {
  const server = app.listen(config.port, () => {
    console.log(`[SERVER] ${config.storeName} server listening on port ${config.port} (${config.nodeEnv})`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('[SERVER] Shutting down gracefully...');
    server.close(() => {
      console.log('[SERVER] Closed all active connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = app;
