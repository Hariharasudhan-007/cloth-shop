import React, { useState, useEffect } from 'react';
import {
  DollarSign, ShoppingBag, Clock, AlertTriangle, LogOut, ArrowRight,
  Package, RefreshCw, Star, MessageSquare, Globe, Phone, Settings,
  CheckCircle2, Menu, X, Layers, ExternalLink, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AdminProducts } from './AdminProducts';
import { AdminOrders } from './AdminOrders';
import { AdminContent } from './AdminContent';
import { AdminContact } from './AdminContact';
import { AdminEnquiries } from './AdminEnquiries';
import { AdminFeatured } from './AdminFeatured';
import { AdminSettings } from './AdminSettings';

export function AdminDashboard({ onNavigateToStore }) {
  const { adminUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  // 'overview' | 'products' | 'featured' | 'content' | 'contact' | 'enquiries' | 'orders' | 'settings'
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadDashboard = async (silent = false) => {
    if (!silent && !dashboardData) {
      setLoading(true);
    }
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch dashboard on tab switch
  useEffect(() => {
    if (activeTab === 'overview') {
      loadDashboard(true);
    }
  }, [activeTab]);

  // Listen for admin data mutations from any component or API call
  useEffect(() => {
    const handleDataUpdated = () => {
      loadDashboard(true);
    };
    window.addEventListener('tl_admin_data_updated', handleDataUpdated);
    return () => window.removeEventListener('tl_admin_data_updated', handleDataUpdated);
  }, []);

  const pendingFulfillmentCount = dashboardData?.metrics?.pendingFulfillment ?? dashboardData?.metrics?.pendingOrders ?? 0;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: ShoppingBag },
    { id: 'products', label: 'Products & Catalog', icon: Package },
    { id: 'featured', label: 'Featured Showcase', icon: Star },
    { id: 'content', label: 'Homepage & CMS', icon: Globe },
    { id: 'contact', label: 'Contact & Social', icon: Phone },
    {
      id: 'enquiries',
      label: 'Enquiries',
      icon: MessageSquare,
      badge: dashboardData?.metrics?.newEnquiries > 0 ? `${dashboardData.metrics.newEnquiries} New` : null
    },
    {
      id: 'orders',
      label: 'Orders & Fulfillment',
      icon: Clock,
      badge: pendingFulfillmentCount > 0 ? `${pendingFulfillmentCount} Due` : null
    },
    { id: 'settings', label: 'Admin Security', icon: Settings }
  ];

  return (
    <div className="admin-dashboard" style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface-bg)' }}>
      {/* Top Admin Header Bar */}
      <header style={{
        backgroundColor: '#0F1319',
        color: '#FFF',
        padding: '1rem 0',
        borderBottom: '1px solid #1E293B',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="icon-btn mobile-menu-toggle"
              style={{
                color: '#FFF',
                background: 'rgba(255,255,255,0.1)',
                display: 'none',
                width: '36px',
                height: '36px'
              }}
              aria-label="Toggle admin navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-brand-accent)'
              }}>
                Thread & Loom • Secure Atelier Portal
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Store Administration
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span className="admin-user-badge" style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
              Admin: <strong style={{ color: '#FFF' }}>{adminUser?.name || 'Administrator'}</strong>
            </span>
            <button
              onClick={onNavigateToStore}
              className="btn btn-sm btn-secondary"
              style={{
                background: '#1E293B',
                color: '#FFF',
                borderColor: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              id="admin-to-store-btn"
            >
              <ExternalLink size={13} /> View Store
            </button>
            <button
              onClick={logout}
              className="btn btn-sm btn-danger"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              id="admin-logout-btn"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation Bar (Desktop Horizontal Strip / Mobile Drawer) */}
      <nav style={{
        backgroundColor: 'var(--color-surface-card)',
        borderBottom: '1px solid var(--color-border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="container">
          <div
            className={`admin-tabs-nav ${mobileMenuOpen ? 'open' : ''}`}
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              padding: '0.5rem 0'
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    border: isActive ? 'none' : '1px solid transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    whiteSpace: 'nowrap',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.8125rem'
                  }}
                  id={`tab-${item.id}`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      backgroundColor: 'var(--color-brand-accent)',
                      color: '#0F1319',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-full)',
                      marginLeft: '2px'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Admin Content Container */}
      <main className="container" style={{ padding: '2.5rem 1.25rem 5rem' }}>
        {activeTab === 'products' && <AdminProducts onDataChanged={() => loadDashboard(true)} />}
        {activeTab === 'featured' && <AdminFeatured onDataChanged={() => loadDashboard(true)} />}
        {activeTab === 'content' && <AdminContent onDataChanged={() => loadDashboard(true)} />}
        {activeTab === 'contact' && <AdminContact onDataChanged={() => loadDashboard(true)} />}
        {activeTab === 'enquiries' && <AdminEnquiries onDataChanged={() => loadDashboard(true)} />}
        {activeTab === 'orders' && <AdminOrders onDataChanged={() => loadDashboard(true)} />}
        {activeTab === 'settings' && <AdminSettings onDataChanged={() => loadDashboard(true)} />}

        {activeTab === 'overview' && (
          <div>
            {/* Header & Refresh */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>
                  Dashboard Overview
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  Live overview of product inventory, customer inquiries, featured showcases, and website content status.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={loadDashboard}
                  disabled={loading}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <RefreshCw size={14} className={loading ? 'spinning' : ''} />
                  <span>Refresh Live Data</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '5rem 0', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                <p>Aggregating store telemetry...</p>
              </div>
            ) : dashboardData ? (
              <>
                {/* 4 PRIMARY DASHBOARD OVERVIEW CARDS */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  {/* CARD 1: TOTAL PRODUCTS */}
                  <div
                    onClick={() => setActiveTab('products')}
                    role="button"
                    tabIndex={0}
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      padding: '1.75rem',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    className="overview-metric-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                        Total Products
                      </span>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Package size={20} />
                      </div>
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-brand-primary)', lineHeight: '1.1' }}>
                      {dashboardData.metrics?.totalProducts || 0}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>Active in store catalog</span>
                      <span style={{ color: 'var(--color-brand-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        Manage <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>

                  {/* CARD 2: ENQUIRIES */}
                  <div
                    onClick={() => setActiveTab('enquiries')}
                    role="button"
                    tabIndex={0}
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      padding: '1.75rem',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    className="overview-metric-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                        Enquiries
                      </span>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#FEF3C7',
                        color: '#B45309',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <MessageSquare size={20} />
                      </div>
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-brand-primary)', lineHeight: '1.1' }}>
                      {dashboardData.metrics?.totalEnquiries || 0}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.75rem' }}>
                      <span style={{ color: dashboardData.metrics?.newEnquiries > 0 ? '#B45309' : 'var(--color-text-muted)', fontWeight: 700 }}>
                        {dashboardData.metrics?.newEnquiries || 0} New Pending
                      </span>
                      <span style={{ color: 'var(--color-brand-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        Review <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>

                  {/* CARD 3: FEATURED PRODUCTS */}
                  <div
                    onClick={() => setActiveTab('featured')}
                    role="button"
                    tabIndex={0}
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      padding: '1.75rem',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    className="overview-metric-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                        Featured Products
                      </span>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#FEF9C3',
                        color: '#CA8A04',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Star size={20} fill="#CA8A04" />
                      </div>
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-brand-primary)', lineHeight: '1.1' }}>
                      {dashboardData.metrics?.featuredProducts || 0}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>Curated for homepage</span>
                      <span style={{ color: 'var(--color-brand-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        Curate <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>

                  {/* CARD 4: WEBSITE CONTENT STATUS */}
                  <div
                    onClick={() => setActiveTab('content')}
                    role="button"
                    tabIndex={0}
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      padding: '1.75rem',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    className="overview-metric-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                        Website Content Status
                      </span>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#DCFCE7',
                        color: '#166534',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CheckCircle2 size={20} />
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: dashboardData.metrics?.contentStatus?.allConfigured ? '#166534' : '#B45309',
                      lineHeight: '1.2'
                    }}>
                      {dashboardData.metrics?.contentStatus?.allConfigured ? 'All Live & Synced' : 'Action Required'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>Banner • Story • {dashboardData.metrics?.contentStatus?.galleryCount || 0} Gallery</span>
                      <span style={{ color: 'var(--color-brand-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        Edit CMS <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECONDARY STORE HEALTH STRIP (Revenue, Orders, Low Stock) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2.5rem'
                }}>
                  <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Store Revenue</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>
                      ${(dashboardData.metrics?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Orders Received</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>
                      {dashboardData.metrics?.totalOrders || 0}
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('orders')}
                    role="button"
                    tabIndex={0}
                    style={{
                      backgroundColor: 'var(--color-surface-subtle)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Pending Fulfillment
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      marginTop: '0.25rem',
                      color: pendingFulfillmentCount > 0 ? '#B45309' : 'inherit'
                    }}>
                      {pendingFulfillmentCount} Orders
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                      {dashboardData.metrics?.pendingOrders || 0} Pending • {dashboardData.metrics?.processingOrders || 0} Processing
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Low Stock Alert (&le; 5 units)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: dashboardData.metrics?.lowStockItems > 0 ? '#B91C1C' : 'inherit' }}>
                      {dashboardData.metrics?.lowStockItems || 0} Items
                    </div>
                  </div>
                </div>

                {/* 2-COLUMN TABLES: RECENT ENQUIRIES & RECENT ORDERS */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '2rem'
                }} className="admin-dashboard-two-col">
                  {/* Recent Enquiries Preview */}
                  <div style={{
                    backgroundColor: 'var(--color-surface-card)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.75rem',
                    border: '1px solid var(--color-border-subtle)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                        Recent Customer &amp; Wholesale Enquiries
                      </h3>
                      <button
                        onClick={() => setActiveTab('enquiries')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                      >
                        View All
                      </button>
                    </div>

                    {(!dashboardData.recentEnquiries || dashboardData.recentEnquiries.length === 0) ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No enquiries submitted yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {dashboardData.recentEnquiries.map((enq) => (
                          <div
                            key={enq.id}
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--color-surface-bg)',
                              border: '1px solid var(--color-border-subtle)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                                {enq.name} {enq.company_name ? `(${enq.company_name})` : ''}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {enq.subject || 'Enquiry'} • {new Date(enq.created_at).toLocaleDateString()}
                              </div>
                            </div>

                            <span className="badge" style={{
                              fontSize: '0.7rem',
                              backgroundColor: enq.status === 'new' ? '#FEF3C7' : enq.status === 'in_progress' ? '#DBEAFE' : '#DCFCE7',
                              color: enq.status === 'new' ? '#92400E' : enq.status === 'in_progress' ? '#1E40AF' : '#166534'
                            }}>
                              {enq.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Orders Preview */}
                  <div style={{
                    backgroundColor: 'var(--color-surface-card)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.75rem',
                    border: '1px solid var(--color-border-subtle)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                        Recent Customer Orders
                      </h3>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                      >
                        View All
                      </button>
                    </div>

                    {(!dashboardData.recentOrders || dashboardData.recentOrders.length === 0) ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No orders placed yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {dashboardData.recentOrders.map((ord) => (
                          <div
                            key={ord.id}
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--color-surface-bg)',
                              border: '1px solid var(--color-border-subtle)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                                #{ord.order_number} • {ord.customer_name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                ${parseFloat(ord.total_amount).toFixed(2)} • {new Date(ord.created_at).toLocaleDateString()}
                              </div>
                            </div>

                            <span className="badge" style={{
                              fontSize: '0.7rem',
                              textTransform: 'capitalize',
                              backgroundColor:
                                ord.order_status === 'delivered' ? '#DCFCE7' :
                                ord.order_status === 'shipped' ? '#EDE9FE' :
                                ord.order_status === 'processing' ? '#DBEAFE' :
                                ord.order_status === 'cancelled' ? '#FEE2E2' : '#FEF3C7',
                              color:
                                ord.order_status === 'delivered' ? '#166534' :
                                ord.order_status === 'shipped' ? '#6D28D9' :
                                ord.order_status === 'processing' ? '#1E40AF' :
                                ord.order_status === 'cancelled' ? '#991B1B' : '#92400E'
                            }}>
                              {ord.order_status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
        .overview-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md) !important;
        }
        .admin-tabs-nav {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 0.5rem 0;
        }
        .admin-tabs-nav::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 900px) {
          .admin-dashboard-two-col {
            grid-template-columns: 1fr !important;
          }
          .mobile-menu-toggle {
            display: flex !important;
          }
          .admin-tabs-nav {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            white-space: nowrap !important;
            padding: 0.65rem 0 !important;
          }
          .admin-tabs-nav button {
            flex-shrink: 0 !important;
          }
          .admin-tabs-nav.open {
            display: flex !important;
            flex-direction: column !important;
            padding: 1rem 0 !important;
          }
          .admin-user-badge {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .admin-dashboard main.container {
            padding: 1.25rem 0.75rem 3.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}
