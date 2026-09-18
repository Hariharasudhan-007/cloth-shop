import React, { useState, useEffect } from 'react';
import {
  User,
  PackageCheck,
  MapPin,
  Heart,
  Clock,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';

export function AccountPage({ initialTab = 'orders', onNavigate, onSelectProduct }) {
  const { customer, isCustomerAuthenticated, login, register, logout, savedAddresses, addAddress, removeAddress } = useCustomerAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { recentlyViewed } = useRecentlyViewed();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Auth form state
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [authError, setAuthError] = useState(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // New address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    street_address: '',
    city: '',
    postal_code: '',
    is_default: false
  });

  // Sync initial tab if passed
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Load customer orders when authenticated
  useEffect(() => {
    if (isCustomerAuthenticated) {
      setLoadingOrders(true);
      api.getCustomerOrders()
        .then((data) => setOrders(data || []))
        .catch((err) => console.error('Failed to load customer orders', err))
        .finally(() => setLoadingOrders(false));
    }
  }, [isCustomerAuthenticated]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    try {
      if (authMode === 'login') {
        await login(authForm.email, authForm.password);
        showToast('Welcome back to Thread & Loom!', 'success');
      } else {
        await register(authForm);
        showToast('Account registered successfully! Welcome to Thread & Loom.', 'success');
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
      showToast(err.message || 'Authentication error', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      await addAddress(addressForm);
      showToast('Delivery address saved.', 'success');
      setShowAddressForm(false);
      setAddressForm({
        full_name: '',
        phone: '',
        street_address: '',
        city: '',
        postal_code: '',
        is_default: false
      });
    } catch (err) {
      showToast(err.message || 'Failed to save address', 'error');
    }
  };

  // If user is not authenticated, display clean Client Portal login/register screen
  if (!isCustomerAuthenticated) {
    return (
      <div className="account-auth-page" style={{ padding: '4rem 0 6rem' }}>
        <div className="container" style={{ maxWidth: '480px' }}>
          <div className="auth-card">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span className="editorial-tag">CLIENT ATELIER ACCESS</span>
              <h1 className="heading-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>
                {authMode === 'login' ? 'Sign In to Your Account' : 'Create an Atelier Account'}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginTop: '0.5rem' }}>
                Track your active orders, manage delivery addresses, and sync your wardrobe wishlist.
              </p>
            </div>

            {authError && (
              <div className="form-error-alert" style={{ marginBottom: '1.5rem' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="register-name">Full Name *</label>
                  <input
                    id="register-name"
                    type="text"
                    placeholder="e.g. Eleanor Vance"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="auth-email">Email Address *</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="e.g. eleanor@example.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="auth-password">Password *</label>
                <input
                  id="auth-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="btn btn-primary btn-full"
                style={{ padding: '0.85rem 1.5rem', fontWeight: 700, marginTop: '1rem' }}
              >
                {authSubmitting ? (
                  <div className="spinner spinner-light" style={{ margin: '0 auto' }} />
                ) : (
                  <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
              {authMode === 'login' ? (
                <span>
                  Don't have an account yet?{' '}
                  <button
                    onClick={() => { setAuthMode('register'); setAuthError(null); }}
                    style={{ color: 'var(--color-brand-accent)', fontWeight: 700 }}
                  >
                    Register here
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    onClick={() => { setAuthMode('login'); setAuthError(null); }}
                    style={{ color: 'var(--color-brand-accent)', fontWeight: 700 }}
                  >
                    Sign in here
                  </button>
                </span>
              )}
            </div>

            {/* Demo Credential Hint */}
            <div style={{
              marginTop: '2rem',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface-bg)',
              border: '1px solid var(--color-border-subtle)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)'
            }}>
              <strong>Sample Client Login:</strong><br />
              Email: <code>customer@threadandloom.com</code><br />
              Password: <code>CustomerPass123!</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="account-dashboard-page" style={{ padding: '3rem 0 6rem' }}>
      <div className="container">
        {/* User Greeting Bar */}
        <div className="account-header-bar">
          <div>
            <span className="editorial-tag">CLIENT ATELIER PROFILE</span>
            <h1 className="heading-title" style={{ fontSize: '2rem', marginTop: '0.25rem' }}>
              Hello, {customer.name}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              Member since {new Date(customer.created_at || Date.now()).toLocaleDateString()} • {customer.email}
            </p>
          </div>
          <button onClick={logout} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="account-tabs-row">
          <button
            onClick={() => setActiveTab('orders')}
            className={`account-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          >
            <PackageCheck size={16} /> My Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`account-tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
          >
            <MapPin size={16} /> Delivery Addresses ({savedAddresses.length})
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`account-tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
          >
            <Heart size={16} /> Wishlist ({wishlist.length})
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`account-tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
          >
            <Clock size={16} /> Recently Viewed ({recentlyViewed.length})
          </button>
        </div>

        {/* Tab 1: Orders History */}
        {activeTab === 'orders' && (
          <div>
            {loadingOrders ? (
              <div style={{ padding: '4rem 0', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </div>
            ) : orders.length === 0 ? (
              <div className="account-empty-state">
                <PackageCheck size={36} color="var(--color-text-light)" />
                <h3>No Orders Placed Yet</h3>
                <p>When you complete a purchase, you can monitor its courier tracking and delivery progress here.</p>
                <button onClick={() => onNavigate('shop')} className="btn btn-primary btn-sm">
                  Start Shopping
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {orders.map((order) => (
                  <div key={order.id} className="order-history-card">
                    <div className="order-card-header">
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          ORDER REFERENCE
                        </div>
                        <strong style={{ fontSize: '1.0625rem' }}>{order.order_number}</strong>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                          Placed on {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={`badge ${order.payment_status === 'paid' ? 'badge-in-stock' : 'badge-low-stock'}`}>
                          Payment: {order.payment_status.toUpperCase()} ({order.payment_method.toUpperCase()})
                        </span>
                        <span className="badge badge-in-stock">
                          Status: {order.order_status.toUpperCase()}
                        </span>
                        <button
                          onClick={() => onNavigate('track', { orderNumber: order.order_number })}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                        >
                          <PackageCheck size={14} /> Live Tracking
                        </button>
                      </div>
                    </div>

                    <div className="order-card-items">
                      {order.items?.map((item) => (
                        <div key={item.id} className="order-card-item">
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="order-item-thumb"
                            onClick={() => item.product_slug && onNavigate('product', { identifier: item.product_slug })}
                          />
                          <div style={{ flex: 1 }}>
                            <h4
                              onClick={() => item.product_slug && onNavigate('product', { identifier: item.product_slug })}
                              style={{ fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              {item.product_name}
                            </h4>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                              Qty: {item.quantity} &times; ${item.product_price.toFixed(2)}
                            </span>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                            ${item.subtotal.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-footer">
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        Delivering to: <strong>{order.shipping_address}, {order.city}</strong>
                      </div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                        Total: ${order.total_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Saved Delivery Addresses */}
        {activeTab === 'addresses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Saved Delivery Addresses</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  Speed up future checkouts by saving your frequently used shipping locations.
                </p>
              </div>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} /> Add Address
              </button>
            </div>

            {showAddressForm && (
              <form onSubmit={handleAddAddressSubmit} className="add-address-form">
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>New Address</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      value={addressForm.full_name}
                      onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Street Address *</label>
                  <input
                    type="text"
                    value={addressForm.street_address}
                    onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                    className="form-input"
                    placeholder="Apt, Suite, Building, Street"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Postal Code *</label>
                    <input
                      type="text"
                      value={addressForm.postal_code}
                      onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary btn-sm">Save Address</button>
                  <button type="button" onClick={() => setShowAddressForm(false)} className="btn btn-secondary btn-sm">Cancel</button>
                </div>
              </form>
            )}

            <div className="addresses-grid">
              {savedAddresses.map((addr) => (
                <div key={addr.id} className="address-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong>{addr.full_name}</strong>
                    {addr.is_default === 1 && (
                      <span className="badge badge-in-stock" style={{ fontSize: '0.6875rem' }}>Default</span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', lineHeight: '1.5' }}>
                    {addr.street_address}<br />
                    {addr.city}, {addr.postal_code}<br />
                    Phone: {addr.phone}
                  </p>
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => removeAddress(addr.id)}
                      className="icon-btn"
                      style={{ color: 'var(--color-text-light)', padding: '4px' }}
                      title="Delete address"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Wishlist */}
        {activeTab === 'wishlist' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>My Saved Wardrobe Pieces ({wishlist.length})</h3>
            </div>
            {wishlist.length === 0 ? (
              <div className="account-empty-state">
                <Heart size={36} color="var(--color-text-light)" />
                <h3>Your Wishlist is Empty</h3>
                <p>Click the heart icon on any garment to save it for easy access later.</p>
                <button onClick={() => onNavigate('shop')} className="btn btn-primary btn-sm">
                  Discover Apparel
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {wishlist.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onSelect={onSelectProduct}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Recently Viewed */}
        {activeTab === 'recent' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recently Inspected Silhouettes ({recentlyViewed.length})</h3>
            </div>
            {recentlyViewed.length === 0 ? (
              <div className="account-empty-state">
                <Clock size={36} color="var(--color-text-light)" />
                <h3>No Recently Viewed Pieces</h3>
                <p>As you explore garments in the catalog, they will appear here for fast reference.</p>
                <button onClick={() => onNavigate('shop')} className="btn btn-primary btn-sm">
                  Explore The Archive
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {recentlyViewed.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onSelect={onSelectProduct}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
