import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, CheckCircle2, Clock, Truck, XCircle, Package } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/Modal';

export function AdminOrders({ onDataChanged }) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminOrders(statusFilter, searchQuery);
      setOrders(data);
    } catch (err) {
      showToast(err.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, searchQuery]);

  const handleOpenDetail = async (orderId) => {
    setDetailLoading(true);
    try {
      const fullOrder = await api.getAdminOrder(orderId);
      setSelectedOrder(fullOrder);
      setNewStatus(fullOrder.order_status);
      setStatusComment('');
    } catch (err) {
      showToast(err.message || 'Failed to load order details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    try {
      const res = await api.updateOrderStatus(selectedOrder.id, newStatus, statusComment);
      showToast(`Order status updated to ${newStatus}`, 'success');
      setSelectedOrder(res.order);
      await loadOrders(); // refresh table
      onDataChanged?.(); // synchronize overview metrics & recent orders
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="admin-orders">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Orders & Fulfillment</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Monitor customer orders, review deliveries, and update shipment progress.
        </p>
      </div>

      {/* Filter toolbar */}
      <div style={{
        backgroundColor: 'var(--color-surface-card)',
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-subtle)',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Status filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', textTransform: 'capitalize' }}
              id={`order-filter-${st}`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
          <input
            type="text"
            placeholder="Search by Order # or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', fontSize: '0.875rem' }}
            id="admin-order-search"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state-card">
          <Package size={36} color="var(--color-text-muted)" />
          <h3>No orders found</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>There are no customer orders matching the active filters.</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--color-surface-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)',
          overflowX: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-bg)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Order Ref</th>
                <th style={{ padding: '1rem 1.25rem' }}>Customer</th>
                <th style={{ padding: '1rem 1.25rem' }}>Destination</th>
                <th style={{ padding: '1rem 1.25rem' }}>Total</th>
                <th style={{ padding: '1rem 1.25rem' }}>Payment</th>
                <th style={{ padding: '1rem 1.25rem' }}>Status</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--color-surface-subtle)' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
                    {o.order_number}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ fontWeight: 600 }}>{o.customer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{o.customer_email}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>
                    {o.city}, {o.postal_code}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>
                    ${parseFloat(o.total_amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                      {o.payment_method} ({o.payment_status})
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span className={`badge badge-${o.order_status}`}>
                      {o.order_status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenDetail(o.id)}
                      className="btn btn-sm btn-secondary"
                      id={`view-order-btn-${o.id}`}
                    >
                      <Eye size={14} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail & Status Update Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order #${selectedOrder.order_number}` : ''}
        maxWidth="680px"
      >
        {selectedOrder && (
          <div>
            {/* Status Changer Form */}
            <form onSubmit={handleStatusUpdate} style={{
              backgroundColor: 'var(--color-surface-bg)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Update Order Fulfillment Status
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.75rem', alignItems: 'center' }}>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="form-select"
                  id="admin-change-status-select"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <input
                  type="text"
                  placeholder="Optional note / tracking comment..."
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  className="form-input"
                  id="admin-status-comment-input"
                />

                <button
                  type="submit"
                  disabled={updating}
                  className="btn btn-primary btn-sm"
                  id="admin-save-status-btn"
                >
                  {updating ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>

            {/* Customer & Address Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <div style={{ background: '#FFF', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-light)' }}>
                  Customer Details
                </span>
                <p style={{ fontWeight: 600, marginTop: '0.25rem' }}>{selectedOrder.customer_name}</p>
                <p style={{ color: 'var(--color-text-muted)' }}>Email: {selectedOrder.customer_email}</p>
                <p style={{ color: 'var(--color-text-muted)' }}>Phone: {selectedOrder.customer_phone}</p>
              </div>

              <div style={{ background: '#FFF', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-light)' }}>
                  Shipping Address
                </span>
                <p style={{ marginTop: '0.25rem' }}>{selectedOrder.shipping_address}</p>
                <p style={{ color: 'var(--color-text-muted)' }}>{selectedOrder.city}, {selectedOrder.postal_code}</p>
                {selectedOrder.notes && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-warning)', marginTop: '0.25rem' }}>
                    Note: "{selectedOrder.notes}"
                  </p>
                )}
              </div>
            </div>

            {/* Order Items Table */}
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Purchased Garments
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-surface-subtle)', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.product_name}</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Quantity: {item.quantity} &times; ${parseFloat(item.product_price).toFixed(2)}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700 }}>
                    ${parseFloat(item.subtotal).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '1.125rem', fontWeight: 800, borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem' }}>
              <span>Total Payable: ${parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
