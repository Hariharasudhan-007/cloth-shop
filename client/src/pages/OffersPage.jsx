import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, Copy, Check, ArrowRight, ShieldCheck, Percent } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ProductCard } from '../components/ProductCard';

export function OffersPage({ onSelectProduct, onNavigate }) {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    async function loadOffers() {
      try {
        const [couponsData, prodsData] = await Promise.all([
          api.getActiveCoupons(),
          api.getProducts({ deal: true })
        ]);
        setCoupons(couponsData || []);
        setSaleProducts(prodsData || []);
      } catch (err) {
        console.error('Failed to load offers', err);
      } finally {
        setLoading(false);
      }
    }
    loadOffers();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showToast(`Coupon code "${code}" copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="offers-page" style={{ padding: '3.5rem 0 6rem' }}>
      <div className="container">
        {/* Editorial Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center', maxWidth: '680px', margin: '0 auto 3.5rem' }}>
          <span className="editorial-tag" style={{ marginBottom: '0.75rem' }}>
            <Sparkles size={12} color="var(--color-brand-accent)" /> SPECIAL PRIVILEGES & DEALS
          </span>
          <h1 className="heading-title" style={{ marginTop: '0.25rem' }}>
            Promotions & Exclusive Codes
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.0625rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
            Enjoy seasonal incentives on bespoke natural flax linen, raw denim, and merino knitwear. Apply coupons directly during checkout.
          </p>
        </div>

        {/* Hero Promotional Banner */}
        <div className="offers-hero-banner">
          <div className="offers-banner-content">
            <span className="stamp-badge">LIMITED SEASON SPECIAL</span>
            <h2>Save 15% on All Orders Over $100</h2>
            <p>
              Elevate your capsule wardrobe with French linen shirts, tailored selvedge outerwear, and combed cotton staples.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <div className="coupon-code-pill">
                <span>CODE: <strong>ATELIER15</strong></span>
                <button onClick={() => handleCopyCode('ATELIER15')} className="copy-btn" aria-label="Copy code ATELIER15">
                  {copiedCode === 'ATELIER15' ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
                </button>
              </div>
              <button onClick={() => onNavigate('shop')} className="btn btn-accent btn-sm">
                Explore The Archive <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Promotional Coupons Grid */}
        <div style={{ marginBottom: '4.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
            <div>
              <span className="editorial-tag">ATELIER CODES</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>
                Verified Discount Coupons
              </h3>
            </div>
          </div>

          <div className="coupons-grid">
            {coupons.map((coupon) => (
              <div key={coupon.code} className="coupon-card">
                <div className="coupon-card-header">
                  <div className="coupon-discount-badge">
                    <Percent size={16} />
                    <span>{coupon.discount_percent}% OFF</span>
                  </div>
                  <span className="coupon-min-tag">
                    Min. ${coupon.min_order_amount}
                  </span>
                </div>

                <div className="coupon-card-body">
                  <h4 className="coupon-title">{coupon.code}</h4>
                  <p className="coupon-desc">{coupon.description || `Get ${coupon.discount_percent}% off your cart.`}</p>
                </div>

                <div className="coupon-card-footer">
                  <button
                    onClick={() => handleCopyCode(coupon.code)}
                    className="btn btn-secondary btn-sm btn-full"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check size={14} color="var(--color-success)" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discounted Garments Showcase */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="editorial-tag">CURATED OFFERS</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>
                Pieces Currently on Promotion
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
                Genuine markdown silhouettes with authentic fabric discounts.
              </p>
            </div>
            <button onClick={() => onNavigate('shop')} className="btn btn-secondary btn-sm">
              View Complete Catalog <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '4rem 0', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : saleProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--color-surface-card)', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>All current archive pieces are at standard atelier pricing.</p>
              <button onClick={() => onNavigate('shop')} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                Shop Regular Collection
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {saleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
