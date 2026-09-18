import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../services/api';

const RECENT_SEARCHES_KEY = 'tl_recent_searches_v1';

export function SearchModal({ isOpen, onClose, onNavigate, onSelectProduct }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : ['Linen', 'Denim', 'Merino', 'Camp Collar'];
    } catch (e) {
      return ['Linen', 'Denim'];
    }
  });

  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.getProducts({ search: query.trim(), limit: 6 });
        setResults(data || []);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const removeRecentSearch = (term, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {}
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      onClose();
      onNavigate('shop', { search: query.trim() });
    }
  };

  const handleSelectRecent = (term) => {
    setQuery(term);
    saveRecentSearch(term);
  };

  const handleProductClick = (product) => {
    saveRecentSearch(product.name);
    onClose();
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      onNavigate('product', { identifier: product.slug || product.id });
    }
  };

  const popularTags = [
    { label: 'French Flax Linen', category: 'shirts' },
    { label: 'Japanese Raw Denim', category: 'trousers' },
    { label: 'Merino Wool Knitwear', category: 'knitwear' },
    { label: 'Waxed Canvas Jackets', category: 'outerwear' },
    { label: 'Atelier Sun Dresses', gender: 'women' },
    { label: 'Leather Cardholders', category: 'accessories' }
  ];

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Search Header Bar */}
        <form onSubmit={handleSubmit} className="search-modal-form">
          <Search size={22} className="search-modal-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search silhouettes, fibers, or collections (e.g. Linen, Denim, Cardigan)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-modal-input"
            id="global-search-modal-input"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="search-modal-clear"
              aria-label="Clear input"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="search-modal-close-btn"
            aria-label="Close search"
          >
            ESC
          </button>
        </form>

        {/* Modal Body */}
        <div className="search-modal-body">
          {/* If user is typing and results exist */}
          {query.trim() ? (
            <div className="search-results-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span className="editorial-tag">
                  {loading ? 'SEARCHING ARCHIVE...' : `MATCHING SILHOUETTES (${results.length})`}
                </span>
                {results.length > 0 && (
                  <button
                    onClick={handleSubmit}
                    className="search-view-all-link"
                  >
                    View all results <ArrowRight size={14} />
                  </button>
                )}
              </div>

              {loading ? (
                <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
              ) : results.length === 0 ? (
                <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    No matching pieces found for "{query}"
                  </p>
                  <p style={{ fontSize: '0.875rem' }}>
                    Try searching for natural fibers like <em>Linen</em>, <em>Denim</em>, or <em>Merino</em>.
                  </p>
                </div>
              ) : (
                <div className="search-results-grid">
                  {results.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="search-product-item"
                    >
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="search-product-thumb"
                      />
                      <div className="search-product-info">
                        <span className="search-product-category">{product.category_name || 'Atelier'}</span>
                        <h4 className="search-product-name">{product.name}</h4>
                        <div className="search-product-pricing">
                          <span className="search-product-price">${parseFloat(product.price).toFixed(2)}</span>
                          {product.discount_percent > 0 && (
                            <span className="search-product-discount">-{product.discount_percent}% OFF</span>
                          )}
                          {product.stock <= 0 && (
                            <span className="badge badge-out-of-stock" style={{ fontSize: '0.6875rem', padding: '0.15rem 0.4rem' }}>Sold Out</span>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={16} className="search-product-arrow" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Recent Searches & Popular Tags */
            <div className="search-preliminary-section">
              {recentSearches.length > 0 && (
                <div style={{ marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <span className="search-section-label">
                      <Clock size={14} /> RECENT SEARCHES
                    </span>
                    <button
                      onClick={clearAllRecent}
                      style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600 }}
                    >
                      Clear history
                    </button>
                  </div>
                  <div className="search-tags-row">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectRecent(term)}
                        className="search-tag-chip"
                      >
                        <span>{term}</span>
                        <span
                          onClick={(e) => removeRecentSearch(term, e)}
                          className="search-tag-remove"
                        >
                          &times;
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Categories & Topics */}
              <div>
                <span className="search-section-label" style={{ marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp size={14} /> POPULAR ATELIER DISCOVERIES
                </span>
                <div className="search-tags-row">
                  {popularTags.map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onClose();
                        const params = {};
                        if (tag.category) params.category = tag.category;
                        if (tag.gender) params.gender = tag.gender;
                        onNavigate('shop', params);
                      }}
                      className="search-popular-chip"
                    >
                      <Sparkles size={12} color="var(--color-brand-accent)" />
                      <span>{tag.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
