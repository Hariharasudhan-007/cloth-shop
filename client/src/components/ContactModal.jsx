import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Building, MapPin, Check, Send, ExternalLink, X } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Modal } from './Modal';

export function ContactModal({ isOpen, onClose, defaultType = 'customer', contactInfo = null }) {
  const { showToast } = useToast();
  const [enquiryType, setEnquiryType] = useState(defaultType); // 'customer' | 'distributor_wholesale'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.submitEnquiry({
        ...formData,
        type: enquiryType
      });
      setSubmitted(true);
      showToast(
        enquiryType === 'distributor_wholesale'
          ? 'Wholesale partnership enquiry received. We will be in touch shortly.'
          : 'Thank you! Your message has been sent to our atelier team.',
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to send message. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const cleanWaNumber = contactInfo?.whatsapp_number_clean || contactInfo?.whatsapp?.replace(/\D/g, '') || '15552345678';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={enquiryType === 'distributor_wholesale' ? 'Wholesale & Distributor Partnership' : 'Contact Atelier Customer Care'}
      maxWidth="620px"
    >
      <div>
        {/* Direct Connect Quick Action Strip */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}>
          {contactInfo?.whatsapp && (
            <a
              href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent('Hello Thread & Loom, I am contacting you from the website.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm"
              style={{
                backgroundColor: '#25D366',
                color: '#FFF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8125rem'
              }}
            >
              <MessageSquare size={15} /> Chat on WhatsApp
            </a>
          )}

          {contactInfo?.phone && (
            <a
              href={`tel:${contactInfo.phone}`}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
            >
              <Phone size={14} /> Call {contactInfo.phone}
            </a>
          )}

          {contactInfo?.google_maps_url && (
            <a
              href={contactInfo.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
            >
              <MapPin size={14} /> View Atelier Map <ExternalLink size={11} />
            </a>
          )}
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Check size={28} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-brand-primary)', marginBottom: '0.5rem' }}>
              Enquiry Received
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', maxWidth: '420px', margin: '0 auto 1.75rem', lineHeight: '1.6' }}>
              Thank you for reaching out. A specialist from our atelier will review your enquiry and get back to you within 24 hours.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: '', email: '', phone: '', company_name: '', subject: '', message: '' });
                onClose();
              }}
              className="btn btn-primary btn-sm"
            >
              Return to Browsing
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Type Switcher Pills */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--color-surface-bg)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              border: '1px solid var(--color-border-subtle)'
            }}>
              <button
                type="button"
                onClick={() => setEnquiryType('customer')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: enquiryType === 'customer' ? '#FFF' : 'transparent',
                  color: enquiryType === 'customer' ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                  fontWeight: enquiryType === 'customer' ? 700 : 500,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  boxShadow: enquiryType === 'customer' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                Customer Store Enquiry
              </button>
              <button
                type="button"
                onClick={() => setEnquiryType('distributor_wholesale')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: enquiryType === 'distributor_wholesale' ? '#FFF' : 'transparent',
                  color: enquiryType === 'distributor_wholesale' ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                  fontWeight: enquiryType === 'distributor_wholesale' ? 700 : 500,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  boxShadow: enquiryType === 'distributor_wholesale' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                Distributor / Wholesale
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="enq_name">Your Full Name *</label>
                <input
                  id="enq_name"
                  type="text"
                  required
                  placeholder="e.g. Liam Henderson"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="enq_email">Email Address *</label>
                <input
                  id="enq_email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: enquiryType === 'distributor_wholesale' ? '1fr 1fr' : '1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="enq_phone">Phone / WhatsApp Number</label>
                <input
                  id="enq_phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                />
              </div>

              {enquiryType === 'distributor_wholesale' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="enq_company">Company / Boutique Name *</label>
                  <input
                    id="enq_company"
                    type="text"
                    required
                    placeholder="e.g. Nordic Concept Store Ltd"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="form-input"
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="enq_subject">Subject</label>
              <input
                id="enq_subject"
                type="text"
                placeholder={enquiryType === 'distributor_wholesale' ? 'e.g. Wholesale catalog and volume inquiries' : 'e.g. Sizing or garment care question'}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="enq_msg">Message / Requirements *</label>
              <textarea
                id="enq_msg"
                rows="4"
                required
                placeholder={
                  enquiryType === 'distributor_wholesale'
                    ? 'Please tell us about your retail location, estimated order volume, target silhouettes, or delivery timeline...'
                    : 'How can our atelier help you today?'
                }
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="form-textarea"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-full"
              style={{ padding: '0.85rem 1.5rem', fontWeight: 700 }}
              id="submit-enquiry-btn"
            >
              {submitting ? 'Submitting Enquiry...' : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Send size={15} /> Send Enquiry to Atelier
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
