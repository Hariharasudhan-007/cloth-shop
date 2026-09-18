import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowUpRight, Sparkles, Compass, ShieldCheck, HeartHandshake, Eye, Check, Clock, TrendingUp, Truck, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { ProductCard } from '../components/ProductCard';

export function HomePage({ onNavigate, onSelectProduct }) {
  const { recentlyViewed } = useRecentlyViewed();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic CMS Content States
  const [banner, setBanner] = useState({
    badge: '2026 ARCHIVE EDITION',
    title: 'Form meets fabric.',
    subtitle: 'Woven to endure.',
    description: 'Bespoke everyday silhouettes cut from unbleached French flax linen, Okayama raw denim, and Scottish lambswool. No synthetic fillers. Zero mass-production compromise.',
    image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=85',
    primary_button_text: 'Shop Collection',
    primary_button_link: 'shop',
    secondary_button_text: 'Promotions & Codes',
    secondary_button_link: 'offers'
  });

  const [about, setAbout] = useState({
    tag: 'ATELIER PHILOSOPHY',
    title: 'Slow fashion for deliberate everyday living.',
    description: 'Modern retail is crowded with synthetic polyesters and rapid trend cycles designed to disintegrate after five washes. Thread & Loom was founded to build the antithesis: long-staple organic cotton, Normandy flax, and antique shuttle-loomed selvedge.',
    image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80',
    quote: 'Garments that breathe with your body and soften with each passing season.',
    quote_badge: 'PURITY // 0% SYNTHETIC',
    stat1_value: '100%',
    stat1_label: 'Biodegradable natural fibers only',
    stat2_value: 'Zero Risk',
    stat2_label: 'Doorstep Cash on Delivery'
  });

  const [whyChooseUs, setWhyChooseUs] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodData, bestData, trendData, catData, contentRes] = await Promise.all([
          api.getProducts({ collection: 'new-arrivals', limit: 4 }),
          api.getProducts({ collection: 'best-sellers', limit: 4 }),
          api.getProducts({ collection: 'trending', limit: 4 }),
          api.getCategories(),
          api.getContent().catch(() => null)
        ]);
        setFeaturedProducts(prodData && prodData.length > 0 ? prodData : []);
        setBestSellers(bestData && bestData.length > 0 ? bestData : []);
        setTrendingProducts(trendData && trendData.length > 0 ? trendData : []);
        setCategories(catData || []);

        if (contentRes?.content) {
          if (contentRes.content.homepage_banner) setBanner(contentRes.content.homepage_banner);
          if (contentRes.content.about_us) setAbout(contentRes.content.about_us);
          if (Array.isArray(contentRes.content.why_choose_us)) setWhyChooseUs(contentRes.content.why_choose_us);
          if (Array.isArray(contentRes.content.gallery_images)) setGalleryImages(contentRes.content.gallery_images);
        }
      } catch (e) {
        console.error('Failed to load homepage data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="home-page">
      {/* 1. Full-Width Immersive Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#0F1319',
        overflow: 'hidden',
        color: '#FFFFFF'
      }}>
        {/* Background Fashion Imagery with Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1
        }}>
          <img
            src={banner.image_url}
            alt="Thread & Loom Atelier Collection"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 30%',
              opacity: 0.42,
              filter: 'saturate(0.9)'
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(15,19,25,0.92) 0%, rgba(15,19,25,0.7) 50%, rgba(15,19,25,0.4) 100%), linear-gradient(to top, rgba(15,19,25,0.95) 0%, transparent 40%)'
          }} />
        </div>

        {/* Hero Content */}
        <div className="container" style={{ position: 'relative', zIndex: 2, padding: '5rem 1.25rem' }}>
          <div style={{ maxWidth: '720px' }}>
            {/* Editorial Label Tag */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.75rem' }}>
              <span className="editorial-tag" style={{ background: 'rgba(255,255,255,0.12)', color: '#FFF', borderColor: 'rgba(255,255,255,0.2)' }}>
                <Sparkles size={13} color="var(--color-brand-accent)" /> {banner.badge}
              </span>
              <span className="stamp-badge">
                LIMITED RUNS
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="heading-display" style={{ color: '#FFFFFF', marginBottom: '1.5rem', lineHeight: '1.08' }}>
              {banner.title} <br />
              <span className="font-serif-italic" style={{ color: 'var(--color-brand-accent)' }}>
                {banner.subtitle}
              </span>
            </h1>

            {/* Brand statement */}
            <p style={{
              fontSize: '1.1875rem',
              lineHeight: '1.65',
              color: '#CBD5E1',
              maxWidth: '580px',
              marginBottom: '2.5rem'
            }}>
              {banner.description}
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
              <button
                onClick={() => onNavigate(banner.primary_button_link || 'shop')}
                className="btn btn-accent"
                style={{ padding: '1rem 2.25rem', fontSize: '1rem', fontWeight: 700 }}
                id="hero-shop-collection-btn"
              >
                {banner.primary_button_text || 'Shop Collection'} <ArrowRight size={18} />
              </button>
              <button
                onClick={() => onNavigate(banner.secondary_button_link || 'offers')}
                className="btn btn-secondary"
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#FFF',
                  borderColor: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                {banner.secondary_button_text || 'Promotions & Codes'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live Marquee Running Ribbon */}
      <div className="marquee-ribbon" aria-hidden="true">
        <div className="marquee-content">
          <div className="marquee-item">100% French Flax Linen <span className="accent">✦</span></div>
          <div className="marquee-item">Doorstep Cash on Delivery Available <span className="accent">✦</span></div>
          <div className="marquee-item">Instant UPI, Cards & Net Banking <span className="accent">✦</span></div>
          <div className="marquee-item">Ethically Woven in Small Runs <span className="accent">✦</span></div>
          <div className="marquee-item">Free Standard Shipping Over $100 <span className="accent">✦</span></div>
          <div className="marquee-item">Raw Japanese Selvedge Denim <span className="accent">✦</span></div>
          <div className="marquee-item">Hand-Finished Atelier Craftsmanship <span className="accent">✦</span></div>
        </div>
        <div className="marquee-content" aria-hidden="true">
          <div className="marquee-item">100% French Flax Linen <span className="accent">✦</span></div>
          <div className="marquee-item">Doorstep Cash on Delivery Available <span className="accent">✦</span></div>
          <div className="marquee-item">Instant UPI, Cards & Net Banking <span className="accent">✦</span></div>
          <div className="marquee-item">Ethically Woven in Small Runs <span className="accent">✦</span></div>
          <div className="marquee-item">Free Standard Shipping Over $100 <span className="accent">✦</span></div>
          <div className="marquee-item">Raw Japanese Selvedge Denim <span className="accent">✦</span></div>
          <div className="marquee-item">Hand-Finished Atelier Craftsmanship <span className="accent">✦</span></div>
        </div>
      </div>

      {/* 3. Asymmetric Editorial Category Masonry */}
      <section style={{ padding: '5.5rem 0 4.5rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="editorial-tag" style={{ marginBottom: '0.5rem' }}>
                EDITORIAL CATALOG // [01]
              </span>
              <h2 className="heading-title" style={{ marginTop: '0.25rem' }}>
                Curated Collections
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '0.35rem' }}>
                Tactile silhouettes organized by fiber, cut, and climate.
              </p>
            </div>
            <button
              onClick={() => onNavigate('shop')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.65rem 1.25rem' }}
            >
              View Full Archive <ArrowRight size={15} />
            </button>
          </div>

          {/* Asymmetric Magazine Masonry Grid */}
          <div className="editorial-category-grid">
            {/* Tile 1: Hero Tall Portrait */}
            <div
              className="category-masonry-tile category-tile-hero"
              onClick={() => onNavigate('shop', { category: 'shirts' })}
              role="button"
              tabIndex={0}
            >
              <img
                src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80"
                alt="Shirts & Tops Collection"
                className="category-tile-bg"
              />
              <div className="category-tile-overlay">
                <div className="category-tile-header">
                  <span className="category-tile-number">[01]</span>
                  <span className="stamp-badge">SIGNATURE WEAVE</span>
                </div>
                <div className="category-tile-footer">
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-brand-accent)', fontWeight: 700 }}>
                    French Flax & Oxford
                  </span>
                  <h3>Shirts & Tops</h3>
                  <p style={{ fontSize: '0.875rem', opacity: 0.85, maxWidth: '280px', marginBottom: '1rem', lineHeight: '1.4' }}>
                    Airy camp collars, mother-of-pearl buttons, and structured button-downs.
                  </p>
                  <span className="category-tile-link">
                    Explore Shirts <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>
            </div>

            {/* Tile 2: Offset Outerwear */}
            <div
              className="category-masonry-tile category-tile-offset"
              onClick={() => onNavigate('shop', { category: 'outerwear' })}
              role="button"
              tabIndex={0}
            >
              <img
                src="https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=800&q=80"
                alt="Outerwear & Coats"
                className="category-tile-bg"
              />
              <div className="category-tile-overlay">
                <div className="category-tile-header">
                  <span className="category-tile-number">[02]</span>
                  <span className="stamp-badge" style={{ transform: 'rotate(2deg)' }}>14OZ SELVEDGE</span>
                </div>
                <div className="category-tile-footer">
                  <h3>Outerwear</h3>
                  <span className="category-tile-link">
                    Shop Jackets <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>
            </div>

            {/* Tile 3: Stack 1 - Handcrafted Accessories */}
            <div
              className="category-masonry-tile category-tile-stack1"
              onClick={() => onNavigate('shop', { category: 'accessories' })}
              role="button"
              tabIndex={0}
            >
              <img
                src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80"
                alt="Accessories & Leather"
                className="category-tile-bg"
              />
              <div className="category-tile-overlay">
                <div className="category-tile-header">
                  <span className="category-tile-number">[03]</span>
                </div>
                <div className="category-tile-footer">
                  <h3>Accessories</h3>
                  <span className="category-tile-link">
                    View Leather <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>
            </div>

            {/* Tile 4: Wide Landscape - Merino Knitwear */}
            <div
              className="category-masonry-tile category-tile-landscape"
              onClick={() => onNavigate('shop', { category: 'knitwear' })}
              role="button"
              tabIndex={0}
            >
              <img
                src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=80"
                alt="Merino Knitwear"
                className="category-tile-bg"
              />
              <div className="category-tile-overlay">
                <div className="category-tile-header">
                  <span className="category-tile-number">[04]</span>
                  <span className="stamp-badge">19.5 MICRON</span>
                </div>
                <div className="category-tile-footer">
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-brand-accent)', fontWeight: 700 }}>
                    100% Extrafine Wool
                  </span>
                  <h3>Merino Knitwear & Cardigans</h3>
                  <span className="category-tile-link">
                    Explore Knits <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>
            </div>

            {/* Tile 5: Stack 2 - Trousers & Chinos */}
            <div
              className="category-masonry-tile category-tile-stack2"
              onClick={() => onNavigate('shop', { category: 'trousers' })}
              role="button"
              tabIndex={0}
            >
              <img
                src="https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80"
                alt="Trousers & Chinos"
                className="category-tile-bg"
              />
              <div className="category-tile-overlay">
                <div className="category-tile-header">
                  <span className="category-tile-number">[05]</span>
                  <span className="stamp-badge">TWILL & DENIM</span>
                </div>
                <div className="category-tile-footer">
                  <h3>Trousers & Chinos</h3>
                  <span className="category-tile-link">
                    Shop Bottoms <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Editorial Visual Blocks (The Textile Philosophy / About Us) */}
      <section style={{
        padding: '5.5rem 0',
        backgroundColor: 'var(--color-surface-subtle)',
        borderTop: '1px solid var(--color-border-subtle)',
        borderBottom: '1px solid var(--color-border-subtle)'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '3.5rem',
            alignItems: 'center'
          }} className="editorial-story-grid">
            <div style={{ position: 'relative' }}>
              <div style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
                aspectRatio: '4 / 5',
                maxHeight: '560px'
              }}>
                <img
                  src={about.image_url || "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80"}
                  alt={about.title || "Textile Weaving and Craft"}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {about.quote && (
                <div style={{
                  position: 'absolute',
                  bottom: '-24px',
                  right: '-16px',
                  backgroundColor: 'var(--color-surface-card)',
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--color-border-strong)',
                  maxWidth: '300px'
                }} className="floating-editorial-card">
                  {about.quote_badge && (
                    <span className="stamp-badge" style={{ marginBottom: '0.5rem' }}>
                      {about.quote_badge}
                    </span>
                  )}
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontStyle: 'italic', lineHeight: '1.4', color: 'var(--color-text-main)' }}>
                    "{about.quote}"
                  </p>
                </div>
              )}
            </div>

            <div style={{ maxWidth: '540px' }}>
              <span className="editorial-tag" style={{ marginBottom: '1rem' }}>
                {about.tag || 'ATELIER PHILOSOPHY'}
              </span>
              <h2 className="heading-title" style={{ marginBottom: '1.25rem' }}>
                {about.title || 'Slow fashion for deliberate everyday living.'}
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: '1.7', color: 'var(--color-text-muted)', marginBottom: '1.75rem', whiteSpace: 'pre-line' }}>
                {about.description}
              </p>

              {(about.stat1_value || about.stat2_value) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  {about.stat1_value && (
                    <div>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>{about.stat1_value}</h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{about.stat1_label}</p>
                    </div>
                  )}
                  {about.stat2_value && (
                    <div>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>{about.stat2_value}</h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{about.stat2_label}</p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => onNavigate('shop')}
                className="btn btn-primary"
                style={{ padding: '0.9rem 2rem' }}
              >
                Explore Curated Looks <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Discovery Section: New Season Arrivals */}
      <section style={{ padding: '6rem 0 4rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="editorial-tag" style={{ marginBottom: '0.5rem' }}>
                FRESH DROP // 2026 ARCHIVE
              </span>
              <h2 className="heading-title" style={{ marginTop: '0.25rem' }}>
                New Season Arrivals
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginTop: '0.35rem' }}>
                Recently crafted limited runs tailored for everyday wear.
              </p>
            </div>
            <button
              onClick={() => onNavigate('shop', { collection: 'new-arrivals' })}
              className="btn btn-secondary"
            >
              Browse All New Drops <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. Discovery Section: Atelier Best Sellers */}
      {bestSellers.length > 0 && (
        <section style={{ padding: '2rem 0 5rem' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="editorial-tag" style={{ marginBottom: '0.5rem' }}>
                  CUSTOMER FAVORITES // PROVEN SILHOUETTES
                </span>
                <h2 className="heading-title" style={{ marginTop: '0.25rem' }}>
                  All-Time Best Sellers
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginTop: '0.35rem' }}>
                  The garments most consistently requested by our community.
                </p>
              </div>
              <button
                onClick={() => onNavigate('shop', { collection: 'best-sellers' })}
                className="btn btn-secondary"
              >
                View Best Sellers <ArrowRight size={16} />
              </button>
            </div>

            <div className="products-grid">
              {bestSellers.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Discovery Section: Trending Now */}
      {trendingProducts.length > 0 && (
        <section style={{ padding: '2rem 0 5rem', backgroundColor: 'var(--color-surface-bg)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="editorial-tag" style={{ marginBottom: '0.5rem' }}>
                  <TrendingUp size={12} color="var(--color-brand-accent)" /> CURRENTLY TRENDING
                </span>
                <h2 className="heading-title" style={{ marginTop: '0.25rem' }}>
                  Trending in the Atelier
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginTop: '0.35rem' }}>
                  High-velocity pieces seeing peak inspection this month.
                </p>
              </div>
              <button
                onClick={() => onNavigate('shop', { collection: 'trending' })}
                className="btn btn-secondary"
              >
                Explore Trending <ArrowRight size={16} />
              </button>
            </div>

            <div className="products-grid">
              {trendingProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Discovery Section: Recently Viewed (Only appears if user has viewed products) */}
      {recentlyViewed.length > 0 && (
        <section style={{ padding: '3rem 0 5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
              <div>
                <span className="editorial-tag">
                  <Clock size={12} color="var(--color-brand-accent)" /> RECENT ACTIVITY
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  Recently Inspected Silhouettes
                </h3>
              </div>
            </div>

            <div className="products-grid">
              {recentlyViewed.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. Dynamic Atelier Lookbook & Visual Gallery */}
      {galleryImages && galleryImages.length > 0 && (
        <section style={{ padding: '5rem 0 4rem', backgroundColor: 'var(--color-surface-bg)', borderTop: '1px solid var(--color-border-subtle)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="editorial-tag" style={{ marginBottom: '0.5rem' }}>
                  SEASONAL LOOKBOOK // ATELIER DIARY
                </span>
                <h2 className="heading-title" style={{ marginTop: '0.25rem' }}>
                  The Visual Archive & Gallery
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginTop: '0.35rem' }}>
                  Candid silhouettes, drape studies, and craftsmanship documentation from our workshop.
                </p>
              </div>
              <button
                onClick={() => onNavigate('shop')}
                className="btn btn-secondary"
              >
                Shop The Silhouettes <ArrowRight size={16} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.75rem'
            }}>
              {galleryImages.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    aspectRatio: '3 / 4',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--color-border-subtle)',
                    cursor: 'pointer'
                  }}
                  className="gallery-card"
                  onClick={() => onNavigate('shop')}
                >
                  <img
                    src={item.image_url}
                    alt={item.title || 'Lookbook Image'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(15,19,25,0.92) 0%, rgba(15,19,25,0.35) 50%, transparent 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '1.5rem',
                    color: '#FFF'
                  }}>
                    {item.tag && (
                      <span className="stamp-badge" style={{ marginBottom: '0.5rem', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFF' }}>
                        {item.tag}
                      </span>
                    )}
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem', color: '#FFF' }}>
                      {item.title}
                    </h3>
                    {item.caption && (
                      <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: '1.4' }}>
                        {item.caption}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10. High-End Reassurance Strip (Why Choose Us) */}
      <section style={{
        backgroundColor: '#0F1319',
        color: '#FFFFFF',
        padding: '5rem 0',
        borderTop: '1px solid #1E2838'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            textAlign: 'center'
          }}>
            {(whyChooseUs && whyChooseUs.length > 0 ? whyChooseUs : [
              {
                icon: 'HeartHandshake',
                title: 'Doorstep Cash on Delivery',
                description: 'Inspect fabric, texture, and fit before paying. Pay via cash or mobile QR upon delivery.'
              },
              {
                icon: 'Sparkles',
                title: 'Complimentary Shipping',
                description: 'Enjoy free doorstep shipping on all orders exceeding $100. Dispatched within 24 hours.'
              },
              {
                icon: 'ShieldCheck',
                title: '30-Day Fit Guarantee',
                description: 'Hassle-free size exchanges or doorstep returns if the silhouette doesn\'t feel just right.'
              }
            ]).map((item, idx) => {
              const renderIcon = (name) => {
                switch (name) {
                  case 'Truck': return <Truck size={26} />;
                  case 'RotateCcw': return <RotateCcw size={26} />;
                  case 'ShieldCheck': return <ShieldCheck size={26} />;
                  case 'Sparkles': return <Sparkles size={26} />;
                  case 'HeartHandshake':
                  default: return <HeartHandshake size={26} />;
                }
              };
              return (
                <div key={idx}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-brand-accent)',
                    marginBottom: '1rem'
                  }}>
                    {renderIcon(item.icon)}
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: '#FFF' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: '1.5' }}>
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <style>{`
        @media (min-width: 900px) {
          .editorial-story-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .floating-editorial-card {
            position: static !important;
            margin-top: 1rem !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
