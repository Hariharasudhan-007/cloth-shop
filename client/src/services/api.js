const API_BASE = '/api';

function notifyAdminDataChanged(type, data = null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tl_admin_data_updated', { detail: { type, data, timestamp: Date.now() } }));
  }
}

async function fetchJSON(url, options = {}) {
  const adminToken = localStorage.getItem('tl_admin_token');
  const customerToken = localStorage.getItem('tl_customer_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (adminToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  } else if (customerToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${customerToken}`;
  }

  const res = await fetch(url, {
    cache: 'no-store', // Never serve stale cached API data
    ...options,
    headers,
    credentials: 'include' // include HTTP-only cookies
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || 'A network error occurred. Please try again.';
    const err = new Error(errorMsg);
    err.status = res.status;
    err.details = data?.details;
    throw err;
  }

  return data;
}

export const api = {
  // Public Catalog & Discovery
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.featured) query.set('featured', '1');
    if (params.gender) query.set('gender', params.gender);
    if (params.collection) query.set('collection', params.collection);
    if (params.deal) query.set('deal', '1');
    if (params.sort) query.set('sort', params.sort);
    if (params.limit) query.set('limit', params.limit);
    
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchJSON(`${API_BASE}/products${qs}`);
  },

  async getProduct(identifier) {
    return fetchJSON(`${API_BASE}/products/${identifier}`);
  },

  async getCategories() {
    return fetchJSON(`${API_BASE}/categories`);
  },

  // Promotional Deals & Coupons
  async getActiveCoupons() {
    return fetchJSON(`${API_BASE}/coupons/active`);
  },

  async validateCoupon(code, subtotal) {
    return fetchJSON(`${API_BASE}/coupons/validate`, {
      method: 'POST',
      body: JSON.stringify({ code, subtotal })
    });
  },

  // Orders
  async createOrder(orderData) {
    return fetchJSON(`${API_BASE}/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  async trackOrder(orderNumber) {
    return fetchJSON(`${API_BASE}/orders/track/${encodeURIComponent(orderNumber)}`);
  },

  // Online Payment (Razorpay Architecture)
  async createRazorpayOrder(payload) {
    return fetchJSON(`${API_BASE}/payments/razorpay/create-order`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async verifyRazorpayPayment(payload) {
    return fetchJSON(`${API_BASE}/payments/razorpay/verify`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async failRazorpayPayment(payload) {
    return fetchJSON(`${API_BASE}/payments/razorpay/fail`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Customer Authentication & Account Portal
  async customerRegister(payload) {
    const res = await fetchJSON(`${API_BASE}/customer/register`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.token) {
      localStorage.setItem('tl_customer_token', res.token);
    }
    return res;
  },

  async customerLogin(email, password) {
    const res = await fetchJSON(`${API_BASE}/customer/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      localStorage.setItem('tl_customer_token', res.token);
    }
    return res;
  },

  async customerLogout() {
    localStorage.removeItem('tl_customer_token');
    return fetchJSON(`${API_BASE}/customer/logout`, { method: 'POST' });
  },

  async getCustomerMe() {
    return fetchJSON(`${API_BASE}/customer/me`);
  },

  async getCustomerOrders() {
    return fetchJSON(`${API_BASE}/customer/orders`);
  },

  async getCustomerAddresses() {
    return fetchJSON(`${API_BASE}/customer/addresses`);
  },

  async saveCustomerAddress(addressData) {
    return fetchJSON(`${API_BASE}/customer/addresses`, {
      method: 'POST',
      body: JSON.stringify(addressData)
    });
  },

  async deleteCustomerAddress(id) {
    return fetchJSON(`${API_BASE}/customer/addresses/${id}`, {
      method: 'DELETE'
    });
  },

  // Staff Admin Authentication
  async adminLogin(email, password) {
    const res = await fetchJSON(`${API_BASE}/admin/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      localStorage.setItem('tl_admin_token', res.token);
    }
    return res;
  },

  async adminLogout() {
    localStorage.removeItem('tl_admin_token');
    return fetchJSON(`${API_BASE}/admin/logout`, { method: 'POST' });
  },

  async getAdminMe() {
    return fetchJSON(`${API_BASE}/admin/me`);
  },

  // Admin Dashboard & Management
  async getDashboard() {
    return fetchJSON(`${API_BASE}/admin/dashboard`);
  },

  async getAdminProducts() {
    return fetchJSON(`${API_BASE}/admin/products`);
  },

  async createProduct(productData) {
    const res = await fetchJSON(`${API_BASE}/admin/products`, {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    notifyAdminDataChanged('product_created', res);
    return res;
  },

  async updateProduct(id, productData) {
    const res = await fetchJSON(`${API_BASE}/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
    notifyAdminDataChanged('product_updated', res);
    return res;
  },

  async deleteProduct(id) {
    const res = await fetchJSON(`${API_BASE}/admin/products/${id}`, {
      method: 'DELETE'
    });
    notifyAdminDataChanged('product_deleted', { id });
    return res;
  },

  async getAdminOrders(status = 'all', search = '') {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (search) query.set('search', search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchJSON(`${API_BASE}/admin/orders${qs}`);
  },

  async getAdminOrder(id) {
    return fetchJSON(`${API_BASE}/admin/orders/${id}`);
  },

  async updateOrderStatus(id, status, comment = null) {
    const res = await fetchJSON(`${API_BASE}/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comment })
    });
    notifyAdminDataChanged('order_status_updated', res);
    return res;
  },

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('tl_admin_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload image');
    }
    return data;
  },

  // ==========================================
  // Public Website Content & Customer Enquiries
  // ==========================================
  async getContent() {
    return fetchJSON(`${API_BASE}/content`);
  },

  async getContentBlock(key) {
    return fetchJSON(`${API_BASE}/content/${key}`);
  },

  async submitEnquiry(payload) {
    const res = await fetchJSON(`${API_BASE}/enquiries`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    notifyAdminDataChanged('enquiry_submitted', res);
    return res;
  },

  // ==========================================
  // Admin CMS & Website Content Management
  // ==========================================
  async getAdminContent() {
    return fetchJSON(`${API_BASE}/admin/content`);
  },

  async updateAdminContent(key, value) {
    const res = await fetchJSON(`${API_BASE}/admin/content/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    });
    notifyAdminDataChanged('content_updated', res);
    return res;
  },

  // ==========================================
  // Admin Categories Management
  // ==========================================
  async createCategory(categoryData) {
    const res = await fetchJSON(`${API_BASE}/admin/categories`, {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
    notifyAdminDataChanged('category_created', res);
    return res;
  },

  async updateCategory(id, categoryData) {
    const res = await fetchJSON(`${API_BASE}/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
    notifyAdminDataChanged('category_updated', res);
    return res;
  },

  async deleteCategory(id) {
    const res = await fetchJSON(`${API_BASE}/admin/categories/${id}`, {
      method: 'DELETE'
    });
    notifyAdminDataChanged('category_deleted', { id });
    return res;
  },

  // ==========================================
  // Admin Product Featured Toggle
  // ==========================================
  async toggleProductFeatured(id, is_featured = null) {
    const res = await fetchJSON(`${API_BASE}/admin/products/${id}/featured`, {
      method: 'PATCH',
      body: JSON.stringify({ is_featured })
    });
    notifyAdminDataChanged('product_featured_toggled', res);
    return res;
  },

  // ==========================================
  // Admin Customer & Wholesale Enquiries
  // ==========================================
  async getAdminEnquiries(params = {}) {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchJSON(`${API_BASE}/admin/enquiries${qs}`);
  },

  async getAdminEnquiry(id) {
    return fetchJSON(`${API_BASE}/admin/enquiries/${id}`);
  },

  async updateAdminEnquiry(id, data) {
    const res = await fetchJSON(`${API_BASE}/admin/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    notifyAdminDataChanged('enquiry_updated', res);
    return res;
  },

  async deleteAdminEnquiry(id) {
    const res = await fetchJSON(`${API_BASE}/admin/enquiries/${id}`, {
      method: 'DELETE'
    });
    notifyAdminDataChanged('enquiry_deleted', { id });
    return res;
  },

  // ==========================================
  // Admin Security & Password Change
  // ==========================================
  async changeAdminPassword(currentPassword, newPassword) {
    return fetchJSON(`${API_BASE}/admin/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }
};
