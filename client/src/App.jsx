import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { SearchModal } from './components/SearchModal';
import { ContactModal } from './components/ContactModal';
import { MobileBottomNav } from './components/MobileBottomNav';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { AccountPage } from './pages/AccountPage';
import { OffersPage } from './pages/OffersPage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';

function AppContent() {
  const { isAuthenticated: isAdminAuthenticated, loading: authLoading } = useAuth();
  const { setIsCartOpen } = useCart();
  const { isWishlistOpen, setIsWishlistOpen } = useWishlist();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactModalType, setContactModalType] = useState('customer');

  const handleOpenContact = (type = 'customer') => {
    setContactModalType(type);
    setIsContactOpen(true);
  };

  // Route state: { name: string, params: any }
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (path === 'admin' || hash === 'admin' || hash === 'admin-dashboard') return { name: 'admin-dashboard', params: null };
    if (hash === 'admin-login') return { name: 'admin-login', params: null };
    if (hash === 'shop') return { name: 'shop', params: null };
    if (hash === 'track') return { name: 'track', params: null };
    if (hash === 'account') return { name: 'account', params: null };
    if (hash === 'offers') return { name: 'offers', params: null };
    return { name: 'home', params: null };
  });

  // Global keyboard shortcut: Cmd+K or Ctrl+K opens SearchModal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track browser history hash
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'admin' || hash === 'admin-dashboard') setRoute({ name: 'admin-dashboard', params: null });
      else if (hash === 'admin-login') setRoute({ name: 'admin-login', params: null });
      else if (hash === 'shop') setRoute({ name: 'shop', params: null });
      else if (hash === 'track') setRoute({ name: 'track', params: null });
      else if (hash === 'account') setRoute({ name: 'account', params: null });
      else if (hash === 'offers') setRoute({ name: 'offers', params: null });
      else if (hash === 'home' || hash === '') setRoute({ name: 'home', params: null });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (name, params = null) => {
    window.location.hash = name;
    setRoute({ name, params });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminView = route.name.startsWith('admin-');

  // Render current page
  const renderPage = () => {
    switch (route.name) {
      case 'home':
        return (
          <HomePage
            onNavigate={navigateTo}
            onSelectProduct={(p) => navigateTo('product', { identifier: p.slug || p.id })}
            onOpenContact={handleOpenContact}
          />
        );

      case 'shop':
        return (
          <ShopPage
            initialCategory={route.params?.category || ''}
            initialSearch={route.params?.search || ''}
            initialGender={route.params?.gender || ''}
            initialCollection={route.params?.collection || ''}
            onSelectProduct={(p) => navigateTo('product', { identifier: p.slug || p.id })}
          />
        );

      case 'product':
        return (
          <ProductDetailPage
            identifier={route.params?.identifier}
            onBack={() => navigateTo('shop')}
            onNavigate={navigateTo}
            onCheckout={() => navigateTo('checkout')}
          />
        );

      case 'checkout':
        return (
          <CheckoutPage
            onBack={() => navigateTo('shop')}
            onOrderSuccess={(order) => navigateTo('confirmation', { order })}
          />
        );

      case 'confirmation':
        return (
          <OrderConfirmation
            order={route.params?.order}
            onTrackOrder={(orderNumber) => navigateTo('track', { orderNumber })}
            onContinueShopping={() => navigateTo('shop')}
          />
        );

      case 'track':
        return (
          <OrderTrackingPage
            initialOrderNumber={route.params?.orderNumber || ''}
            onBack={() => navigateTo('shop')}
          />
        );

      case 'account':
        return (
          <AccountPage
            initialTab={route.params?.tab || 'orders'}
            onNavigate={navigateTo}
            onSelectProduct={(p) => navigateTo('product', { identifier: p.slug || p.id })}
          />
        );

      case 'offers':
        return (
          <OffersPage
            onNavigate={navigateTo}
            onSelectProduct={(p) => navigateTo('product', { identifier: p.slug || p.id })}
          />
        );

      case 'admin-login':
        return (
          <AdminLogin
            onLoginSuccess={() => navigateTo('admin-dashboard')}
            onBackToStore={() => navigateTo('home')}
          />
        );

      case 'admin-dashboard':
        if (authLoading) {
          return (
            <div style={{ padding: '6rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <p>Verifying staff privileges...</p>
            </div>
          );
        }
        if (!isAdminAuthenticated) {
          return (
            <AdminLogin
              onLoginSuccess={() => navigateTo('admin-dashboard')}
              onBackToStore={() => navigateTo('home')}
            />
          );
        }
        return <AdminDashboard onNavigateToStore={() => navigateTo('home')} />;

      default:
        return (
          <HomePage
            onNavigate={navigateTo}
            onSelectProduct={(p) => navigateTo('product', { identifier: p.slug || p.id })}
          />
        );
    }
  };

  return (
    <>
      {!isAdminView && (
        <Navbar
          currentRoute={route}
          setCurrentRoute={setRoute}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenWishlist={() => setIsWishlistOpen(true)}
        />
      )}

      <main style={{ paddingBottom: !isAdminView ? '4.5rem' : 0 }}>{renderPage()}</main>

      {!isAdminView && (
        <>
          <CartDrawer
            onCheckout={() => navigateTo('checkout')}
            onContinueShopping={() => navigateTo('shop')}
          />
          <WishlistDrawer
            onContinueShopping={() => navigateTo('shop')}
            onNavigateToProduct={(p) => navigateTo('product', { identifier: p.slug || p.id })}
          />
          <SearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onNavigate={navigateTo}
            onSelectProduct={(p) => navigateTo('product', { identifier: p.slug || p.id })}
          />
          <MobileBottomNav
            currentRoute={route}
            onNavigate={navigateTo}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenWishlist={() => setIsWishlistOpen(true)}
          />
          <ContactModal
            isOpen={isContactOpen}
            onClose={() => setIsContactOpen(false)}
            defaultType={contactModalType}
          />
          <Footer setCurrentRoute={setRoute} onOpenContact={handleOpenContact} />
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <WishlistProvider>
          <CustomerAuthProvider>
            <RecentlyViewedProvider>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </RecentlyViewedProvider>
          </CustomerAuthProvider>
        </WishlistProvider>
      </CartProvider>
    </ToastProvider>
  );
}
