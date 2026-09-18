import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck, RotateCcw, Check, Sparkles, ChevronDown, ChevronUp, Ruler } from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { ProductCard } from '../components/ProductCard';
import { Modal } from '../components/Modal';

export function ProductDetailPage({ identifier, onBack, onNavigate, onCheckout }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { addRecentlyViewed } = useRecentlyViewed();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery state
  const [selectedImage, setSelectedImage] = useState('');

  // Sizing state
  const [selectedSize, setSelectedSize] = useState('M');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const availableSizes = React.useMemo(() => {
    if (!product?.sizes) return ['S', 'M', 'L', 'XL'];
    const split = product.sizes.split(',').map((s) => s.trim()).filter(Boolean);
    return split.length > 0 ? split : ['S', 'M', 'L', 'XL'];
  }, [product?.sizes]);

  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes]);

  // Quantity
  const [quantity, setQuantity] = useState(1);

  // Accordions
  const [openAccordions, setOpenAccordions] = useState({
    fabric: true,
    fit: false,
    shipping: false
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getProduct(identifier);
        setProduct(data);
        setSelectedImage(data.image_url);
        addRecentlyViewed(data);

        // Load related category products
        if (data.category_id) {
          const allCat = await api.getProducts({ category: data.category_id });
          const catList = Array.isArray(allCat) ? allCat : (allCat?.products || allCat?.data || []);
          setRelatedProducts(catList.filter((p) => p.id !== data.id).slice(0, 4));
        }
      } catch (err) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [identifier]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '7rem 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1.25rem' }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>Loading garment atelier specifications...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '6rem 0', maxWidth: '480px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-serif)' }}>Garment Unavailable</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{error || 'This archive piece could not be retrieved.'}</p>
        <button onClick={onBack} className="btn btn-primary">
          <ArrowLeft size={16} /> Return to Wardrobe Catalog
        </button>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 5;

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(product, quantity);
    }
  };

  const handleDirectCheckout = () => {
    if (!isOutOfStock) {
      const added = addToCart(product, quantity);
      if (added) {
        onCheckout();
      }
    }
  };

  // Image list for gallery
  const galleryImages = [
    product.image_url,
    ...(product.secondary_image_url ? [product.secondary_image_url] : [])
  ];

  return (
    <div className="product-detail-page" style={{ padding: '2.5rem 0 6rem' }}>
      <div className="container">
        {/* Breadcrumb navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          <button onClick={onBack} style={{ color: 'inherit', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={14} /> Catalog
          </button>
          <span>/</span>
          <span>{product.category_name || 'Apparel'}</span>
          <span>/</span>
          <span style={{ color: 'var(--color-text-main)', fontWeight: 700 }}>{product.name}</span>
        </div>

        {/* 2-Column Product Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '3.5rem',
          alignItems: 'start'
        }} className="product-detail-grid">
          {/* Left: Large Image Gallery with Multi-Angle Switcher */}
          <div>
            <div style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              backgroundColor: '#EAE6DC',
              border: '1px solid var(--color-border-subtle)',
              boxShadow: 'var(--shadow-md)'
            }}>
              <img
                src={selectedImage}
                alt={product.name}
                style={{ width: '100%', aspectRatio: '4 / 5', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                id="detail-product-image"
              />

              {product.is_featured ? (
                <span
                  className="stamp-badge"
                  style={{
                    position: 'absolute',
                    top: '1.25rem',
                    left: '1.25rem'
                  }}
                >
                  ATELIER ARCHIVE
                </span>
              ) : null}
            </div>

            {/* Gallery Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="gallery-thumbs-row">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`gallery-thumb-btn ${selectedImage === img ? 'active' : ''}`}
                    aria-label={`View angle ${idx + 1}`}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Sticky Product Information Column */}
          <div style={{ position: 'sticky', top: '6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="editorial-tag">
                {product.category_name || 'Apparel'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600 }}>
                REF #TL-0{product.id}
              </span>
            </div>

            <h1 className="heading-title" style={{ marginBottom: '0.75rem', color: 'var(--color-brand-primary)' }} id="detail-product-title">
              {product.name}
            </h1>

            {/* Price & Stock Row */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-brand-primary)' }} id="detail-product-price">
                ${parseFloat(product.price).toFixed(2)}
              </span>

              {isOutOfStock ? (
                <span className="badge badge-out-of-stock" id="stock-badge">Sold Out</span>
              ) : isLowStock ? (
                <span className="badge badge-low-stock" id="stock-badge">Low Stock: Only {product.stock} left</span>
              ) : (
                <span className="badge badge-in-stock" id="stock-badge">
                  <Check size={12} /> In Stock ({product.stock} available)
                </span>
              )}
            </div>

            {/* Description */}
            <p style={{ fontSize: '1.0625rem', lineHeight: '1.7', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
              {product.description}
            </p>

            {/* Interactive Size Variant Selector */}
            <div className="size-selector-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Select Size: <strong>{selectedSize}</strong>
                </span>
                <button
                  onClick={() => setIsSizeGuideOpen(true)}
                  style={{ fontSize: '0.8125rem', color: 'var(--color-brand-accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Ruler size={14} /> Size Guide
                </button>
              </div>

              <div className="size-pills-row">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`size-pill-btn ${selectedSize === size ? 'active' : ''}`}
                    aria-label={`Select size ${size}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and Actions Card */}
            <div style={{
              padding: '1.75rem',
              backgroundColor: 'var(--color-surface-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Quantity:</span>
                <div className="quantity-stepper">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span id="detail-quantity-display">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock || isOutOfStock}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {!isOutOfStock && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Max {product.stock} units
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="btn btn-primary btn-full"
                  style={{ padding: '1rem 1.75rem', fontSize: '1.0625rem', fontWeight: 700 }}
                  id="detail-add-to-cart-btn"
                >
                  <ShoppingBag size={18} />
                  {isOutOfStock ? 'Garment is Sold Out' : `Add ${quantity > 1 ? `(${quantity}) ` : ''}to Shopping Bag`}
                </button>

                {!isOutOfStock && (
                  <button
                    onClick={handleDirectCheckout}
                    className="btn btn-accent btn-full"
                    style={{ padding: '0.95rem 1.75rem', fontSize: '1rem', fontWeight: 700 }}
                    id="detail-buy-now-btn"
                  >
                    Buy Now with Doorstep Cash on Delivery
                  </button>
                )}
              </div>
            </div>

            {/* Expandable Accordions for Details */}
            <div className="detail-accordion">
              {/* Accordion 1: Fabric & Craftsmanship */}
              <div className="accordion-item">
                <button
                  className="accordion-header-btn"
                  onClick={() => toggleAccordion('fabric')}
                >
                  <span>Fabric Composition & Craftsmanship</span>
                  {openAccordions.fabric ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openAccordions.fabric && (
                  <div className="accordion-body">
                    Hand-finished by our atelier partners. Woven from 100% natural, unbleached yarns. Free from synthetic blends, polyester fillers, or microplastics. Machine wash cold on delicate cycle and line dry in the shade to preserve the organic flax drape.
                  </div>
                )}
              </div>

              {/* Accordion 2: Sizing & Fit */}
              <div className="accordion-item">
                <button
                  className="accordion-header-btn"
                  onClick={() => toggleAccordion('fit')}
                >
                  <span>Tailoring & Fit Guide</span>
                  {openAccordions.fit ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openAccordions.fit && (
                  <div className="accordion-body">
                    Designed for a relaxed, contemporary drape. True to European size. If you prefer a tailored silhouette, we recommend sizing down. Model is 6'1" (185cm) wearing size Large.
                  </div>
                )}
              </div>

              {/* Accordion 3: Doorstep Delivery & COD */}
              <div className="accordion-item">
                <button
                  className="accordion-header-btn"
                  onClick={() => toggleAccordion('shipping')}
                >
                  <span>Doorstep Delivery & Cash on Delivery</span>
                  {openAccordions.shipping ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openAccordions.shipping && (
                  <div className="accordion-body">
                    Dispatched within 24 hours. Cash on Delivery is fully supported: you may open the parcel and inspect the fabric quality at your door before making payment in cash or via mobile QR scan. Free shipping on orders over $100.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Complete the Look / Curated Related Pieces */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: '7rem', paddingTop: '3.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
            <div style={{ marginBottom: '2.5rem' }}>
              <span className="editorial-tag" style={{ marginBottom: '0.5rem' }}>
                COMPLETE THE SILHOUETTE
              </span>
              <h2 className="heading-title" style={{ marginTop: '0.25rem' }}>
                You Might Also Admire
              </h2>
            </div>

            <div className="products-grid">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onSelect={(sel) => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    onNavigate('product', { identifier: sel.slug || sel.id });
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size Guide Modal */}
      <Modal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        title="Atelier Sizing Chart (Inches)"
      >
        <div style={{ fontSize: '0.875rem' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            All measurements are taken flat across the garment. For exact chest fit, measure around the fullest part of your chest.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Size</th>
                <th style={{ padding: '0.75rem 1rem' }}>Chest</th>
                <th style={{ padding: '0.75rem 1rem' }}>Shoulder</th>
                <th style={{ padding: '0.75rem 1rem' }}>Length</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--color-surface-subtle)' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>S (Small)</td>
                <td style={{ padding: '0.75rem 1rem' }}>36 - 38"</td>
                <td style={{ padding: '0.75rem 1rem' }}>17.5"</td>
                <td style={{ padding: '0.75rem 1rem' }}>28.0"</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-surface-subtle)' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>M (Medium)</td>
                <td style={{ padding: '0.75rem 1rem' }}>39 - 41"</td>
                <td style={{ padding: '0.75rem 1rem' }}>18.2"</td>
                <td style={{ padding: '0.75rem 1rem' }}>29.0"</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-surface-subtle)' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>L (Large)</td>
                <td style={{ padding: '0.75rem 1rem' }}>42 - 44"</td>
                <td style={{ padding: '0.75rem 1rem' }}>19.0"</td>
                <td style={{ padding: '0.75rem 1rem' }}>30.0"</td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>XL (Extra Large)</td>
                <td style={{ padding: '0.75rem 1rem' }}>45 - 47"</td>
                <td style={{ padding: '0.75rem 1rem' }}>19.8"</td>
                <td style={{ padding: '0.75rem 1rem' }}>30.5"</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>

      <style>{`
        @media (min-width: 900px) {
          .product-detail-grid {
            grid-template-columns: 1fr 1.15fr !important;
          }
        }
      `}</style>
    </div>
  );
}
