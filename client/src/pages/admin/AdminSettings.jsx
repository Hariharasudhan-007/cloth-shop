import React, { useState } from 'react';
import { Lock, Key, Shield, Check, AlertCircle, Info, User } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function AdminSettings() {
  const { adminUser } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.changeAdminPassword(currentPassword, newPassword);
      setSuccessMsg(res.message || 'Password updated securely.');
      showToast('Admin password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
      showToast(err.message || 'Password update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-settings-manager">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>
          Security & Administrator Settings
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Update your administrative credentials, manage environment keys, and view access permissions.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(300px, 1fr)',
        gap: '2.5rem',
        alignItems: 'start'
      }} className="admin-grid-responsive">
        {/* Change Password Form */}
        <div style={{
          backgroundColor: 'var(--color-surface-card)',
          padding: '2.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Key size={20} color="var(--color-brand-accent)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
              Update Administrator Password
            </h3>
          </div>

          {error && (
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="current_pwd">Current Password *</label>
              <input
                id="current_pwd"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="form-input"
                placeholder="Enter current admin password"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new_pwd">New Password (min. 8 characters) *</label>
              <input
                id="new_pwd"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
                placeholder="Enter strong new password"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm_pwd">Confirm New Password *</label>
              <input
                id="confirm_pwd"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Re-type new password"
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
              id="admin-change-password-submit"
            >
              {submitting ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>

        {/* Security Info & Environment Setup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Administrator Profile */}
          <div style={{
            backgroundColor: 'var(--color-surface-card)',
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-surface-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-brand-primary)'
              }}>
                <User size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  Active Administrator
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Authenticated Staff Session
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--color-text-muted)' }}>
              <div><strong>Name:</strong> {adminUser?.name || 'Administrator'}</div>
              <div><strong>Email:</strong> {adminUser?.email || 'admin@threadandloom.com'}</div>
              <div><strong>Role:</strong> <span className="badge badge-in-stock">Admin Privileges</span></div>
            </div>
          </div>

          {/* Environment Configuration Guide */}
          <div style={{
            backgroundColor: 'var(--color-surface-subtle)',
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Shield size={18} color="var(--color-brand-primary)" />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>
                Server Environment Keys (.env)
              </h4>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: '1.5', marginBottom: '0.75rem' }}>
              The server uses environment variables in the project root <code>.env</code> file for initial provisioning. Credentials are encrypted via bcrypt in SQLite:
            </p>
            <pre style={{
              backgroundColor: '#1E293B',
              color: '#F8FAFC',
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              overflowX: 'auto',
              lineHeight: '1.5'
            }}>
ADMIN_EMAIL=admin@threadandloom.com
ADMIN_DEFAULT_PASSWORD=YourSecurePassword!
JWT_SECRET=your_secret_key_here
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
