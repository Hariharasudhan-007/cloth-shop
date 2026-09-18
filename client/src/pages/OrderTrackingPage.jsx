import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ArrowLeft,
  Check,
  CreditCard,
  Calendar,
  Box,
  Send,
  Home
} from 'lucide-react';
import { api } from '../services/api';

export function OrderTrackingPage({ initialOrderNumber = '', onBack }) {
  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = async (numberToFetch) => {
    const cleanNumber = numberToFetch.trim();
    if (!cleanNumber) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.trackOrder(cleanNumber);
      setOrder(data);
    } catch (err) {
      setOrder(null);
      setError(err.message || 'Order reference not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      fetchOrder(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (orderNumberInput.trim()) {
      fetchOrder(orderNumberInput);
    }
  };

  // 5-Milestone Tracking Progress Calculation
  const getMilestoneIndex = (orderStatus, paymentStatus) => {
    if (orderStatus === 'cancelled') return -1;
    if (orderStatus === 'delivered') return 5;
    if (orderStatus === 'shipped') return 4;
    if (orderStatus === 'processing') return 3;
    if (orderStatus === 'confirmed' || paymentStatus === 'paid') return 2;
    return 1; // Order Placed
  };

  const milestones = [
    { id: 1, label: 'Order Placed', desc: 'Received in atelier system', icon: Box },
    { id: 2, label: 'Confirmed', desc: 'Inventory verified & accepted', icon: CheckCircle2 },
    { id: 3, label: 'Processing', desc: 'Inspected & packaged', icon: Clock },
    { id: 4, label: 'Shipped', desc: 'Dispatched with courier', icon: Send },
    { id: 5, label: 'Delivered', desc: 'Safely arrived at destination', icon: Home }
  ];

  const currentStep = order ? getMilestoneIndex(order.order_status, order.payment_status) : 0;

  return (
    <div className="order-tracking-page" style={{ padding: '3.5rem 0 6rem' }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        <button
          onClick={onBack}
          className="btn btn-sm"
          style={{ color: 'var(--color-text-muted)', padding: '0.4rem 0', marginBottom: '2rem' }}
        >
          <ArrowLeft size={16} /> Back to Catalog
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="editorial-tag" style={{ marginBottom: '0.5rem' }}>
            ATELIER LOGISTICS // LIVE FULFILLMENT
          </span>
          <h1 className="heading-title" style={{ marginTop: '0.25rem' }}>
            Visual Order Tracking
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginTop: '0.375rem' }}>
            Enter your order reference code (e.g. ORD-202609-XXXX) to monitor dispatch milestones.
          </p>
        </div>

        {/* Lookup Form */}
        <form onSubmit={handleSearch} className="tracking-search-form">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} className="tracking-search-icon" />
            <input
              type="text"
              placeholder="Enter your Order Reference Number..."
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              className="tracking-search-input"
              id="tracking-input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </form>

        {error && (
          <div className="tracking-error-box">
            <AlertCircle size={20} />
            <div>
              <strong>Order Lookup Failed</strong>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{error}</p>
            </div>
          </div>
        )}

        {order && (
          <div className="tracking-card">
            {/* Top Order Metadata Strip */}
            <div className="tracking-summary-strip">
              <div>
                <span className="tracking-meta-label">ORDER REFERENCE</span>
                <h3 className="tracking-order-num">{order.order_number}</h3>
                <span className="tracking-meta-date">
                  <Calendar size={13} /> Placed on {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`badge ${order.payment_status === 'paid' ? 'badge-in-stock' : 'badge-low-stock'}`}>
                  Payment: {order.payment_status.toUpperCase()} ({order.payment_method.toUpperCase()})
                </span>
                <span className="badge badge-in-stock">
                  Status: {order.order_status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Visual 5-Step Milestone Progress Stepper */}
            {currentStep === -1 ? (
              <div className="tracking-cancelled-box">
                <AlertCircle size={24} color="var(--color-danger)" />
                <div>
                  <h4>Order Cancelled</h4>
                  <p>This order was cancelled. Any authorized charges are automatically released.</p>
                </div>
              </div>
            ) : (
              <div className="milestone-stepper-container">
                <div className="milestone-stepper-line" />
                <div
                  className="milestone-stepper-progress"
                  style={{ width: `${Math.min(100, Math.max(0, ((currentStep - 1) / (milestones.length - 1)) * 100))}%` }}
                />

                <div className="milestone-steps-row">
                  {milestones.map((step) => {
                    const StepIcon = step.icon;
                    const isPassed = currentStep >= step.id;
                    const isCurrent = currentStep === step.id;

                    return (
                      <div
                        key={step.id}
                        className={`milestone-step-item ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`}
                      >
                        <div className="milestone-step-icon-wrap">
                          {isPassed ? <Check size={16} /> : <StepIcon size={16} />}
                        </div>
                        <span className="milestone-step-label">{step.label}</span>
                        <span className="milestone-step-desc">{step.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Destination & Contact Masking */}
            <div className="tracking-details-grid">
              <div>
                <h4 className="tracking-section-title">Shipping Destination</h4>
                <p className="tracking-destination-text">
                  <strong>{order.customer_name}</strong><br />
                  {order.shipping_address}<br />
                  {order.city}, {order.postal_code}<br />
                  Contact: {order.customer_phone_masked} • {order.customer_email_masked}
                </p>
              </div>

              <div>
                <h4 className="tracking-section-title">Payment Overview</h4>
                <div className="tracking-payment-details">
                  <div className="payment-row">
                    <span>Payment Method:</span>
                    <strong>{order.payment_method.toUpperCase()}</strong>
                  </div>
                  <div className="payment-row">
                    <span>Payment Status:</span>
                    <strong style={{ color: order.payment_status === 'paid' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {order.payment_status.toUpperCase()}
                    </strong>
                  </div>
                  <div className="payment-row">
                    <span>Total Amount:</span>
                    <strong style={{ fontSize: '1.125rem' }}>${order.total_amount.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="tracking-items-section">
              <h4 className="tracking-section-title">Garments in this Shipment ({order.items?.length || 0})</h4>
              <div className="tracking-items-list">
                {order.items?.map((item) => (
                  <div key={item.id} className="tracking-item-row">
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="tracking-item-thumb"
                    />
                    <div style={{ flex: 1 }}>
                      <h5 className="tracking-item-name">{item.product_name}</h5>
                      <span className="tracking-item-qty">
                        Qty: {item.quantity} &times; ${item.product_price.toFixed(2)}
                      </span>
                    </div>
                    <span className="tracking-item-total">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status History Timeline */}
            {order.history && order.history.length > 0 && (
              <div className="tracking-history-section">
                <h4 className="tracking-section-title">Activity Timeline</h4>
                <div className="tracking-timeline-list">
                  {order.history.map((h, i) => (
                    <div key={i} className="timeline-event-item">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="timeline-status">{h.status.toUpperCase()}</span>
                          <span className="timeline-date">{new Date(h.created_at).toLocaleString()}</span>
                        </div>
                        {h.comment && <p className="timeline-comment">{h.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
