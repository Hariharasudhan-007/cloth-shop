import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, Instagram, MapPin, Clock, Save, ExternalLink, Mail, Globe } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function AdminContact({ onDataChanged }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [contact, setContact] = useState({
    phone: '+1 (555) 234-5678',
    whatsapp: '+1 (555) 234-5678',
    whatsapp_number_clean: '15552345678',
    instagram: 'https://instagram.com/threadandloom',
    instagram_handle: '@threadandloom',
    email: 'contact@threadandloom.com',
    address: '142 Silkweaver Lane, Atelier Row, New York, NY 10012',
    hours: 'Mon – Sat: 9:30 AM – 8:00 PM (EST)',
    google_maps_url: 'https://maps.google.com/?q=SoHo+New+York+NY',
    google_maps_embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.517374020959!2d-74.00281652336338!3d40.72594613659223!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c2598c116c4f0b%3A0x6b4501a3574c8a14!2sSoHo%2C%20New%20York%2C%20NY!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus'
  });

  useEffect(() => {
    async function loadContact() {
      setLoading(true);
      try {
        const res = await api.getAdminContent();
        if (res?.content?.contact_info) {
          setContact(res.content.contact_info);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load contact info', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadContact();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Ensure clean whatsapp numeric format for direct wa.me links
      const cleanWa = contact.whatsapp.replace(/\D/g, '');
      const payload = {
        ...contact,
        whatsapp_number_clean: cleanWa || contact.whatsapp
      };

      await api.updateAdminContent('contact_info', payload);
      setContact(payload);
      onDataChanged?.();
      showToast('Contact and social details saved and synchronized!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update contact info', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p>Loading contact information...</p>
      </div>
    );
  }

  const cleanWaNumber = contact.whatsapp.replace(/\D/g, '') || '15552345678';

  return (
    <div className="admin-contact-manager">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>
          Contact Information & Social Links
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Manage your telephone, direct WhatsApp ordering line, Instagram handle, physical atelier location, and Google Maps integration.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(300px, 1fr)',
        gap: '2.5rem',
        alignItems: 'start'
      }} className="admin-grid-responsive">
        {/* Contact Form */}
        <div style={{
          backgroundColor: 'var(--color-surface-card)',
          padding: '2.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="cnt_phone">
                  <Phone size={14} style={{ display: 'inline', marginRight: '4px' }} /> Phone Number
                </label>
                <input
                  id="cnt_phone"
                  type="text"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  className="form-input"
                  placeholder="+1 (555) 234-5678"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cnt_whatsapp">
                  <MessageSquare size={14} style={{ display: 'inline', marginRight: '4px' }} /> WhatsApp Line
                </label>
                <input
                  id="cnt_whatsapp"
                  type="text"
                  value={contact.whatsapp}
                  onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
                  className="form-input"
                  placeholder="+1 (555) 234-5678"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="cnt_email">
                  <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} /> Concierge Email
                </label>
                <input
                  id="cnt_email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="form-input"
                  placeholder="contact@threadandloom.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cnt_hours">
                  <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} /> Business Hours
                </label>
                <input
                  id="cnt_hours"
                  type="text"
                  value={contact.hours}
                  onChange={(e) => setContact({ ...contact, hours: e.target.value })}
                  className="form-input"
                  placeholder="Mon – Sat: 9:30 AM – 8:00 PM"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="cnt_insta">
                  <Instagram size={14} style={{ display: 'inline', marginRight: '4px' }} /> Instagram URL
                </label>
                <input
                  id="cnt_insta"
                  type="url"
                  value={contact.instagram}
                  onChange={(e) => setContact({ ...contact, instagram: e.target.value })}
                  className="form-input"
                  placeholder="https://instagram.com/threadandloom"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cnt_insta_handle">
                  Instagram Handle
                </label>
                <input
                  id="cnt_insta_handle"
                  type="text"
                  value={contact.instagram_handle}
                  onChange={(e) => setContact({ ...contact, instagram_handle: e.target.value })}
                  className="form-input"
                  placeholder="@threadandloom"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cnt_address">
                <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} /> Physical Atelier Address
              </label>
              <input
                id="cnt_address"
                type="text"
                value={contact.address}
                onChange={(e) => setContact({ ...contact, address: e.target.value })}
                className="form-input"
                placeholder="142 Silkweaver Lane, Atelier Row, New York, NY 10012"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cnt_maps_url">
                <Globe size={14} style={{ display: 'inline', marginRight: '4px' }} /> Google Maps Direct URL
              </label>
              <input
                id="cnt_maps_url"
                type="url"
                value={contact.google_maps_url}
                onChange={(e) => setContact({ ...contact, google_maps_url: e.target.value })}
                className="form-input"
                placeholder="https://maps.google.com/?q=..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cnt_maps_embed">
                Google Maps Embed URL (for interactive map widget)
              </label>
              <input
                id="cnt_maps_embed"
                type="text"
                value={contact.google_maps_embed}
                onChange={(e) => setContact({ ...contact, google_maps_embed: e.target.value })}
                className="form-input"
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '0.25rem', display: 'block' }}>
                Paste the URL from Google Maps &gt; Share &gt; Embed a map &gt; src attribute.
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', marginTop: '1rem' }}
              id="save-contact-btn"
            >
              {saving ? 'Saving Information...' : 'Save & Publish Contact Details'}
            </button>
          </form>
        </div>

        {/* Live Preview & Quick Actions */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            Storefront Integration Preview
          </div>

          <div style={{
            backgroundColor: 'var(--color-surface-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-brand-primary)' }}>
              Live Customer Actions
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <a
                href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent('Hello Thread & Loom Atelier, I have an enquiry about your collection.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
                style={{
                  backgroundColor: '#25D366',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: 600
                }}
              >
                <MessageSquare size={16} /> Test WhatsApp Link ({contact.whatsapp})
              </a>

              <a
                href={`tel:${contact.phone}`}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Phone size={16} /> Test Phone Call ({contact.phone})
              </a>

              <a
                href={contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Instagram size={16} /> Visit Instagram ({contact.instagram_handle || '@threadandloom'})
              </a>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                <strong>Address:</strong><br />
                {contact.address}<br />
                <strong>Hours:</strong> {contact.hours}<br />
                <strong>Email:</strong> {contact.email}
              </div>
            </div>
          </div>

          {/* Interactive Google Map Preview */}
          <div style={{
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              backgroundColor: 'var(--color-brand-primary)',
              color: '#FFF',
              padding: '0.75rem 1rem',
              fontSize: '0.8125rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Google Maps Location Preview</span>
              {contact.google_maps_url && (
                <a
                  href={contact.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-brand-accent)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Open in Maps <ExternalLink size={12} />
                </a>
              )}
            </div>

            {contact.google_maps_embed ? (
              <iframe
                title="Google Maps Location"
                src={contact.google_maps_embed}
                width="100%"
                height="240"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
              />
            ) : (
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAE6DC', color: 'var(--color-text-muted)' }}>
                No map embed URL provided
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
