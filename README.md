# Thread & Loom — Production MVP E-Commerce Platform

A production-ready, mobile-responsive e-commerce platform designed for an apparel retail small business. Built with **Node.js (Express)**, **Node native SQLite (`node:sqlite`) with WAL mode**, **React 18 (Vite)**, and **Custom Modular Vanilla CSS**.

---

## Table of Contents
1. [Core Features](#core-features)
2. [Technology Stack & Architecture](#technology-stack--architecture)
3. [Quick Start (Local Development)](#quick-start-local-development)
4. [Production Build & Startup](#production-build--startup)
5. [Client Handover & Administration](#client-handover--administration)
6. [Payment System & Gateway Integration](#payment-system--gateway-integration)
7. [Database Persistence & Storage](#database-persistence--storage)
8. [Security & Hardening](#security--hardening)
9. [Live Production Deployment Guide](#live-production-deployment-guide)
10. [Custom Domain & HTTPS Configuration](#custom-domain--https-configuration)
11. [Automated Verification Tests](#automated-verification-tests)

---

## 1. Core Features

### Customer Experience
- **Hero & Curated Collections**: Brand story, seasonal banners, category showcase.
- **Product Catalog**: Live search query filtering, category pills, price & name sorting.
- **Product Details**: High-resolution photography, live stock badge (In Stock, Low Stock, Sold Out), quantity limits, fabric care specifications.
- **Interactive Cart Drawer**: Real-time quantity adjustment, persistent localStorage sync, dynamic free shipping tracker ($100 threshold).
- **Streamlined Checkout**: Clean 2-column layout, customer contact and delivery address validation, order notes.
- **Cash on Delivery (COD)**: Fully functional, production-ready zero-risk payment method.
- **Order Confirmation & Tracking**: Confirmation view with printable receipt and live tracking lookup (`/api/orders/track/:orderNumber`) with customer contact privacy masking.

### Staff Admin Portal (`/#admin`)
- **Protected Authentication**: Secure HTTP-only cookies and signed JWT verification.
- **Live Performance Dashboard**: Real database aggregates for Total Revenue, Total Orders, Pending Deliveries, and Low Stock items.
- **Inventory & Product Management**: Add, edit, and deactivate garments with live preview, category assignment, price, and stock levels.
- **Safe Image Uploads**: Strict whitelist (JPG, PNG, WebP), 5MB size limit, cryptographic random filenames.
- **Order Fulfillment**: Filter orders by status (`pending`, `processing`, `shipped`, `delivered`, `cancelled`), view item snapshots, update status with customer-visible audit comments.

---

## 2. Technology Stack & Architecture

- **Backend**: Node.js 22/24 + Express 4.x
- **Database**: Embedded SQLite via Node standard library `node:sqlite` (zero external C++ compilation needed, WAL mode enabled, foreign keys enforced).
- **Frontend**: React 18 + Vite (SPA served directly by Express in production).
- **Styling**: Modular Vanilla CSS with comprehensive CSS custom properties (design tokens), CSS Grid, and Flexbox.
- **Security**: Helmet headers, bcryptjs password hashing, JWT in HTTP-Only cookies, input sanitization middleware, rate limiting/idempotency protection.

```text
d:/cloth shop/
├── package.json              # Unified build & run scripts
├── .env.example              # Environment variables template
├── .env                      # Local environment configuration
├── README.md                 # Production & Handover documentation
├── data/
│   └── store.db              # Persistent SQLite database (WAL mode)
├── uploads/                  # Securely uploaded product images
├── server/
│   ├── index.js              # Express app entry & static file serving
│   ├── config.js             # Environment variables parser
│   ├── db/
│   │   ├── database.js       # SQLite connection with transaction helpers
│   │   ├── schema.sql        # Relational schema
│   │   └── seed.js           # Schema bootstrap & catalog seeder
│   ├── middleware/
│   │   ├── auth.js           # HTTP-only cookie JWT verification
│   │   ├── validate.js       # Strict input validation
│   │   ├── upload.js         # Multer safe image handler
│   │   └── errorHandler.js   # Centralized error handler
│   ├── routes/
│   │   ├── products.js       # Public catalog & search API
│   │   ├── categories.js     # Public category counts API
│   │   ├── orders.js         # Order creation & tracking API
│   │   ├── payments.js       # Webhook verification & payment events
│   │   └── admin.js          # Admin login, metrics, CRUD, status updates
│   └── services/
│       ├── orderService.js   # Atomic stock decrement & order transactions
│       └── paymentService.js # HMAC webhook signature verification
├── client/
│   ├── index.html            # HTML shell with Google Fonts
│   ├── vite.config.js        # Vite build configuration with API proxy
│   └── src/
│       ├── main.jsx          # React DOM mount
│       ├── App.jsx           # Client router & global providers
│       ├── index.css         # Complete design system
│       ├── context/          # CartContext, AuthContext, ToastContext
│       ├── components/       # Navbar, Footer, CartDrawer, ProductCard, Modal
│       ├── pages/            # Home, Shop, ProductDetail, Checkout, Confirmation, Tracking
│       └── services/         # Centralized API service
└── tests/
    └── run-tests.js          # Automated end-to-end integration test suite
```

---

## 3. Quick Start (Local Development)

### Prerequisites
- Node.js `v22.0.0` or higher (tested on `v24.17.0`)
- npm `10.0.0` or higher

### Steps
1. **Clone or navigate to the project directory**:
   ```bash
   cd "d:/cloth shop"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env` (already configured by default):
   ```bash
   cp .env.example .env
   ```

4. **Initialize and seed database**:
   ```bash
   npm run seed
   ```

5. **Build the frontend**:
   ```bash
   npm run build
   ```

6. **Start the application**:
   ```bash
   npm start
   ```
   Open your browser to: `http://localhost:5000`

---

## 4. Production Build & Startup

The application is structured for unified single-server production deployment:
```bash
# 1. Build optimized React assets to client/dist
npm run build

# 2. Run the production server
npm start
```
Express automatically serves the static bundle and handles all `/api/*` endpoints on `process.env.PORT` (default: 5000).

---

## 5. Client Handover & Administration

### Default Admin Credentials
- **Portal URL**: `http://your-domain.com/#admin` (or click the shield icon in the navigation bar)
- **Default Email**: `admin@threadandloom.com`
- **Default Password**: `AdminPass123!`

> [!IMPORTANT]
> **Changing Admin Password**:
> Set `ADMIN_DEFAULT_PASSWORD` in your production environment variables or update the hash directly in the `users` table.

### Daily Store Operations
1. **Fulfilling Orders**:
   - Navigate to **Orders & Deliveries**.
   - Review incoming orders marked as `pending`.
   - Once packaged, change status to `processing` and input tracking/courier notes.
   - Once courier confirms delivery, update status to `delivered`.
2. **Adding New Products**:
   - Go to **Products & Inventory** -> click **Add New Product**.
   - Enter garment name, price, stock quantity, and category.
   - Either upload a photo directly (JPG/PNG/WebP under 5MB) or provide an image URL.
   - Toggle **Feature on Home Page** to highlight top seasonal items.
3. **Monitoring Low Stock**:
   - Check the **Low Inventory Alerts** box on the dashboard. Products with 5 or fewer units remaining will appear with a warning badge.

---

## 6. Payment System & Gateway Integration

### Cash on Delivery (Active)
- Fully functional, zero-risk payment flow.
- Orders are validated and stock is locked in a database transaction upon submission.
- Payment status defaults to `pending` and is updated to `paid` by staff upon delivery collection.

### Online Payment Gateways (Stripe / Razorpay / Cashfree)
The backend includes a production-ready webhook listener (`server/routes/payments.js`):
1. Configure `PAYMENT_GATEWAY_WEBHOOK_SECRET` in `.env`.
2. Online payments are **never** marked successful based on client-side state alone.
3. The server requires cryptographic HMAC SHA256 signature verification (`x-webhook-signature`).
4. Upon verified `payment.succeeded`, the server atomically transitions the order to `paid` and status to `processing`.

---

## 7. Database Persistence & Storage

### SQLite with WAL Mode
The database file is stored at `./data/store.db` (configurable via `DATABASE_PATH`).
- WAL mode (`PRAGMA journal_mode = WAL;`) allows concurrent reads while writes take place.
- Atomic transactions (`BEGIN IMMEDIATE ... COMMIT / ROLLBACK`) prevent race conditions and over-selling inventory.

> [!WARNING]
> **Production Hosting Persistent Disk**:
> If deploying to containerized or PaaS hosts (Render, Railway, Fly.io):
> - **DO NOT** use ephemeral root filesystem storage, as container restarts will wipe the database.
> - Attach a **Persistent Volume / Disk** (e.g. mount `/data` directory) and set `DATABASE_PATH=/data/store.db` and `UPLOAD_DIR=/data/uploads`.
> - If deploying to a VPS (Ubuntu/Debian via systemd or PM2), the local filesystem is already persistent.

---

## 8. Security & Hardening

1. **HTTP-Only Cookies**: JWT authentication tokens are transmitted via `HttpOnly`, `SameSite=Lax` cookies, preventing XSS token theft.
2. **Password Hashing**: Passwords stored using `bcryptjs` with 10 salt rounds.
3. **Input Validation & Sanitization**: All inputs (orders, products, statuses) pass through strict type checking, regex validation, and length bounds.
4. **Security Headers**: Configured via `helmet` with strict CSP policies, cross-origin resource policies, and MIME protection.
5. **Production Error Safety**: Server stack traces are never exposed to clients in production (`NODE_ENV=production`).

---

## 9. Live Production Deployment Guide

### Option A: Render.com (Recommended for Fast Launch)
1. Push your repository to GitHub or GitLab.
2. Log into [Render.com](https://render.com) -> **New Web Service**.
3. Select your repository.
4. Configure Settings:
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Under **Disks** -> **Add Disk**:
   - **Name**: `store-data`
   - **Mount Path**: `/var/data`
   - **Size**: 1 GB
6. Under **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_PATH`: `/var/data/store.db`
   - `UPLOAD_DIR`: `/var/data/uploads`
   - `JWT_SECRET`: `generate_a_random_64_char_hex_key`
   - `ADMIN_EMAIL`: `owner@clientdomain.com`
   - `ADMIN_DEFAULT_PASSWORD`: `ClientStrongPassword2026!`
7. Click **Create Web Service**.

### Option B: VPS (Ubuntu 22.04 / 24.04 with PM2 + Nginx)
1. Install Node.js 22+:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx
   sudo npm install -g pm2
   ```
2. Deploy code to `/var/www/thread-and-loom`:
   ```bash
   cd /var/www/thread-and-loom
   npm install
   npm run build
   npm run seed
   ```
3. Start PM2 process:
   ```bash
   pm2 start server/index.js --name "thread-and-loom"
   pm2 save
   pm2 startup
   ```

---

## 10. Custom Domain & HTTPS Configuration

### DNS Settings
At your domain registrar (GoDaddy, Namecheap, Cloudflare, Google Domains):
1. **Root Domain (`example.com`)**:
   - **Type**: `A`
   - **Host**: `@`
   - **Value**: Public IP address of your server (or Render alias).
2. **Subdomain (`www.example.com` or `store.example.com`)**:
   - **Type**: `CNAME`
   - **Host**: `www`
   - **Value**: `example.com` (or your Render service domain, e.g. `thread-and-loom.onrender.com`).

### Automatic HTTPS (SSL)
- **On Render / Railway**: SSL certificates are provisioned automatically via Let's Encrypt with zero manual intervention.
- **On VPS with Nginx & Certbot**:
  ```bash
  sudo certbot --nginx -d example.com -d www.example.com
  ```
  Certbot automatically configures TLS 1.3 encryption and schedules automatic 90-day renewals.

---

## 11. Automated Verification Tests

Run the automated test suite anytime to verify backend integrity, database transactions, stock deduction, and admin authentication:
```bash
npm test
```

### Verified Test Cases:
- Health check endpoint
- Public categories listing with product counts
- Catalog search, category filter, and sorting
- Single product details by slug & ID
- Excessive stock rejection (ordering > stock returns 400)
- Atomic stock decrement upon order placement
- Historical pricing snapshot preservation
- Public order tracking with masked customer contact
- Admin route protection (rejecting unauthenticated requests with 401)
- Admin login with secure HTTP-only cookie issuance
- Real database dashboard aggregates
- Admin product CRUD and stock management
- Admin order status update with timeline audit logging
- Server-side payment webhook handler with HMAC SHA256 verification
