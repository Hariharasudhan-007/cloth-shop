import React, { useState, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, Upload, Save, Check, RefreshCw, Plus, Trash2, HeartHandshake, Truck, RotateCcw, ShieldCheck, Eye } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function AdminContent({ onDataChanged }) {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState('banner'); // 'banner' | 'about' | 'why' | 'gallery'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Content states
  const [banner, setBanner] = useState({
    badge: '2026 ARCHIVE EDITION',
    title: 'Form meets fabric.',
    subtitle: 'Woven to endure.',
    description: 'Bespoke everyday silhouettes cut from unbleached French flax linen, Okayama raw denim, and Scottish lambswool.',
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

  // New gallery image draft
  const [newGalleryImg, setNewGalleryImg] = useState({
    title: '',
    caption: '',
    tag: 'Atelier',
    image_url: ''
  });

  const loadContent = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminContent();
      if (res?.content) {
        if (res.content.homepage_banner) setBanner(res.content.homepage_banner);
        if (res.content.about_us) setAbout(res.content.about_us);
        if (Array.isArray(res.content.why_choose_us)) setWhyChooseUs(res.content.why_choose_us);
        if (Array.isArray(res.content.gallery_images)) setGalleryImages(res.content.gallery_images);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load website content', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleFileUpload = async (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Only JPG, PNG, and WebP images are allowed.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be under 5MB.', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const res = await api.uploadImage(file);
      callback(res.url);
      showToast('Image uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAdminContent('homepage_banner', banner);
      onDataChanged?.();
      showToast('Homepage hero banner saved and live on storefront!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAbout = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAdminContent('about_us', about);
      onDataChanged?.();
      showToast('About Us & Philosophy content saved and live!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update About Us', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWhyChooseUs = async () => {
    setSaving(true);
    try {
      await api.updateAdminContent('why_choose_us', whyChooseUs);
      onDataChanged?.();
      showToast('Why Choose Us reassurance cards updated!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update section', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddWhyItem = () => {
    const newItem = {
      id: Date.now(),
      icon: 'Sparkles',
      title: 'New Feature Highlight',
      description: 'Describe why customers should choose your brand or service.'
    };
    setWhyChooseUs([...whyChooseUs, newItem]);
  };

  const handleUpdateWhyItem = (id, field, value) => {
    setWhyChooseUs(whyChooseUs.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleDeleteWhyItem = (id) => {
    setWhyChooseUs(whyChooseUs.filter((item) => item.id !== id));
  };

  const handleAddGalleryImage = async (e) => {
    e.preventDefault();
    if (!newGalleryImg.image_url.trim()) {
      showToast('Please provide an image URL or upload an image file.', 'error');
      return;
    }

    const updated = [
      ...galleryImages,
      {
        id: Date.now(),
        title: newGalleryImg.title.trim() || 'Atelier Lookbook',
        caption: newGalleryImg.caption.trim() || 'Crafted in small runs',
        tag: newGalleryImg.tag.trim() || 'Lookbook',
        image_url: newGalleryImg.image_url.trim()
      }
    ];

    setSaving(true);
    try {
      await api.updateAdminContent('gallery_images', updated);
      setGalleryImages(updated);
      setNewGalleryImg({ title: '', caption: '', tag: 'Atelier', image_url: '' });
      onDataChanged?.();
      showToast('New gallery image added to storefront lookbook!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add gallery image', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGalleryImage = async (id) => {
    const updated = galleryImages.filter((img) => img.id !== id);
    setSaving(true);
    try {
      await api.updateAdminContent('gallery_images', updated);
      setGalleryImages(updated);
      onDataChanged?.();
      showToast('Gallery image removed.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to remove image', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p>Loading website content blocks...</p>
      </div>
    );
  }

  return (
    <div className="admin-content-manager">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>
          Website Content Management (CMS)
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Customize homepage banners, brand storytelling, reassurance features, and curated atelier lookbook imagery.
        </p>
      </div>

      {/* Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        borderBottom: '1px solid var(--color-border-subtle)',
        paddingBottom: '0.75rem',
        marginBottom: '2rem',
        overflowX: 'auto'
      }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('banner')}
          className={`btn btn-sm ${activeSubTab === 'banner' ? 'btn-primary' : 'btn-secondary'}`}
          id="tab-cms-banner"
        >
          Homepage Banner
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('about')}
          className={`btn btn-sm ${activeSubTab === 'about' ? 'btn-primary' : 'btn-secondary'}`}
          id="tab-cms-about"
        >
          About Us & Philosophy
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('why')}
          className={`btn btn-sm ${activeSubTab === 'why' ? 'btn-primary' : 'btn-secondary'}`}
          id="tab-cms-why"
        >
          Why Choose Us ({whyChooseUs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('gallery')}
          className={`btn btn-sm ${activeSubTab === 'gallery' ? 'btn-primary' : 'btn-secondary'}`}
          id="tab-cms-gallery"
        >
          Gallery Images ({galleryImages.length})
        </button>
      </div>

      {/* TAB 1: HOMEPAGE BANNER */}
      {activeSubTab === 'banner' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.2fr)',
          gap: '2.5rem',
          alignItems: 'start'
        }} className="admin-grid-responsive">
          {/* Banner Edit Form */}
          <div style={{
            backgroundColor: 'var(--color-surface-card)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Hero Banner Settings
            </h3>
            <form onSubmit={handleSaveBanner}>
              <div className="form-group">
                <label className="form-label" htmlFor="banner_badge">Announcement Badge / Tag</label>
                <input
                  id="banner_badge"
                  type="text"
                  value={banner.badge}
                  onChange={(e) => setBanner({ ...banner, badge: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 2026 ARCHIVE EDITION"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="banner_title">Main Headline</label>
                <input
                  id="banner_title"
                  type="text"
                  value={banner.title}
                  onChange={(e) => setBanner({ ...banner, title: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Form meets fabric."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="banner_subtitle">Italic Accent Subtitle</label>
                <input
                  id="banner_subtitle"
                  type="text"
                  value={banner.subtitle}
                  onChange={(e) => setBanner({ ...banner, subtitle: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Woven to endure."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="banner_desc">Hero Body Description</label>
                <textarea
                  id="banner_desc"
                  rows="3"
                  value={banner.description}
                  onChange={(e) => setBanner({ ...banner, description: e.target.value })}
                  className="form-textarea"
                  placeholder="Bespoke everyday silhouettes cut from unbleached French flax..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hero Background Image</label>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={banner.image_url}
                    onChange={(e) => setBanner({ ...banner, image_url: e.target.value })}
                    className="form-input"
                    placeholder="https://images.unsplash.com/... or /uploads/..."
                    required
                  />
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', flexShrink: 0 }}>
                    <Upload size={14} />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileUpload(e, (url) => setBanner({ ...banner, image_url: url }))}
                      style={{ display: 'none' }}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="btn_text_1">Primary Button Text</label>
                  <input
                    id="btn_text_1"
                    type="text"
                    value={banner.primary_button_text}
                    onChange={(e) => setBanner({ ...banner, primary_button_text: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="btn_link_1">Primary Target Route</label>
                  <input
                    id="btn_link_1"
                    type="text"
                    value={banner.primary_button_link}
                    onChange={(e) => setBanner({ ...banner, primary_button_link: e.target.value })}
                    className="form-input"
                    placeholder="shop"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="btn_text_2">Secondary Button Text</label>
                  <input
                    id="btn_text_2"
                    type="text"
                    value={banner.secondary_button_text}
                    onChange={(e) => setBanner({ ...banner, secondary_button_text: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="btn_link_2">Secondary Target Route</label>
                  <input
                    id="btn_link_2"
                    type="text"
                    value={banner.secondary_button_link}
                    onChange={(e) => setBanner({ ...banner, secondary_button_link: e.target.value })}
                    className="form-input"
                    placeholder="offers"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="btn btn-primary"
                style={{ marginTop: '1rem', width: '100%', padding: '0.85rem' }}
                id="save-banner-btn"
              >
                {saving ? 'Publishing Updates...' : 'Save & Publish Hero Banner'}
              </button>
            </form>
          </div>

          {/* Live Preview Card */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              Live Storefront Preview
            </div>
            <div style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              minHeight: '380px',
              backgroundColor: '#0F1319',
              color: '#FFF',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              border: '1px solid var(--color-border-subtle)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <img
                src={banner.image_url}
                alt="Banner Preview"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.38
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, rgba(15,19,25,0.92) 0%, rgba(15,19,25,0.5) 100%)'
              }} />

              <div style={{ position: 'relative', zIndex: 2, maxWidth: '440px' }}>
                <span className="editorial-tag" style={{ background: 'rgba(255,255,255,0.15)', color: '#FFF', marginBottom: '1rem' }}>
                  <Sparkles size={12} color="var(--color-brand-accent)" /> {banner.badge}
                </span>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 800, lineHeight: '1.15', marginBottom: '0.5rem', color: '#FFF' }}>
                  {banner.title} <br />
                  <span style={{ fontStyle: 'italic', fontFamily: 'var(--font-serif)', color: 'var(--color-brand-accent)' }}>
                    {banner.subtitle}
                  </span>
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#CBD5E1', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  {banner.description}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span className="btn btn-accent btn-sm" style={{ pointerEvents: 'none' }}>
                    {banner.primary_button_text}
                  </span>
                  <span className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none', color: '#FFF', borderColor: 'rgba(255,255,255,0.3)' }}>
                    {banner.secondary_button_text}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ABOUT US & PHILOSOPHY */}
      {activeSubTab === 'about' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.2fr)',
          gap: '2.5rem',
          alignItems: 'start'
        }} className="admin-grid-responsive">
          <div style={{
            backgroundColor: 'var(--color-surface-card)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Atelier Philosophy & About Story
            </h3>
            <form onSubmit={handleSaveAbout}>
              <div className="form-group">
                <label className="form-label" htmlFor="about_tag">Category / Tag</label>
                <input
                  id="about_tag"
                  type="text"
                  value={about.tag}
                  onChange={(e) => setAbout({ ...about, tag: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="about_title">Headline</label>
                <input
                  id="about_title"
                  type="text"
                  value={about.title}
                  onChange={(e) => setAbout({ ...about, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="about_desc">Story Paragraph</label>
                <textarea
                  id="about_desc"
                  rows="4"
                  value={about.description}
                  onChange={(e) => setAbout({ ...about, description: e.target.value })}
                  className="form-textarea"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Story Atelier Image</label>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={about.image_url}
                    onChange={(e) => setAbout({ ...about, image_url: e.target.value })}
                    className="form-input"
                    required
                  />
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', flexShrink: 0 }}>
                    <Upload size={14} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileUpload(e, (url) => setAbout({ ...about, image_url: url }))}
                      style={{ display: 'none' }}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="about_quote">Featured Quote</label>
                <input
                  id="about_quote"
                  type="text"
                  value={about.quote}
                  onChange={(e) => setAbout({ ...about, quote: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Stat 1 Value</label>
                  <input
                    type="text"
                    value={about.stat1_value}
                    onChange={(e) => setAbout({ ...about, stat1_value: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stat 1 Caption</label>
                  <input
                    type="text"
                    value={about.stat1_label}
                    onChange={(e) => setAbout({ ...about, stat1_label: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Stat 2 Value</label>
                  <input
                    type="text"
                    value={about.stat2_value}
                    onChange={(e) => setAbout({ ...about, stat2_value: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stat 2 Caption</label>
                  <input
                    type="text"
                    value={about.stat2_label}
                    onChange={(e) => setAbout({ ...about, stat2_label: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="btn btn-primary"
                style={{ marginTop: '1rem', width: '100%', padding: '0.85rem' }}
                id="save-about-btn"
              >
                {saving ? 'Publishing Changes...' : 'Save & Publish About Content'}
              </button>
            </form>
          </div>

          {/* Live Preview Card */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              Storefront Preview
            </div>
            <div style={{
              backgroundColor: 'var(--color-surface-subtle)',
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-subtle)'
            }}>
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '220px', marginBottom: '1.25rem' }}>
                <img src={about.image_url} alt="About preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span className="editorial-tag" style={{ marginBottom: '0.5rem' }}>{about.tag}</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.5rem 0' }}>{about.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>{about.description}</p>
              <div style={{ margin: '1rem 0', fontStyle: 'italic', fontFamily: 'var(--font-serif)', color: 'var(--color-brand-primary)' }}>
                "{about.quote}"
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                <div>
                  <strong style={{ fontSize: '1.125rem' }}>{about.stat1_value}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{about.stat1_label}</div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.125rem' }}>{about.stat2_value}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{about.stat2_label}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WHY CHOOSE US */}
      {activeSubTab === 'why' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Store Value & Reassurance Highlights</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                These cards inform visitors of your key shipping, payment, quality, and guarantee commitments.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddWhyItem}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={16} /> Add New Card
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {whyChooseUs.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand-accent)' }}>
                    FEATURE CARD #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteWhyItem(item.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                    title="Delete card"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label">Card Icon</label>
                  <select
                    value={item.icon}
                    onChange={(e) => handleUpdateWhyItem(item.id, 'icon', e.target.value)}
                    className="form-select"
                  >
                    <option value="HeartHandshake">Doorstep Cash on Delivery (HeartHandshake)</option>
                    <option value="Truck">Fast Free Shipping (Truck)</option>
                    <option value="RotateCcw">Fit Guarantee & Returns (RotateCcw)</option>
                    <option value="ShieldCheck">Pure Natural Materials (ShieldCheck)</option>
                    <option value="Sparkles">Atelier Handcrafted (Sparkles)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label">Headline Title</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleUpdateWhyItem(item.id, 'title', e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows="3"
                    value={item.description}
                    onChange={(e) => handleUpdateWhyItem(item.id, 'description', e.target.value)}
                    className="form-textarea"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveWhyChooseUs}
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '0.85rem 2rem' }}
            id="save-why-btn"
          >
            {saving ? 'Saving...' : 'Save Reassurance Section'}
          </button>
        </div>
      )}

      {/* TAB 4: GALLERY IMAGES */}
      {activeSubTab === 'gallery' && (
        <div>
          {/* Add Gallery Photo Form */}
          <div style={{
            backgroundColor: 'var(--color-surface-card)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-subtle)',
            marginBottom: '2.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>
              Add Curated Lookbook / Atelier Photo
            </h3>
            <form onSubmit={handleAddGalleryImage}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="gal_title">Photo Title *</label>
                  <input
                    id="gal_title"
                    type="text"
                    value={newGalleryImg.title}
                    onChange={(e) => setNewGalleryImg({ ...newGalleryImg, title: e.target.value })}
                    className="form-input"
                    placeholder="e.g. French Flax Camp Shirt"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="gal_tag">Category / Tag</label>
                  <input
                    id="gal_tag"
                    type="text"
                    value={newGalleryImg.tag}
                    onChange={(e) => setNewGalleryImg({ ...newGalleryImg, tag: e.target.value })}
                    className="form-input"
                    placeholder="e.g. Atelier, Runway, Fabrics"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="gal_caption">Caption</label>
                  <input
                    id="gal_caption"
                    type="text"
                    value={newGalleryImg.caption}
                    onChange={(e) => setNewGalleryImg({ ...newGalleryImg, caption: e.target.value })}
                    className="form-input"
                    placeholder="e.g. Woven on antique shuttle looms"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image File or URL *</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    value={newGalleryImg.image_url}
                    onChange={(e) => setNewGalleryImg({ ...newGalleryImg, image_url: e.target.value })}
                    className="form-input"
                    placeholder="https://images.unsplash.com/... or upload"
                    required
                  />
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', flexShrink: 0 }}>
                    <Upload size={14} />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileUpload(e, (url) => setNewGalleryImg({ ...newGalleryImg, image_url: url }))}
                      style={{ display: 'none' }}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              {newGalleryImg.image_url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                  <img
                    src={newGalleryImg.image_url}
                    alt="Draft preview"
                    style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Image ready to add</span>
                </div>
              )}

              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.5rem' }}
              >
                <Plus size={16} /> Add Image to Lookbook
              </button>
            </form>
          </div>

          {/* Current Gallery Photos Grid */}
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>
            Current Gallery Lookbook ({galleryImages.length} Photos)
          </h3>

          {galleryImages.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--color-surface-card)', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>No gallery photos added yet. Add your first photo above.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1.5rem'
            }}>
              {galleryImages.map((img) => (
                <div
                  key={img.id}
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border-subtle)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ position: 'relative', height: '220px', backgroundColor: '#EAE6DC' }}>
                    <img
                      src={img.image_url}
                      alt={img.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span className="stamp-badge" style={{ position: 'absolute', top: '10px', left: '10px' }}>
                      {img.tag || 'Atelier'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteGalleryImage(img.id)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: 'rgba(15,19,25,0.75)',
                        color: '#FFF',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Delete image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
                      {img.title}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      {img.caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .admin-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
