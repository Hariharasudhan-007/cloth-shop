import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function CartDrawer({ onCheckout, onContinueShopping }) {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    cartCount,
    cartSubtotal,
    shippingFee,
    cartTotal,
    updateQuantity,
    removeFromCart,
    freeShippingProgress,
    freeShippingRemaining,
    FREE_SHIPPING_THRESHOLD
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div
      className="drawer-backdrop"
      onClick={() => setIsCartOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart Drawer"
    >
      <div
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <ShoppingBag size={20} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              Shopping Bag ({cartCount})
            </h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="icon-btn"
            style={{ width: '2rem', height: '2rem' }}
            aria-label="Close Shopping Bag"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div style={{ padding: '0.85rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
            {freeShippingRemaining > 0 ? (
              <span>Add <strong>${freeShippingRemaining.toFixed(2)}</strong> more for <strong>FREE Shipping</strong></span>
            ) : (
              <span style={{ color: 'var(--color-success)' }}>🎉 You have unlocked <strong>FREE Shipping!</strong></span>
            )}
            <span>{Math.round(freeShippingProgress)}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${freeShippingProgress}%`,
                height: '100%',
                background: freeShippingRemaining === 0 ? 'var(--color-success)' : 'var(--color-brand-accent)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Drawer Body - Items List */}
        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty-state-card" style={{ margin: 'auto 0' }}>
              <div style={{ background: 'var(--color-surface-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-full)' }}>
                <ShoppingBag size={32} color="var(--color-text-muted)" />
              </div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Your bag is empty</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: '240px' }}>
                Discover timeless apparel pieces tailored for everyday elegance.
              </p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onContinueShopping();
                }}
                className="btn btn-primary btn-sm"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="cart-item-row">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="cart-item-thumb"
                />

                <div className="cart-item-info">
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                      {item.category_name || 'Apparel'}
                    </span>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-main)', lineHeight: '1.3' }}>
                      {item.name}
                    </h4>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
                      ${parseFloat(item.price).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div className="quantity-stepper">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      style={{ color: 'var(--color-danger)', padding: '4px', opacity: 0.8 }}
                      title="Remove item"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="drawer-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9375rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
              <span style={{ fontWeight: 700 }}>${cartSubtotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9375rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Shipping</span>
              <span style={{ fontWeight: 600 }}>
                {shippingFee === 0 ? (
                  <span style={{ color: 'var(--color-success)' }}>FREE</span>
                ) : (
                  `$${shippingFee.toFixed(2)}`
                )}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '1.125rem', fontWeight: 800, borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem' }}>
              <span>Estimated Total</span>
              <span style={{ color: 'var(--color-brand-primary)' }}>${cartTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={() => {
                setIsCartOpen(false);
                onCheckout();
              }}
              className="btn btn-primary btn-full"
              style={{ padding: '0.9rem 1.5rem', fontSize: '1rem' }}
              id="drawer-proceed-checkout"
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
