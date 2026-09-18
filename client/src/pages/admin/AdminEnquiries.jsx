import React, { useState, useEffect } from 'react';
import { Mail, Phone, Building, MessageSquare, Clock, CheckCircle2, AlertCircle, Trash2, Search, Filter, Eye, UserCheck } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/Modal';

export function AdminEnquiries({ onDataChanged }) {
  const { showToast } = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'customer' | 'distributor_wholesale'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'new' | 'in_progress' | 'resolved'
  const [search, setSearch] = useState('');

  // Details Modal State
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [modalStatus, setModalStatus] = useState('new');
  const [modalNotes, setModalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const loadEnquiries = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminEnquiries({
        type: typeFilter,
        status: statusFilter,
        search
      });
      setEnquiries(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load enquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadEnquiries();
  };

  const handleOpenDetails = (enq) => {
    setSelectedEnquiry(enq);
    setModalStatus(enq.status || 'new');
    setModalNotes(enq.notes || '');
  };

  const handleSaveDetails = async () => {
    if (!selectedEnquiry) return;
    setSavingNotes(true);
    try {
      const res = await api.updateAdminEnquiry(selectedEnquiry.id, {
        status: modalStatus,
        notes: modalNotes
      });
      showToast(`Enquiry status updated to "${modalStatus}".`, 'success');
      setSelectedEnquiry(null);
      loadEnquiries();
      onDataChanged?.();
    } catch (err) {
      showToast(err.message || 'Failed to update enquiry', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteEnquiry = async (enquiry) => {
    if (window.confirm(`Are you sure you want to delete enquiry from "${enquiry.name}"?`)) {
      try {
        await api.deleteAdminEnquiry(enquiry.id);
        showToast('Enquiry record deleted.', 'info');
        if (selectedEnquiry?.id === enquiry.id) {
          setSelectedEnquiry(null);
        }
        loadEnquiries();
        onDataChanged?.();
      } catch (err) {
        showToast(err.message || 'Failed to delete enquiry', 'error');
      }
    }
  };

  // Compute counts
  const totalCount = enquiries.length;
  const newCount = enquiries.filter((e) => e.status === 'new').length;
  const inProgressCount = enquiries.filter((e) => e.status === 'in_progress').length;
  const resolvedCount = enquiries.filter((e) => e.status === 'resolved').length;

  return (
    <div className="admin-enquiries-manager">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>
            Customer & Wholesale Enquiries
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Review customer product questions, custom sizing requests, and distributor/wholesale partnership applications.
          </p>
        </div>

        {/* Quick Summary Badges */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.5rem 0.85rem' }}>
            <strong>{newCount}</strong> New Pending
          </span>
          <span className="badge" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '0.5rem 0.85rem' }}>
            <strong>{inProgressCount}</strong> In Progress
          </span>
          <span className="badge" style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '0.5rem 0.85rem' }}>
            <strong>{resolvedCount}</strong> Resolved
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: 'var(--color-surface-card)',
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-subtle)',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Type Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`btn btn-sm ${typeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Inquiries
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('customer')}
            className={`btn btn-sm ${typeFilter === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Customer Enquiries
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('distributor_wholesale')}
            className={`btn btn-sm ${typeFilter === 'distributor_wholesale' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Distributor & Wholesale
          </button>
        </div>

        {/* Status Dropdown & Search Form */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 1.8rem 0.45rem 0.75rem', fontSize: '0.875rem' }}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
              <input
                type="text"
                placeholder="Search name, email, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2rem', paddingRight: '0.75rem', height: '36px', fontSize: '0.875rem' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm" style={{ height: '36px' }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Enquiries List */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading enquiries...</p>
        </div>
      ) : enquiries.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-surface-card)',
          padding: '4rem 2rem',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)'
        }}>
          <MessageSquare size={36} color="var(--color-text-light)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>No Enquiries Found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {search || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'New customer or wholesale enquiries will appear here in real time.'}
          </p>
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
                <th style={{ padding: '1rem 1.25rem' }}>Sender & Contact</th>
                <th style={{ padding: '1rem 1.25rem' }}>Type</th>
                <th style={{ padding: '1rem 1.25rem' }}>Subject & Message Excerpt</th>
                <th style={{ padding: '1rem 1.25rem' }}>Status</th>
                <th style={{ padding: '1rem 1.25rem' }}>Date</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enq) => (
                <tr key={enq.id} style={{ borderBottom: '1px solid var(--color-surface-subtle)' }}>
                  {/* Sender */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{enq.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Mail size={12} /> <a href={`mailto:${enq.email}`} style={{ textDecoration: 'underline' }}>{enq.email}</a>
                    </div>
                    {enq.phone && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Phone size={12} /> {enq.phone}
                      </div>
                    )}
                    {enq.company_name && (
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-brand-accent)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Building size={12} /> {enq.company_name}
                      </div>
                    )}
                  </td>

                  {/* Type */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {enq.type === 'distributor_wholesale' ? (
                      <span className="badge" style={{ backgroundColor: '#F3E8FF', color: '#6B21A8', fontWeight: 700, fontSize: '0.75rem' }}>
                        Distributor / Wholesale
                      </span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontWeight: 700, fontSize: '0.75rem' }}>
                        Customer Store
                      </span>
                    )}
                  </td>

                  {/* Subject & Message */}
                  <td style={{ padding: '1rem 1.25rem', maxWidth: '300px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.2rem' }}>
                      {enq.subject || 'Enquiry'}
                    </div>
                    <p style={{
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-muted)',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {enq.message}
                    </p>
                    {enq.notes && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', fontStyle: 'italic', marginTop: '4px' }}>
                        Staff note: {enq.notes}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {enq.status === 'new' && (
                      <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                        ● New
                      </span>
                    )}
                    {enq.status === 'in_progress' && (
                      <span className="badge" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                        ● In Progress
                      </span>
                    )}
                    {enq.status === 'resolved' && (
                      <span className="badge" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                        ✓ Resolved
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-light)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {new Date(enq.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(enq)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={13} /> View & Respond
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEnquiry(enq)}
                        className="icon-btn"
                        style={{ width: '1.85rem', height: '1.85rem', color: 'var(--color-danger)' }}
                        title="Delete enquiry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View & Respond Details Modal */}
      {selectedEnquiry && (
        <Modal
          isOpen={!!selectedEnquiry}
          onClose={() => setSelectedEnquiry(null)}
          title={
            selectedEnquiry.type === 'distributor_wholesale'
              ? `Distributor Enquiry: ${selectedEnquiry.company_name || selectedEnquiry.name}`
              : `Customer Enquiry: ${selectedEnquiry.name}`
          }
          maxWidth="640px"
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={savingNotes}
                className="btn btn-primary btn-sm"
                id="admin-save-enquiry-btn"
              >
                {savingNotes ? 'Saving...' : 'Update Enquiry Status'}
              </button>
            </>
          }
        >
          <div>
            {/* Sender Info Bar */}
            <div style={{
              backgroundColor: 'var(--color-surface-bg)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sender</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>{selectedEnquiry.name}</div>
                {selectedEnquiry.company_name && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-brand-accent)', fontWeight: 600 }}>
                    {selectedEnquiry.company_name}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Direct Contact</div>
                <div style={{ fontSize: '0.875rem' }}>
                  <a href={`mailto:${selectedEnquiry.email}`} style={{ color: 'var(--color-brand-primary)', textDecoration: 'underline' }}>
                    {selectedEnquiry.email}
                  </a>
                </div>
                {selectedEnquiry.phone && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    <a href={`tel:${selectedEnquiry.phone}`}>{selectedEnquiry.phone}</a>
                  </div>
                )}
              </div>
            </div>

            {/* Subject & Full Message */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-light)', marginBottom: '0.35rem' }}>
                Subject: {selectedEnquiry.subject}
              </div>
              <div style={{
                backgroundColor: '#FFF',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)',
                lineHeight: '1.6',
                color: 'var(--color-text-main)',
                fontSize: '0.9375rem',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedEnquiry.message}
              </div>
            </div>

            {/* Status & Staff Internal Notes Form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-subtle)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="enq_status_select">Processing Status</label>
                <select
                  id="enq_status_select"
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="new">New (Needs review)</option>
                  <option value="in_progress">In Progress (Staff in contact)</option>
                  <option value="resolved">Resolved (Complete)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="enq_notes">Private Staff Internal Notes</label>
                <textarea
                  id="enq_notes"
                  rows="3"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="form-textarea"
                  placeholder="e.g. Replied with wholesale price sheet on Friday, customer requested linen sample..."
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
