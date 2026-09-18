import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, RotateCcw, PackageSearch, X, Sparkles, Filter, Tag } from 'lucide-react';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';

export function ShopPage({
  initialCategory = '',
  initialSearch = '',
  initialGender = '',
  initialCollection = '',
  onSelectProduct
}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedGender, setSelectedGender] = useState(initialGender);
  const [selectedCollection, setSelectedCollection] = useState(initialCollection);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

  // Sync props if changed externally (e.g. from navbar or mega menu)
  useEffect(() => {
    if (initialCategory !== undefined) setSelectedCategory(initialCategory);
    if (initialSearch !== undefined) setSearchQuery(initialSearch);
    if (initialGender !== undefined) setSelectedGender(initialGender);
    if (initialCollection !== undefined) setSelectedCollection(initialCollection);
  }, [initialCategory, initialSearch, initialGender, initialCollection]);

  // Fetch categories once
  useEffect(() => {
    api.getCategories().then((data) => {
      const list = Array.isArray(data) ? data : (data?.categories || data?.data || []);
      setCategories(list);
    }).catch(console.error);
  }, []);

  // Fetch products reactively
  useEffect(() => {
    let isCancelled = false;
    async function loadProducts() {
      setLoading(true);
      try {
        const data = await api.getProducts({
          category: selectedCategory,
          search: searchQuery,
          gender: selectedGender,
          collection: selectedCollection,
          sort: sortBy
        });
        if (!isCancelled) {
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.items)
            ? data.items
            : [];
          setProducts(list);
        }
      } catch (err) {
        console.error('Failed to load products', err);
        if (!isCancelled) {
          setProducts([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }
    loadProducts();
    return () => { isCancelled = true; };
  }, [selectedCategory, selectedGender, selectedCollection, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedGender('');
    setSelectedCollection('');
    setSearchQuery('');
    setSortBy('newest');
  };

  const hasActiveFilters = !!(selectedCategory || selectedGender || selectedCollection || searchQuery || sortBy !== 'newest');

  return (
    <div className="shop-page" style={{ padding: '3.5rem 0 6rem', position: 'relative' }}>
      <div className="container">
        {/* Editorial Page Header */}
        <div style={{ position: 'relative', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="editorial-tag">
              <Sparkles size={12} color="var(--color-brand-accent)" /> COMPLETE CATALOG // 2026
            </span>
            <span className="stamp-badge">SLOW ATELIER</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="heading-title" style={{ color: 'var(--color-brand-primary)' }}>
                The Wardrobe Archive
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1.0625rem', marginTop: '0.25rem', maxWidth: '600px' }}>
                Consciously woven linen, heavy raw denim, and combed organic cotton. Built to soften with wear.
              </p>
            </div>

            {/* Live Count Pill */}
            <div style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-full)',
              padding: '0.45rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: 'var(--color-brand-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              Showing <strong>{products.length}</strong> garment{products.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="shop-toolbar-card">
          {/* Row 1: Search input & Sort Dropdown */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '480px' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-light)'
                }}
              />
              <input
                type="text"
                placeholder="Search collection (e.g. Linen, Denim, Cardigan)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.75rem', paddingRight: searchQuery ? '2.5rem' : '1rem', fontSize: '0.9375rem' }}
                id="shop-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)'
                  }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sort & Reset Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SlidersHorizontal size={15} color="var(--color-text-muted)" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-input"
                  style={{ width: 'auto', padding: '0.45rem 1.75rem 0.45rem 0.85rem', fontSize: '0.875rem' }}
                  id="shop-sort-select"
                >
                  <option value="newest">Newest Additions</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="discount">Biggest Discount</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.75rem' }}
                  title="Reset all filters"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Gender & Collection Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--color-surface-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-light)', marginRight: '0.5rem' }}>
              COLLECTION:
            </span>
            <button
              onClick={() => setSelectedCollection('')}
              className={`filter-pill-btn ${!selectedCollection ? 'active' : ''}`}
            >
              All Pieces
            </button>
            <button
              onClick={() => setSelectedCollection('new-arrivals')}
              className={`filter-pill-btn ${selectedCollection === 'new-arrivals' ? 'active' : ''}`}
            >
              ✦ New Arrivals
            </button>
            <button
              onClick={() => setSelectedCollection('best-sellers')}
              className={`filter-pill-btn ${selectedCollection === 'best-sellers' ? 'active' : ''}`}
            >
              Best Sellers
            </button>
            <button
              onClick={() => setSelectedCollection('trending')}
              className={`filter-pill-btn ${selectedCollection === 'trending' ? 'active' : ''}`}
            >
              Trending Now
            </button>
            <button
              onClick={() => setSelectedCollection('deals')}
              className={`filter-pill-btn ${selectedCollection === 'deals' ? 'active' : ''}`}
              style={{ color: 'var(--color-brand-terracotta)' }}
            >
              <Tag size={12} /> Deals & Offers
            </button>

            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-light)', margin: '0 0.5rem 0 1rem' }}>
              GENDER:
            </span>
            <button
              onClick={() => setSelectedGender('')}
              className={`filter-pill-btn ${!selectedGender ? 'active' : ''}`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedGender('men')}
              className={`filter-pill-btn ${selectedGender === 'men' ? 'active' : ''}`}
            >
              Men
            </button>
            <button
              onClick={() => setSelectedGender('women')}
              className={`filter-pill-btn ${selectedGender === 'women' ? 'active' : ''}`}
            >
              Women
            </button>
          </div>

          {/* Row 3: Category Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--color-surface-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-light)', marginRight: '0.5rem' }}>
              CATEGORY:
            </span>
            <button
              onClick={() => setSelectedCategory('')}
              className={`filter-pill-btn ${!selectedCategory ? 'active' : ''}`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`filter-pill-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem 0' }}>
            <div className="spinner" />
          </div>
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '5rem 2rem',
            backgroundColor: 'var(--color-surface-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--color-border-strong)',
            maxWidth: '540px',
            margin: '0 auto'
          }}>
            <PackageSearch size={44} style={{ color: 'var(--color-text-light)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Garments Match Your Filter</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              We could not find pieces matching your specified filters. Try resetting your search parameters.
            </p>
            <button onClick={handleResetFilters} className="btn btn-primary btn-sm">
              View All Archive Pieces
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
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
  );
}
