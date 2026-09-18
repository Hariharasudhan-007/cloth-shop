import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Upload, Check, AlertTriangle, Eye, EyeOff, Star, Layers, FolderPlus, Tag } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/Modal';

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'];

export function AdminProducts({ onDataChanged }) {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Product Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category_id: '',
    description: '',
    image_url: '',
    secondary_image_url: '',
    sizes: 'S,M,L,XL',
    is_featured: false,
    is_active: true
  });
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [uploadingSecImage, setUploadingSecImage] = useState(false);

  // Category Manager Modal state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catFormData, setCatFormData] = useState({ id: null, name: '', description: '', image_url: '' });
  const [savingCat, setSavingCat] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        api.getAdminProducts(),
        api.getCategories()
      ]);
      const prodList = Array.isArray(prodData) ? prodData : (prodData?.products || prodData?.data || []);
      const catList = Array.isArray(catData) ? catData : (catData?.categories || catData?.data || []);
      setProducts(prodList);
      setCategories(catList);
    } catch (err) {
      showToast(err.message || 'Failed to load products', 'error');
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      stock: '15',
      category_id: categories[0]?.id || '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
      secondary_image_url: '',
      sizes: 'S,M,L,XL',
      is_featured: false,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category_id: product.category_id || '',
      description: product.description,
      image_url: product.image_url,
      secondary_image_url: product.secondary_image_url || '',
      sizes: product.sizes || 'S,M,L,XL',
      is_featured: !!product.is_featured,
      is_active: !!product.is_active
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e, fieldKey, setUploadingState) => {
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

    setUploadingState(true);
    try {
      const res = await api.uploadImage(file);
      setFormData((prev) => ({ ...prev, [fieldKey]: res.url }));
      showToast('Image uploaded safely!', 'success');
    } catch (err) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingState(false);
    }
  };

  // Toggle size in sizes string
  const handleToggleSize = (size) => {
    const currentSizes = formData.sizes
      ? formData.sizes.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    let updated;
    if (currentSizes.includes(size)) {
      updated = currentSizes.filter((s) => s !== size);
    } else {
      updated = [...currentSizes, size];
    }
    setFormData({ ...formData, sizes: updated.join(',') });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
        showToast(`Updated "${formData.name}"`, 'success');
      } else {
        await api.createProduct(formData);
        showToast(`Created "${formData.name}"`, 'success');
      }
      setIsModalOpen(false);
      await loadData();
      onDataChanged?.();
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Are you sure you want to deactivate/delete "${product.name}"?`)) {
      try {
        const res = await api.deleteProduct(product.id);
        showToast(res.message || 'Product removed', 'info');
        await loadData();
        onDataChanged?.();
      } catch (err) {
        showToast(err.message || 'Failed to delete product', 'error');
      }
    }
  };

  const handleToggleFeatured = async (product) => {
    const newFeatured = !product.is_featured;
    try {
      await api.toggleProductFeatured(product.id, newFeatured);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_featured: newFeatured ? 1 : 0 } : p))
      );
      showToast(
        newFeatured
          ? `"${product.name}" is now featured on homepage!`
          : `"${product.name}" unfeatured.`,
        'success'
      );
      onDataChanged?.();
    } catch (err) {
      showToast(err.message || 'Failed to toggle featured status', 'error');
    }
  };

  // Category CRUD Handlers
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSavingCat(true);
    try {
      if (catFormData.id) {
        await api.updateCategory(catFormData.id, catFormData);
        showToast(`Category "${catFormData.name}" updated.`, 'success');
      } else {
        await api.createCategory(catFormData);
        showToast(`Category "${catFormData.name}" created.`, 'success');
      }
      setCatFormData({ id: null, name: '', description: '', image_url: '' });
      const catData = await api.getCategories();
      setCategories(catData || []);
      onDataChanged?.();
    } catch (err) {
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"? Any linked products will have their category unassigned.`)) {
      try {
        await api.deleteCategory(cat.id);
        showToast(`Category "${cat.name}" deleted.`, 'info');
        const catData = await api.getCategories();
        setCategories(catData || []);
        await loadData();
        onDataChanged?.();
      } catch (err) {
        showToast(err.message || 'Failed to delete category', 'error');
      }
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesCategory = categoryFilter === 'all' || String(p.category_id) === String(categoryFilter);
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const parsedFormSizes = formData.sizes ? formData.sizes.split(',').map((s) => s.trim()) : [];

  return (
    <div className="admin-products">
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>
            Products & Inventory Catalog
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Add and edit garments, manage product images, size variants, stock quantities, and category assignments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsCatModalOpen(true)}
            className="btn btn-secondary"
            id="admin-manage-categories-btn"
          >
            <Layers size={16} /> Manage Categories ({categories.length})
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn btn-primary"
            id="admin-add-product-btn"
          >
            <Plus size={18} /> Add New Product
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        backgroundColor: 'var(--color-surface-card)',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-subtle)',
        marginBottom: '1.75rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          <input
            type="text"
            placeholder="Search products by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ maxWidth: '280px', height: '36px', fontSize: '0.875rem' }}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto', height: '36px', padding: '0.4rem 1.75rem 0.4rem 0.75rem', fontSize: '0.875rem' }}
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Showing <strong>{filteredProducts.length}</strong> of {products.length} products
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading inventory...</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--color-surface-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          overflowX: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-bg)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Garment Details</th>
                <th style={{ padding: '1rem 1.25rem' }}>Category</th>
                <th style={{ padding: '1rem 1.25rem' }}>Sizes</th>
                <th style={{ padding: '1rem 1.25rem' }}>Price</th>
                <th style={{ padding: '1rem 1.25rem' }}>Stock</th>
                <th style={{ padding: '1rem 1.25rem' }}>Featured</th>
                <th style={{ padding: '1rem 1.25rem' }}>Status</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-surface-subtle)' }}>
                  {/* Garment Image & Name */}
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ position: 'relative', width: '48px', height: '60px', flexShrink: 0 }}>
                        <img
                          src={p.image_url}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                        />
                        {p.secondary_image_url && (
                          <span
                            title="Has secondary lookbook angle"
                            style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-2px',
                              backgroundColor: 'var(--color-brand-primary)',
                              color: '#FFF',
                              fontSize: '0.6rem',
                              padding: '1px 3px',
                              borderRadius: '2px'
                            }}
                          >
                            2x
                          </span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{p.name}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                          ID: #{p.id} • Slug: <code>{p.slug}</code>
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>
                    {p.category_name || <span style={{ fontStyle: 'italic' }}>Unassigned</span>}
                  </td>

                  {/* Sizes */}
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', maxWidth: '160px' }}>
                      {(p.sizes || 'S,M,L,XL').split(',').map((s, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.7rem',
                            padding: '1px 5px',
                            backgroundColor: 'var(--color-surface-subtle)',
                            borderRadius: '3px',
                            fontWeight: 600
                          }}
                        >
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Price */}
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800 }}>
                    ${parseFloat(p.price).toFixed(2)}
                  </td>

                  {/* Stock */}
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    {p.stock <= 0 ? (
                      <span className="badge badge-out-of-stock">0 (Sold Out)</span>
                    ) : p.stock <= 5 ? (
                      <span className="badge badge-low-stock">{p.stock} (Low)</span>
                    ) : (
                      <span className="badge badge-in-stock">{p.stock}</span>
                    )}
                  </td>

                  {/* Featured Toggle */}
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(p)}
                      className={`icon-btn ${p.is_featured ? 'active' : ''}`}
                      style={{
                        width: '2rem',
                        height: '2rem',
                        color: p.is_featured ? 'var(--color-brand-accent)' : 'var(--color-text-light)',
                        backgroundColor: p.is_featured ? '#FEF9C3' : 'transparent'
                      }}
                      title={p.is_featured ? 'Featured on Homepage (Click to toggle)' : 'Not Featured (Click to toggle)'}
                    >
                      <Star size={16} fill={p.is_featured ? 'var(--color-brand-accent)' : 'none'} />
                    </button>
                  </td>

                  {/* Active Status */}
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    {p.is_active ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-success)', fontWeight: 600, fontSize: '0.75rem' }}>
                        <Eye size={14} /> Active
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-light)', fontSize: '0.75rem' }}>
                        <EyeOff size={14} /> Inactive
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="icon-btn"
                        style={{ width: '2rem', height: '2rem' }}
                        title="Edit Product"
                        id={`edit-product-${p.id}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="icon-btn"
                        style={{ width: '2rem', height: '2rem', color: 'var(--color-danger)' }}
                        title="Deactivate / Delete"
                        id={`delete-product-${p.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit "${editingProduct.name}"` : 'Add New Garment Listing'}
        maxWidth="720px"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary btn-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={submitting || uploadingMainImage || uploadingSecImage}
              className="btn btn-primary btn-sm"
              id="admin-save-product-submit"
            >
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="prod_name">Product Name *</label>
            <input
              id="prod_name"
              type="text"
              required
              placeholder="e.g. Relaxed Linen Camp Collar Shirt"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="prod_price">Price ($) *</label>
              <input
                id="prod_price"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="78.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod_stock">Stock Quantity *</label>
              <input
                id="prod_stock"
                type="number"
                min="0"
                required
                placeholder="20"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prod_cat">Category *</label>
            <select
              id="prod_cat"
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="form-select"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sizes / Variants Selector */}
          <div className="form-group" style={{ backgroundColor: 'var(--color-surface-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                <Tag size={14} style={{ display: 'inline', marginRight: '4px' }} /> Available Sizes / Variants *
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Click to toggle or type below
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {STANDARD_SIZES.map((size) => {
                const isSelected = parsedFormSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleToggleSize(size)}
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                  >
                    {isSelected && <Check size={12} style={{ marginRight: '2px' }} />}
                    {size}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              placeholder="Comma-separated sizes (e.g. S,M,L,XL or 30,32,34)"
              value={formData.sizes}
              onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
              className="form-input"
              style={{ backgroundColor: '#FFF' }}
            />
          </div>

          {/* Main Image */}
          <div className="form-group">
            <label className="form-label">Primary Product Image *</label>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                required
                placeholder="Image URL or upload"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="form-input"
              />
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', flexShrink: 0 }}>
                <Upload size={14} />
                <span>{uploadingMainImage ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileUpload(e, 'image_url', setUploadingMainImage)}
                  style={{ display: 'none' }}
                  disabled={uploadingMainImage}
                />
              </label>
            </div>
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt="Primary Preview"
                style={{ width: '60px', height: '75px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />
            )}
          </div>

          {/* Secondary Lookbook Angle Image */}
          <div className="form-group">
            <label className="form-label">Secondary Image (Optional Lookbook / Detail Angle)</label>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                placeholder="Secondary image URL or upload"
                value={formData.secondary_image_url}
                onChange={(e) => setFormData({ ...formData, secondary_image_url: e.target.value })}
                className="form-input"
              />
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', flexShrink: 0 }}>
                <Upload size={14} />
                <span>{uploadingSecImage ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileUpload(e, 'secondary_image_url', setUploadingSecImage)}
                  style={{ display: 'none' }}
                  disabled={uploadingSecImage}
                />
              </label>
            </div>
            {formData.secondary_image_url && (
              <img
                src={formData.secondary_image_url}
                alt="Secondary Preview"
                style={{ width: '60px', height: '75px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prod_desc">Description *</label>
            <textarea
              id="prod_desc"
              rows="3"
              required
              placeholder="Fabric details, construction, fit guidelines..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              />
              Feature on Homepage Showcase
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              Visible in Store Catalog
            </label>
          </div>
        </form>
      </Modal>

      {/* Categories Management Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title="Product Categories Management"
        maxWidth="680px"
        footer={
          <button
            type="button"
            onClick={() => setIsCatModalOpen(false)}
            className="btn btn-secondary btn-sm"
          >
            Done
          </button>
        }
      >
        <div>
          {/* Create / Edit Category Form */}
          <div style={{
            backgroundColor: 'var(--color-surface-bg)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              {catFormData.id ? 'Edit Category' : 'Create New Category'}
            </h4>
            <form onSubmit={handleSaveCategory}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  required
                  placeholder="Category Name (e.g. Knitwear)"
                  value={catFormData.name}
                  onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Image URL (optional)"
                  value={catFormData.image_url}
                  onChange={(e) => setCatFormData({ ...catFormData, image_url: e.target.value })}
                  className="form-input"
                />
              </div>
              <input
                type="text"
                placeholder="Category description (e.g. 100% French Flax linen shirts)"
                value={catFormData.description}
                onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                className="form-input"
                style={{ marginBottom: '0.75rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="btn btn-primary btn-sm"
                >
                  {savingCat ? 'Saving...' : catFormData.id ? 'Update Category' : '+ Add Category'}
                </button>
                {catFormData.id && (
                  <button
                    type="button"
                    onClick={() => setCatFormData({ id: null, name: '', description: '', image_url: '' })}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Category List */}
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Existing Categories ({categories.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  backgroundColor: '#FFF',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{cat.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Slug: <code>{cat.slug}</code> • {cat.description || 'No description'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setCatFormData({ id: cat.id, name: cat.name, description: cat.description || '', image_url: cat.image_url || '' })}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    className="icon-btn"
                    style={{ width: '1.75rem', height: '1.75rem', color: 'var(--color-danger)' }}
                    title="Delete Category"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
