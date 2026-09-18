import React from 'react';
import { ArrowRight, Sparkles, Tag, ChevronRight } from 'lucide-react';

export function MegaMenu({ activeMenu, onClose, onNavigate }) {
  if (!activeMenu) return null;

  const menuData = {
    men: {
      title: 'Men’s Archive',
      subtitle: 'Tailored silhouettes, raw Japanese denim, and breathable flax linen.',
      categories: [
        { name: 'Camp Collar & Oxford Shirts', slug: 'shirts', count: '12 pieces' },
        { name: 'Heavyweight Pocket T-Shirts', slug: 'shirts', count: '6 colors' },
        { name: '100% Normandy Linen', slug: 'shirts', count: 'Signature' },
        { name: 'Chinos & Okayama Denim', slug: 'trousers', count: '8 cuts' },
        { name: 'Coats & Field Overshirts', slug: 'outerwear', count: '4 jackets' },
        { name: 'Leather Goods & Canvas Totes', slug: 'accessories', count: '10 items' }
      ],
      featured: {
        tag: 'LIMITED RUN DROP',
        title: 'Camp Collar Linen Edition',
        desc: 'Unbleached French flax woven with natural drape for warm climates.',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
        route: { name: 'shop', params: { category: 'shirts', gender: 'men' } }
      },
      shopAllParam: { gender: 'men' }
    },
    women: {
      title: 'Women’s Collection',
      subtitle: 'Effortless drape, natural textures, and fluid architectural cuts.',
      categories: [
        { name: 'Tiered Linen Dresses', slug: 'shirts', count: 'New drop' },
        { name: 'Silk-Cotton Studio Blouses', slug: 'shirts', count: 'Atelier' },
        { name: 'Washed Linen Camp Tops', slug: 'shirts', count: '8 styles' },
        { name: 'High-Rise Wide Trousers', slug: 'trousers', count: 'Signature' },
        { name: 'Ribbed Cashmere Knitwear', slug: 'knitwear', count: 'Cozy knits' },
        { name: 'Woven Lambswool Scarves', slug: 'accessories', count: 'Warm layer' }
      ],
      featured: {
        tag: 'ATELIER EXCLUSIVE',
        title: 'Tiered Normandy Sun Dress',
        desc: 'Pure breathable flax with concealed side pockets and mother-of-pearl accents.',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
        route: { name: 'shop', params: { gender: 'women' } }
      },
      shopAllParam: { gender: 'women' }
    },
    collections: {
      title: 'Curated Editions',
      subtitle: 'Thematic capsule releases made from singular natural fibers.',
      categories: [
        { name: '2026 New Season Drops', collection: 'new-arrivals', count: 'Fresh in' },
        { name: 'All-Time Atelier Best Sellers', collection: 'best-sellers', count: 'Customer favorites' },
        { name: 'Trending Garments', collection: 'trending', count: 'Most desired' },
        { name: 'Normandy Summer Linen', category: 'shirts', count: 'Breathable' },
        { name: 'Okayama Shuttle Selvedge', category: 'trousers', count: '14oz Denim' },
        { name: 'Promotional Offers & Archive Sale', isOffer: true, count: 'Up to 20% off' }
      ],
      featured: {
        tag: 'SEASONAL LOOKBOOK',
        title: 'The French Linen Edit',
        desc: 'Garments crafted to develop distinct character and soften with wear.',
        image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80',
        route: { name: 'shop', params: { collection: 'new-arrivals' } }
      },
      shopAllParam: {}
    },
    categories: {
      title: 'Garment Categories',
      subtitle: 'Explore our full spectrum of textiles, weaves, and wardrobe essentials.',
      categories: [
        { name: 'Shirts & Tops', slug: 'shirts', count: 'Flax & Oxford' },
        { name: 'Outerwear & Chore Coats', slug: 'outerwear', count: 'Waxed & Selvedge' },
        { name: 'Merino Wool Knitwear', slug: 'knitwear', count: '19.5 Micron' },
        { name: 'Trousers & Chinos', slug: 'trousers', count: 'Twill & Denim' },
        { name: 'Leather & Accessories', slug: 'accessories', count: 'Canvas & Tanned' }
      ],
      featured: {
        tag: 'TEXTILE PHILOSOPHY',
        title: 'Zero Synthetic Fillers',
        desc: 'Every garment is tailored from 100% natural biodegradable yarns.',
        image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80',
        route: { name: 'shop' }
      },
      shopAllParam: {}
    }
  };

  const current = menuData[activeMenu];
  if (!current) return null;

  const handleCategoryClick = (cat) => {
    onClose();
    if (cat.isOffer) {
      onNavigate('offers');
    } else if (cat.collection) {
      onNavigate('shop', { collection: cat.collection });
    } else if (cat.slug || cat.category) {
      const params = { category: cat.slug || cat.category };
      if (activeMenu === 'men') params.gender = 'men';
      if (activeMenu === 'women') params.gender = 'women';
      onNavigate('shop', params);
    }
  };

  const handleShopAll = () => {
    onClose();
    onNavigate('shop', current.shopAllParam);
  };

  return (
    <div
      className="mega-menu-overlay"
      onMouseLeave={onClose}
      role="region"
      aria-label={`${current.title} Mega Menu`}
    >
      <div className="container">
        <div className="mega-menu-grid">
          {/* Left Column: Subcategory list */}
          <div className="mega-menu-links-col">
            <div className="mega-menu-header">
              <span className="editorial-tag">
                <Sparkles size={11} color="var(--color-brand-accent)" /> ATELIER DIRECTORY
              </span>
              <h3 className="mega-menu-title">{current.title}</h3>
              <p className="mega-menu-subtitle">{current.subtitle}</p>
            </div>

            <div className="mega-menu-links-grid">
              {current.categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCategoryClick(cat)}
                  className="mega-menu-link-item"
                >
                  <div>
                    <span className="mega-link-name">{cat.name}</span>
                    <span className="mega-link-count">{cat.count}</span>
                  </div>
                  <ChevronRight size={14} className="mega-link-arrow" />
                </button>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-subtle)' }}>
              <button
                onClick={handleShopAll}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
              >
                Shop All {current.title} <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right Column: Featured Collection Showcase Card */}
          <div className="mega-menu-featured-col">
            <div
              className="mega-featured-card"
              onClick={() => {
                onClose();
                onNavigate(current.featured.route.name, current.featured.route.params);
              }}
              role="button"
              tabIndex={0}
            >
              <img
                src={current.featured.image}
                alt={current.featured.title}
                className="mega-featured-img"
              />
              <div className="mega-featured-overlay">
                <span className="stamp-badge">{current.featured.tag}</span>
                <h4 className="mega-featured-title">{current.featured.title}</h4>
                <p className="mega-featured-desc">{current.featured.desc}</p>
                <span className="mega-featured-cta">
                  Explore Feature <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
