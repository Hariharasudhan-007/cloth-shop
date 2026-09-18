import React from 'react';
import { CheckCircle2, Printer, ArrowRight, PackageCheck, Copy, ShieldCheck, Tag } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export function OrderConfirmation({ order, onTrackOrder, onContinueShopping }) {
  const { showToast } = useToast();

  if (!order) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>No active order found</h2>
        <button onClick={onContinueShopping} className="btn btn-primary">
          Return to Catalog
        </button>
      </div>
    );
  }

  const isOnlinePaid = order.payment_status === 'paid';
  const isCod = order.payment_method === 'cod';

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    showToast('Order reference copied to clipboard!', 'info');
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="confirmation-page" style={{ padding: '4rem 0 6rem' }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        {/* Top Celebration Card */}
        <div style={{
          textAlign: 'center',
          backgroundColor: 'var(--color-surface-card)',
          padding: '3rem 2rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '4rem',
            height: '4rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle2 size={36} />
          </div>

          <h1 className="heading-title" style={{ color: 'var(--color-brand-primary)', marginBottom: '0.5rem' }}>
            Thank you for your order!
          </h1>

          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.0625rem', maxWidth: '560px', margin: '0 auto 1.5rem' }}>
            {isOnlinePaid ? (
              <span>Your payment was successfully verified via <strong>Razorpay</strong>. Our atelier artisans are preparing your garments for courier dispatch.</span>
            ) : isCod ? (
              <span>Your order is confirmed for <strong>Cash on Delivery</strong>. Inspect your garments upon delivery and pay the courier at your doorstep.</span>
            ) : (
              <span>Your order has been recorded in our atelier logistics system.</span>
            )}
          </p>

          {/* Reference Order Number Box */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            backgroundColor: 'var(--color-surface-bg)',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-border-strong)',
            marginBottom: '1.5rem'
          }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Order Reference:</span>
            <strong style={{ fontSize: '1.125rem', letterSpacing: '0.05em', color: 'var(--color-brand-primary)' }} id="confirmed-order-number">
              {order.order_number}
            </strong>
            <button
              onClick={copyOrderNumber}
              className="icon-btn"
              style={{ width: '1.75rem', height: '1.75rem' }}
              title="Copy Order ID"
            >
              <Copy size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onTrackOrder(order.order_number)}
              className="btn btn-primary btn-sm"
              id="confirm-track-btn"
            >
              <PackageCheck size={16} /> Track Order Milestones
            </button>
            <button
              onClick={printReceipt}
              className="btn btn-secondary btn-sm"
            >
              <Printer size={16} /> Print Receipt
            </button>
          </div>
        </div>

        {/* Detailed Receipt Card */}
        <div style={{
          backgroundColor: 'var(--color-surface-card)',
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
            Order Details & Items
          </h3>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {order.items?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--color-surface-subtle)' }}>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{item.product_name}</h4>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Qty: {item.quantity} &times; ${item.product_price.toFixed(2)}
                  </span>
                </div>
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                  ${(item.product_price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '340px', marginLeft: 'auto', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              <span>Subtotal</span>
              <span>${order.subtotal?.toFixed(2)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', fontSize: '0.9375rem' }}>
                <span>Coupon Discount ({order.coupon_code || 'Promo'})</span>
                <span>-${order.discount_amount?.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              <span>Shipping Fee</span>
              <span>{order.shipping_fee === 0 ? 'FREE' : `$${order.shipping_fee?.toFixed(2)}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-primary)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <span>Total Paid / Due</span>
              <span>${order.total_amount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Customer & Delivery Destination info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-light)' }}>
                Recipient & Contact
              </span>
              <p style={{ fontWeight: 600, marginTop: '0.25rem' }}>{order.customer_name}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{order.customer_email}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{order.customer_phone}</p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-light)' }}>
                Delivery Destination
              </span>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', marginTop: '0.25rem' }}>
                {order.shipping_address}<br />
                {order.city}, {order.postal_code}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-light)' }}>
                Payment Method & Status
              </span>
              <p style={{ fontWeight: 700, marginTop: '0.25rem', textTransform: 'uppercase', color: isOnlinePaid ? 'var(--color-success)' : 'var(--color-brand-primary)' }}>
                {order.payment_method.toUpperCase()} &bull; {order.payment_status?.toUpperCase()}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                {isOnlinePaid ? 'Payment verified via Razorpay.' : `Doorstep payment due: $${order.total_amount?.toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>

        {/* Continue Shopping button */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={onContinueShopping} className="btn btn-secondary">
            Continue Shopping <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
