import React from 'react';
import { X, Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export function WishlistDrawer({ onContinueShopping, onNavigateToProduct }) {
  const { wishlist, isWishlistOpen, setIsWishlistOpen, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!isWishlistOpen) return null;

  const handleMoveToCart = (item) => {
    if (item.stock > 0) {
      addToCart(item, 1);
      removeFromWishlist(item.id);
    }
  };

  return (
    <div className="cart-backdrop" onClick={() => setIsWishlistOpen(false)}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Heart size={20} color="var(--color-danger)" fill="var(--color-danger)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Saved Wishlist ({wishlist.length})
            </h3>
          </div>
          <button
            onClick={() => setIsWishlistOpen(false)}
            className="icon-btn"
            aria-label="Close Wishlist"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="cart-body">
          {wishlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-surface-bg)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-light)',
                marginBottom: '1rem'
              }}>
                <Heart size={28} />
              </div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Your Wishlist is Empty
              </h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Save your favorite atelier garments and limited-run silhouettes to inspect or purchase later.
              </p>
              <button
                onClick={() => {
                  setIsWishlistOpen(false);
                  onContinueShopping();
                }}
                className="btn btn-primary"
              >
                Browse Archive
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {wishlist.map((item) => {
                const isOutOfStock = item.stock <= 0;
                return (
                  <div key={item.id} className="cart-item">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="cart-item-img"
                      onClick={() => {
                        setIsWishlistOpen(false);
                        onNavigateToProduct(item);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <div className="cart-item-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4
                            className="cart-item-title"
                            onClick={() => {
                              setIsWishlistOpen(false);
                              onNavigateToProduct(item);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {item.name}
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {item.category_name || 'Apparel'}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          style={{ color: 'var(--color-text-light)', padding: '4px' }}
                          title="Remove from wishlist"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                        <span className="cart-item-price">
                          ${parseFloat(item.price).toFixed(2)}
                        </span>
                        {isOutOfStock ? (
                          <span className="badge badge-out-of-stock" style={{ fontSize: '0.6875rem' }}>
                            Sold Out
                          </span>
                        ) : (
                          <span className="badge badge-in-stock" style={{ fontSize: '0.6875rem' }}>
                            In Stock
                          </span>
                        )}
                      </div>

                      {/* Move to bag action */}
                      <div style={{ marginTop: '0.75rem' }}>
                        <button
                          onClick={() => handleMoveToCart(item)}
                          disabled={isOutOfStock}
                          className="btn btn-secondary btn-sm"
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            fontSize: '0.8125rem',
                            padding: '0.45rem 0.75rem'
                          }}
                        >
                          <ShoppingBag size={14} />
                          {isOutOfStock ? 'Currently Unavailable' : 'Move to Bag'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {wishlist.length > 0 && (
          <div className="cart-footer">
            <button
              onClick={() => {
                setIsWishlistOpen(false);
                onContinueShopping();
              }}
              className="btn btn-primary btn-full"
              style={{ fontWeight: 700 }}
            >
              Continue Exploring <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
