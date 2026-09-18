import React from 'react';
import { Home, Compass, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export function MobileBottomNav({ currentRoute, onNavigate, onOpenSearch, onOpenCart, onOpenWishlist }) {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { isCustomerAuthenticated } = useCustomerAuth();

  const isCurrent = (name) => currentRoute.name === name;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <button
        onClick={() => onNavigate('home')}
        className={`mobile-bottom-nav-item ${isCurrent('home') ? 'active' : ''}`}
        aria-label="Home"
      >
        <Home size={19} />
        <span>Home</span>
      </button>

      <button
        onClick={() => onNavigate('shop')}
        className={`mobile-bottom-nav-item ${isCurrent('shop') ? 'active' : ''}`}
        aria-label="The Archive"
      >
        <Compass size={19} />
        <span>Archive</span>
      </button>

      <button
        onClick={onOpenSearch}
        className="mobile-bottom-nav-item"
        aria-label="Search Collection"
      >
        <Search size={19} />
        <span>Search</span>
      </button>

      <button
        onClick={onOpenWishlist}
        className="mobile-bottom-nav-item"
        aria-label="Wishlist"
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Heart size={19} />
          {wishlistCount > 0 && (
            <span className="mobile-nav-badge">{wishlistCount}</span>
          )}
        </div>
        <span>Wishlist</span>
      </button>

      <button
        onClick={onOpenCart}
        className="mobile-bottom-nav-item"
        aria-label="Shopping Bag"
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <ShoppingBag size={19} />
          {cartCount > 0 && (
            <span className="mobile-nav-badge">{cartCount}</span>
          )}
        </div>
        <span>Bag</span>
      </button>

      <button
        onClick={() => onNavigate('account')}
        className={`mobile-bottom-nav-item ${isCurrent('account') ? 'active' : ''}`}
        aria-label="Customer Account"
      >
        <User size={19} />
        <span>{isCustomerAuthenticated ? 'Account' : 'Sign In'}</span>
      </button>
    </nav>
  );
}
