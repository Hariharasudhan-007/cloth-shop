import React, { useState, useEffect } from 'react';
import { Truck, RotateCcw, ShieldCheck, HeartHandshake, Instagram, Facebook, Youtube, ArrowRight, Check, Shield, MessageSquare, Phone, MapPin, Mail } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export function Footer({ setCurrentRoute, onOpenContact }) {
  const { showToast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    phone: '+1 (555) 234-5678',
    whatsapp: '+1 (555) 234-5678',
    whatsapp_number_clean: '15552345678',
    instagram: 'https://instagram.com/threadandloom',
    email: 'contact@threadandloom.com',
    address: '142 Silkweaver Lane, Atelier Row, New York, NY 10012',
    hours: 'Mon – Sat: 9:30 AM – 8:00 PM'
  });

  useEffect(() => {
    async function loadContact() {
      try {
        const res = await api.getContent();
        if (res?.content?.contact_info) {
          setContactInfo((prev) => ({ ...prev, ...res.content.contact_info }));
        }
      } catch (e) {
        // Fallback gracefully to default contact info
      }
    }
    loadContact();
  }, []);

  const handleNav = (name, params = null) => {
    setCurrentRoute({ name, params });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (newsletterEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail.trim())) {
      setSubscribed(true);
      showToast('Thank you for joining our private atelier dispatch.', 'success');
      setNewsletterEmail('');
    } else {
      showToast('Please provide a valid email address.', 'error');
    }
  };

  const cleanWaNumber = contactInfo.whatsapp_number_clean || contactInfo.whatsapp?.replace(/\D/g, '') || '15552345678';

  return (
    <footer className="site-footer">
      <div className="container">
        {/* Value Highlights Strip */}
        <div className="footer-highlights-grid">
          <div className="footer-highlight-item">
            <div className="footer-highlight-icon">
              <Truck size={22} />
            </div>
            <div>
              <h4>Complimentary Shipping</h4>
              <p>On all orders exceeding $100</p>
            </div>
          </div>

          <div className="footer-highlight-item">
            <div className="footer-highlight-icon">
              <HeartHandshake size={22} />
            </div>
            <div>
              <h4>Doorstep Cash on Delivery</h4>
              <p>Inspect fabrics & pay at your door</p>
            </div>
          </div>

          <div className="footer-highlight-item">
            <div className="footer-highlight-icon">
              <RotateCcw size={22} />
            </div>
            <div>
              <h4>30-Day Fit Guarantee</h4>
              <p>Hassle-free returns or exchanges</p>
            </div>
          </div>

          <div className="footer-highlight-item">
            <div className="footer-highlight-icon">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4>100% Natural Yarns</h4>
              <p>Zero polyester or synthetic fillers</p>
            </div>
          </div>
        </div>

        {/* 4-Column Marketplace Footer Grid */}
        <div className="footer-grid">
          {/* Col 1: Brand & Newsletter */}
          <div className="footer-brand-col">
            <div className="footer-brand-title">THREAD & LOOM</div>
            <p className="footer-brand-bio">
              Modern everyday apparel consciously woven in small batches. We specialize in Normandy flax linen, raw Okayama selvedge denim, and extrafine merino wool.
            </p>

            <div className="newsletter-box">
              <span className="newsletter-label">THE ATELIER DISPATCH</span>
              <p className="newsletter-caption">Private capsule invitations & limited edition drops.</p>
              {subscribed ? (
                <div className="newsletter-success">
                  <Check size={16} /> Subscribed to private dispatch.
                </div>
              ) : (
                <form onSubmit={handleNewsletter} className="newsletter-form">
                  <input
                    type="email"
                    placeholder="Enter your email..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="newsletter-input"
                    aria-label="Newsletter email"
                  />
                  <button type="submit" className="newsletter-submit" aria-label="Subscribe">
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Col 2: Shop Sections */}
          <div>
            <h4 className="footer-col-title">Shop Collection</h4>
            <ul className="footer-links-list">
              <li>
                <button onClick={() => handleNav('shop', { gender: 'men' })} className="footer-link-btn">
                  Men’s Archive
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('shop', { gender: 'women' })} className="footer-link-btn">
                  Women’s Silhouettes
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('shop', { collection: 'new-arrivals' })} className="footer-link-btn">
                  2026 New Arrivals
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('shop', { collection: 'best-sellers' })} className="footer-link-btn">
                  Atelier Best Sellers
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('offers')} className="footer-link-btn text-accent">
                  Promotions & Deals
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Partnerships */}
          <div>
            <h4 className="footer-col-title">Customer Care</h4>
            <ul className="footer-links-list">
              <li>
                <button onClick={() => handleNav('track')} className="footer-link-btn">
                  Track Your Order
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('account')} className="footer-link-btn">
                  Customer Account & Addresses
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenContact && onOpenContact('customer')}
                  className="footer-link-btn"
                  id="footer-contact-btn"
                >
                  Contact Customer Care
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenContact && onOpenContact('distributor_wholesale')}
                  className="footer-link-btn text-accent"
                  id="footer-wholesale-btn"
                >
                  Distributor & Wholesale Inquiries
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('shop')} className="footer-link-btn">
                  Atelier Sizing & Shipping Guide
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('admin-login')}
                  className="footer-link-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    opacity: 0.8,
                    marginTop: '0.5rem',
                    fontSize: '0.8125rem'
                  }}
                  id="footer-admin-login-link"
                >
                  <Shield size={13} color="var(--color-brand-accent)" /> Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Company & Social */}
          <div>
            <h4 className="footer-col-title">Company & Atelier</h4>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#8896AB', marginBottom: '1rem' }}>
              {contactInfo.address}<br />
              {contactInfo.hours}<br />
              Email: <strong>{contactInfo.email}</strong><br />
              Tel: <strong>{contactInfo.phone}</strong>
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/${cleanWaNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'rgba(37,211,102,0.15)',
                  color: '#25D366',
                  borderColor: 'rgba(37,211,102,0.3)'
                }}
              >
                <MessageSquare size={13} /> WhatsApp
              </a>

              {contactInfo.phone && (
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Phone size={13} /> Call Us
                </a>
              )}
            </div>

            <h4 className="footer-col-title" style={{ marginTop: '1rem' }}>Follow Our Craft</h4>
            <div className="social-links-row">
              <a
                href={contactInfo.instagram || '#instagram'}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a href="#facebook" onClick={(e) => e.preventDefault()} className="social-icon-btn" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#youtube" onClick={(e) => e.preventDefault()} className="social-icon-btn" aria-label="YouTube">
                <Youtube size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Legal Copyright */}
        <div className="footer-bottom-bar">
          <div>&copy; {new Date().getFullYear()} Thread & Loom Atelier Co. All rights reserved.</div>
          <div className="footer-legal-links">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <a href="#refund" onClick={(e) => e.preventDefault()}>Refund Policy</a>
            <button
              onClick={() => handleNav('admin-login')}
              style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', opacity: 0.6 }}
            >
              Staff Login
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

