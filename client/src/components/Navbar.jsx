import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Shield,
  PackageCheck,
  Heart,
  ChevronDown,
  User,
  Sparkles,
  Tag,
  HelpCircle,
  MapPin,
  Ruler,
  Truck,
  RotateCcw,
  PhoneCall
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { MegaMenu } from './MegaMenu';

export function Navbar({ currentRoute, setCurrentRoute, onOpenSearch, onOpenWishlist }) {
  const { cartCount, setIsCartOpen } = useCart();
  const { isAuthenticated: isAdminAuthenticated } = useAuth();
  const { wishlistCount } = useWishlist();
  const { customer, isCustomerAuthenticated, logout: customerLogout } = useCustomerAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null); // 'men' | 'women' | 'collections' | 'categories' | null
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const moreMenuRef = useRef(null);
  const accountMenuRef = useRef(null);

  // Cart badge pulse animation
  useEffect(() => {
    if (cartCount > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 450);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  // Scroll detection for sticky elevated glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setIsMoreMenuOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setIsMoreMenuOpen(false);
        setIsAccountMenuOpen(false);
        setActiveMegaMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNav = (route, params = null) => {
    setMobileMenuOpen(false);
    setActiveMegaMenu(null);
    setIsMoreMenuOpen(false);
    setIsAccountMenuOpen(false);
    setCurrentRoute({ name: route, params });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMegaHover = (menuName) => {
    setActiveMegaMenu(menuName);
  };

  return (
    <header className={`site-header ${isScrolled ? 'header-scrolled' : ''}`}>
      {/* Top Announcement Bar */}
      <div className="header-announcement-bar">
        <div className="container announcement-content">
          <div className="announcement-left">
            <span>✦ 100% FRENCH FLAX LINEN & RAW OKAYAMA SELVEDGE</span>
          </div>
          <div className="announcement-right">
            <span>FREE SHIPPING OVER $100</span>
            <span className="bullet-sep">•</span>
            <span style={{ color: 'var(--color-brand-accent)', fontWeight: 700 }}>DOORSTEP COD AVAILABLE</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="container">
        <div className="header-inner">
          {/* Mobile Menu Hamburger Trigger */}
          <button
            className="icon-btn mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
            id="mobile-nav-hamburger-btn"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* High-Fashion Atelier Brand Logo */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNav('home');
            }}
            className="brand-logo"
            id="brand-header-logo"
          >
            THREAD & LOOM
            <span className="tag">ATELIER</span>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="nav-links">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                handleNav('home');
              }}
              className={`nav-link ${currentRoute.name === 'home' ? 'active' : ''}`}
              onMouseEnter={() => setActiveMegaMenu(null)}
            >
              Home
            </a>

            <a
              href="#shop"
              onClick={(e) => {
                e.preventDefault();
                handleNav('shop');
              }}
              className={`nav-link ${currentRoute.name === 'shop' && !currentRoute.params?.gender && !currentRoute.params?.collection ? 'active' : ''}`}
              onMouseEnter={() => setActiveMegaMenu(null)}
            >
              Shop
            </a>

            <button
              onClick={() => handleNav('shop', { collection: 'new-arrivals' })}
              className={`nav-link-btn ${currentRoute.params?.collection === 'new-arrivals' ? 'active' : ''}`}
              onMouseEnter={() => handleMegaHover('collections')}
            >
              New Arrivals
            </button>

            <button
              onClick={() => handleNav('shop', { gender: 'men' })}
              className={`nav-link-btn ${currentRoute.params?.gender === 'men' ? 'active' : ''}`}
              onMouseEnter={() => handleMegaHover('men')}
            >
              Men
              <ChevronDown size={13} className={`chevron-indicator ${activeMegaMenu === 'men' ? 'open' : ''}`} />
            </button>

            <button
              onClick={() => handleNav('shop', { gender: 'women' })}
              className={`nav-link-btn ${currentRoute.params?.gender === 'women' ? 'active' : ''}`}
              onMouseEnter={() => handleMegaHover('women')}
            >
              Women
              <ChevronDown size={13} className={`chevron-indicator ${activeMegaMenu === 'women' ? 'open' : ''}`} />
            </button>

            <button
              onClick={() => handleNav('shop', { collection: 'best-sellers' })}
              className="nav-link-btn"
              onMouseEnter={() => handleMegaHover('collections')}
            >
              Collections
              <ChevronDown size={13} className={`chevron-indicator ${activeMegaMenu === 'collections' ? 'open' : ''}`} />
            </button>

            <button
              onClick={() => handleNav('shop')}
              className="nav-link-btn"
              onMouseEnter={() => handleMegaHover('categories')}
            >
              Categories
              <ChevronDown size={13} className={`chevron-indicator ${activeMegaMenu === 'categories' ? 'open' : ''}`} />
            </button>

            {/* "More" Dropdown Menu */}
            <div className="nav-dropdown-wrapper" ref={moreMenuRef}>
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`nav-link-btn ${isMoreMenuOpen ? 'active' : ''}`}
                aria-expanded={isMoreMenuOpen}
              >
                More
                <ChevronDown size={13} className={`chevron-indicator ${isMoreMenuOpen ? 'open' : ''}`} />
              </button>

              {isMoreMenuOpen && (
                <div className="nav-dropdown-menu">
                  <button onClick={() => handleNav('track')} className="nav-dropdown-item">
                    <PackageCheck size={16} color="var(--color-brand-accent)" />
                    <div>
                      <strong>Track Order</strong>
                      <span>Real-time courier progress</span>
                    </div>
                  </button>
                  <button onClick={() => handleNav('offers')} className="nav-dropdown-item">
                    <Tag size={16} color="var(--color-brand-accent)" />
                    <div>
                      <strong>Promotions & Deals</strong>
                      <span>Active coupon codes & discounts</span>
                    </div>
                  </button>
                  <button onClick={() => handleNav('shop')} className="nav-dropdown-item">
                    <Ruler size={16} />
                    <div>
                      <strong>Atelier Size Guide</strong>
                      <span>Fit & dimensional specs</span>
                    </div>
                  </button>
                  <button onClick={() => handleNav('shop')} className="nav-dropdown-item">
                    <Truck size={16} />
                    <div>
                      <strong>Shipping Policy</strong>
                      <span>Free delivery over $100</span>
                    </div>
                  </button>
                  <button onClick={() => handleNav('shop')} className="nav-dropdown-item">
                    <RotateCcw size={16} />
                    <div>
                      <strong>Returns & Exchanges</strong>
                      <span>Hassle-free 30-day guarantee</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Header Action Utilities */}
          <div className="header-actions">
            {/* Live Search Trigger Pill (Desktop) */}
            <button
              onClick={onOpenSearch}
              className="nav-search-trigger desktop-search-pill"
              title="Search collection (⌘K)"
              aria-label="Open Search"
              id="header-search-trigger-btn"
            >
              <Search size={16} />
              <span className="search-text-placeholder">Search archive...</span>
              <kbd className="search-hotkey-badge">⌘K</kbd>
            </button>

            {/* Mobile Compact Search Icon Button */}
            <button
              onClick={onOpenSearch}
              className="icon-btn mobile-search-btn"
              title="Search collection"
              aria-label="Open Search"
              id="header-mobile-search-btn"
            >
              <Search size={18} />
            </button>

            {/* Quick Track Order Link */}
            <button
              onClick={() => handleNav('track')}
              className="icon-btn desktop-only-btn"
              title="Track Order Status"
              aria-label="Track Order"
            >
              <PackageCheck size={19} />
            </button>

            {/* Customer Account Dropdown */}
            <div className="nav-dropdown-wrapper" ref={accountMenuRef}>
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className={`icon-btn ${isCustomerAuthenticated ? 'authenticated-icon' : ''}`}
                title={isCustomerAuthenticated ? `Signed in as ${customer.name}` : 'Customer Account'}
                aria-label="Customer Account"
                id="header-account-btn"
              >
                <User size={19} color={isCustomerAuthenticated ? 'var(--color-brand-accent)' : 'currentColor'} />
              </button>

              {isAccountMenuOpen && (
                <div className="nav-dropdown-menu account-dropdown-menu">
                  {isCustomerAuthenticated ? (
                    <>
                      <div className="account-dropdown-header">
                        <strong>{customer.name}</strong>
                        <span>{customer.email}</span>
                      </div>
                      <button onClick={() => handleNav('account', { tab: 'orders' })} className="nav-dropdown-item">
                        <PackageCheck size={16} />
                        <span>My Orders</span>
                      </button>
                      <button onClick={() => handleNav('account', { tab: 'profile' })} className="nav-dropdown-item">
                        <User size={16} />
                        <span>Profile & Addresses</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onOpenWishlist();
                        }}
                        className="nav-dropdown-item"
                      >
                        <Heart size={16} />
                        <span>My Wishlist ({wishlistCount})</span>
                      </button>
                      <div className="dropdown-divider" />
                      <button
                        onClick={() => {
                          customerLogout();
                          setIsAccountMenuOpen(false);
                        }}
                        className="nav-dropdown-item logout-item"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="account-dropdown-header">
                        <strong>Atelier Client Portal</strong>
                        <span>Sign in for saved addresses & order history</span>
                      </div>
                      <button onClick={() => handleNav('account')} className="btn btn-primary btn-sm btn-full" style={{ margin: '0.5rem 0' }}>
                        Sign In / Register
                      </button>
                      <button onClick={() => handleNav('track')} className="nav-dropdown-item">
                        <PackageCheck size={16} />
                        <span>Track an Order</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist Trigger with Animated Heart and Badge */}
            <button
              onClick={onOpenWishlist}
              className="icon-btn wishlist-icon-btn"
              title={`Wishlist (${wishlistCount} items)`}
              aria-label="Open Wishlist"
              id="header-wishlist-trigger-btn"
            >
              <Heart
                size={19}
                color={wishlistCount > 0 ? 'var(--color-danger)' : 'currentColor'}
                fill={wishlistCount > 0 ? 'var(--color-danger)' : 'none'}
              />
              {wishlistCount > 0 && (
                <span className="cart-count-badge wishlist-badge">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Staff Admin Portal Shortcut */}
            <button
              onClick={() => handleNav(isAdminAuthenticated ? 'admin-dashboard' : 'admin-login')}
              className="icon-btn desktop-only-btn"
              title={isAdminAuthenticated ? 'Admin Dashboard' : 'Staff Admin Portal'}
              aria-label="Admin Portal"
            >
              <Shield size={19} color={isAdminAuthenticated ? '#C59B27' : 'currentColor'} />
            </button>

            {/* Shopping Cart Drawer Trigger with Pulse Animation */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="icon-btn"
              title="View Shopping Bag"
              aria-label="Shopping Bag"
              id="cart-drawer-trigger"
            >
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className={`cart-count-badge ${isPulsing ? 'badge-pulsing' : ''}`} id="cart-counter-badge">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mega Menu Overlay */}
        <MegaMenu
          activeMenu={activeMegaMenu}
          onClose={() => setActiveMegaMenu(null)}
          onNavigate={handleNav}
        />
      </div>

      {/* Mobile Navigation Drawer Overlay & Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          id="mobile-nav-backdrop"
        >
          <div
            className="mobile-nav-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            id="mobile-nav-drawer-panel"
          >
            {/* [HEADER] THREAD & LOOM   ATELIER   X */}
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-brand">
                <span className="mobile-drawer-brand-name">THREAD &amp; LOOM</span>
                <span className="mobile-drawer-tag">ATELIER</span>
              </div>
              <button
                type="button"
                className="mobile-drawer-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                id="mobile-drawer-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* [MENU CONTENT] Single vertical list without nested scroll areas */}
            <nav className="mobile-drawer-menu" aria-label="Mobile Navigation">
              <button
                type="button"
                onClick={() => handleNav('home')}
                className={`mobile-menu-item ${currentRoute.name === 'home' ? 'active' : ''}`}
                id="mobile-menu-home"
              >
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('shop')}
                className={`mobile-menu-item ${currentRoute.name === 'shop' && !currentRoute.params?.gender && !currentRoute.params?.collection ? 'active' : ''}`}
                id="mobile-menu-shop"
              >
                <span>All Wardrobe Pieces</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('shop', { collection: 'new-arrivals' })}
                className={`mobile-menu-item ${currentRoute.params?.collection === 'new-arrivals' ? 'active' : ''}`}
                id="mobile-menu-new-arrivals"
              >
                <span>New Arrivals</span>
                <span className="mobile-menu-badge">New</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('shop', { gender: 'men' })}
                className={`mobile-menu-item ${currentRoute.params?.gender === 'men' ? 'active' : ''}`}
                id="mobile-menu-men"
              >
                <span>Men's</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('shop', { gender: 'women' })}
                className={`mobile-menu-item ${currentRoute.params?.gender === 'women' ? 'active' : ''}`}
                id="mobile-menu-women"
              >
                <span>Women's Collection</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('shop', { collection: 'archive' })}
                className={`mobile-menu-item ${currentRoute.params?.collection === 'archive' ? 'active' : ''}`}
                id="mobile-menu-archive"
              >
                <span>Archive</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('offers')}
                className={`mobile-menu-item ${currentRoute.name === 'offers' ? 'active' : ''}`}
                id="mobile-menu-offers"
              >
                <span className="mobile-menu-highlight">Offers &amp; Deals</span>
                <Tag size={15} color="var(--color-brand-accent)" />
              </button>

              <button
                type="button"
                onClick={() => handleNav('account')}
                className={`mobile-menu-item ${currentRoute.name === 'account' ? 'active' : ''}`}
                id="mobile-menu-account"
              >
                <span>{isCustomerAuthenticated ? `Client Account (${customer.name})` : 'Client Sign In / Register'}</span>
                <User size={16} />
              </button>

              <button
                type="button"
                onClick={() => handleNav('track')}
                className={`mobile-menu-item ${currentRoute.name === 'track' ? 'active' : ''}`}
                id="mobile-menu-track"
              >
                <span>Track Order</span>
                <PackageCheck size={16} />
              </button>

              <button
                type="button"
                onClick={() => handleNav(isAdminAuthenticated ? 'admin-dashboard' : 'admin-login')}
                className="mobile-menu-item mobile-menu-admin"
                id="mobile-menu-admin"
              >
                <span>Staff Admin Login</span>
                <Shield size={16} color="var(--color-brand-accent)" />
              </button>
            </nav>

            {/* [OPTIONAL FOOTER] Contact / Instagram / WhatsApp */}
            <div className="mobile-drawer-footer">
              <div className="mobile-drawer-contact-links">
                <a
                  href="https://wa.me/15552345678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-footer-link"
                >
                  WhatsApp
                </a>
                <span className="mobile-footer-sep">•</span>
                <a
                  href="https://instagram.com/threadandloom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-footer-link"
                >
                  Instagram
                </a>
                <span className="mobile-footer-sep">•</span>
                <button
                  type="button"
                  onClick={() => handleNav('shop')}
                  className="mobile-footer-btn"
                >
                  Concierge
                </button>
              </div>
              <div className="mobile-drawer-footer-note">
                ✦ 100% French Flax Linen &amp; Raw Okayama Selvedge
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
