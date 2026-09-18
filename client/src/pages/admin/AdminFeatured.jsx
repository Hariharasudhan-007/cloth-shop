import React, { useState, useEffect } from 'react';
import { Star, Check, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function AdminFeatured({ onDataChanged }) {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminProducts();
      const prodList = Array.isArray(data) ? data : (data?.products || data?.data || []);
      setProducts(prodList);
    } catch (err) {
      showToast(err.message || 'Failed to load products', 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleToggleFeatured = async (product) => {
    setUpdatingId(product.id);
    const newStatus = !product.is_featured;

    try {
      await api.toggleProductFeatured(product.id, newStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_featured: newStatus ? 1 : 0 } : p))
      );
      onDataChanged?.();
      showToast(
        newStatus
          ? `"${product.name}" is now featured on the homepage!`
          : `"${product.name}" removed from homepage featured list.`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to update featured status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const featuredProducts = products.filter((p) => p.is_featured && p.is_active);
  const nonFeaturedProducts = products.filter((p) => !p.is_featured && p.is_active);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p>Loading featured products...</p>
      </div>
    );
  }

  return (
    <div className="admin-featured-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>
            Featured Products Curator
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Choose which garments appear on the prime Homepage discovery sections. Click any product to feature or unfeature.
          </p>
        </div>

        <div style={{
          backgroundColor: 'var(--color-surface-card)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Star size={18} color="var(--color-brand-accent)" fill="var(--color-brand-accent)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
            {featuredProducts.length} Featured
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            (Recommended: 4 to 8 pieces)
          </span>
        </div>
      </div>

      {/* Currently Featured Section */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <span className="editorial-tag">HOMEPAGE SHOWCASE</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            Active Featured Pieces ({featuredProducts.length})
          </h3>
        </div>

        {featuredProducts.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--color-surface-card)',
            padding: '3rem 2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--color-border-strong)'
          }}>
            <Sparkles size={32} color="var(--color-brand-accent)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>
              No garments are currently marked as featured. Click the star on any product below to promote it to the homepage!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.5rem'
          }}>
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '2px solid var(--color-brand-accent)',
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative',
                  transition: 'transform 0.2s ease'
                }}
              >
                <div style={{ position: 'relative', height: '220px', backgroundColor: '#EAE6DC' }}>
                  <img
                    src={product.image_url}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span className="stamp-badge" style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    FEATURED
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(product)}
                    disabled={updatingId === product.id}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'var(--color-brand-accent)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 'var(--radius-full)',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    title="Remove from featured"
                  >
                    <Star size={16} fill="#FFF" />
                  </button>
                </div>

                <div style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    {product.category_name || 'Apparel'}
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0.25rem 0', color: 'var(--color-brand-primary)' }}>
                    {product.name}
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>${parseFloat(product.price).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(product)}
                      disabled={updatingId === product.id}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Products Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <span className="editorial-tag">STORE CATALOG</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            Add Products to Homepage Showcase ({nonFeaturedProducts.length} available)
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.5rem'
        }}>
          {nonFeaturedProducts.map((product) => (
            <div
              key={product.id}
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--color-border-subtle)',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative', height: '200px', backgroundColor: '#EAE6DC' }}>
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => handleToggleFeatured(product)}
                  disabled={updatingId === product.id}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: 'var(--color-text-muted)',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  title="Feature on Homepage"
                >
                  <Star size={16} />
                </button>
              </div>

              <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {product.category_name || 'Apparel'}
                </div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0.25rem 0', color: 'var(--color-text-main)' }}>
                  {product.name}
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>${parseFloat(product.price).toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(product)}
                    disabled={updatingId === product.id}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                  >
                    + Feature
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
