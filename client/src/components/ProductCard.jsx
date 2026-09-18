import React from 'react';
import { ShoppingBag, Heart, ArrowUpRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export function ProductCard({ product, onSelect }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isWishlisted = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 5;

  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  return (
    <article
      className="product-card"
      onClick={() => onSelect(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(product)}
      aria-label={`View details for ${product.name}`}
    >
      {/* Product Image Area with Secondary Angle Hover & Wishlist */}
      <div className="product-card-img-wrap">
        {/* Primary photography */}
        <img
          src={product.image_url}
          alt={product.name}
          className="product-card-img-primary"
          loading="lazy"
        />

        {/* Secondary lifestyle angle on hover (if available) */}
        {product.secondary_image_url && (
          <img
            src={product.secondary_image_url}
            alt={`${product.name} detail view`}
            className="product-card-img-secondary"
            loading="lazy"
          />
        )}

        {/* Wishlist Heart Toggle */}
        <button
          onClick={handleToggleWishlist}
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Stock / Editorial Badge */}
        <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 3, display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
          {isOutOfStock ? (
            <span className="badge badge-out-of-stock">Sold Out</span>
          ) : isLowStock ? (
            <span className="badge badge-low-stock">Only {product.stock} Left</span>
          ) : product.discount_percent > 0 ? (
            <span className="badge" style={{ backgroundColor: 'var(--color-brand-terracotta)', color: '#FFF' }}>
              -{product.discount_percent}% OFF
            </span>
          ) : product.is_new_arrival ? (
            <span className="stamp-badge">NEW ARRIVAL</span>
          ) : product.is_best_seller ? (
            <span className="stamp-badge">BEST SELLER</span>
          ) : product.is_featured ? (
            <span className="stamp-badge">ATELIER SELECTION</span>
          ) : null}
        </div>

        {/* Slide-up Quick Add Button */}
        <div className="product-card-quick-add">
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="btn btn-sm btn-primary btn-full"
            style={{
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-md)'
            }}
            title={isOutOfStock ? 'Sold out' : 'Quick Add to Cart'}
          >
            <ShoppingBag size={14} />
            {isOutOfStock ? 'Out of Stock' : 'Quick Add to Bag'}
          </button>
        </div>
      </div>

      {/* Card Content & Price */}
      <div className="product-card-content">
        <span className="product-category-tag">
          {product.category_name || 'Apparel'}
        </span>

        <h3 className="product-card-title">{product.name}</h3>

        <div className="product-card-price-row">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span className="product-card-price">
              ${parseFloat(product.price).toFixed(2)}
            </span>
            {product.discount_percent > 0 && (
              <span style={{ fontSize: '0.8125rem', textDecoration: 'line-through', color: 'var(--color-text-light)' }}>
                ${(parseFloat(product.price) / (1 - product.discount_percent / 100)).toFixed(2)}
              </span>
            )}
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
            Explore <ArrowUpRight size={12} />
          </span>
        </div>
      </div>
    </article>
  );
}
