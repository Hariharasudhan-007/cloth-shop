import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminLogin({ onLoginSuccess, onBackToStore }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your administrator email.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);

    try {
      await login(email.trim(), password);
      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please verify your administrator credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '90vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1.25rem',
      backgroundColor: 'var(--color-surface-bg)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'var(--color-surface-card)',
        padding: '2.75rem 2.25rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: 'var(--shadow-xl)'
      }}>
        <button
          onClick={onBackToStore}
          className="btn btn-sm"
          style={{
            color: 'var(--color-text-muted)',
            padding: '0.35rem 0',
            marginBottom: '1.75rem',
            background: 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.875rem'
          }}
        >
          <ArrowLeft size={16} /> Return to Storefront
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3.75rem',
            height: '3.75rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-brand-primary)',
            color: 'var(--color-brand-accent)',
            marginBottom: '1.25rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <Shield size={28} />
          </div>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-brand-accent)',
            marginBottom: '0.35rem'
          }}>
            Restricted Management Area
          </div>
          <h1 style={{
            fontSize: '1.625rem',
            fontWeight: 800,
            color: 'var(--color-brand-primary)',
            letterSpacing: '-0.02em'
          }}>
            Admin Authentication
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.35rem',
            lineHeight: '1.5'
          }}>
            Sign in with authorized staff credentials to access store controls and inventory management.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--color-danger-bg)',
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            border: '1px solid rgba(185, 28, 28, 0.2)'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="admin_email">
              Admin Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-light)'
                }}
              />
              <input
                id="admin_email"
                type="email"
                autoComplete="email"
                required
                placeholder="e.g. admin@threadandloom.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.6rem' }}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="admin_password" style={{ marginBottom: 0 }}>
                Password
              </label>
            </div>
            <div style={{ position: 'relative', marginTop: '0.35rem' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-light)'
                }}
              />
              <input
                id="admin_password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem' }}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-light)',
                  padding: '4px'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-full"
            style={{
              padding: '0.95rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: 'var(--shadow-md)'
            }}
            id="admin-login-submit-btn"
          >
            {submitting ? (
              <div className="spinner spinner-light" style={{ margin: '0 auto' }} />
            ) : (
              'Enter Admin Dashboard'
            )}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'var(--color-surface-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          lineHeight: '1.5',
          border: '1px solid var(--color-border-subtle)'
        }}>
          <strong>Security Notice:</strong> Staff access is restricted to verified administrators. Sessions are encrypted via signed HTTP-Only tokens. All administrative changes are logged.
        </div>
      </div>
    </div>
  );
}
