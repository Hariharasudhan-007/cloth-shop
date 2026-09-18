import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  Tag,
  Check,
  Percent,
  Lock,
  Sparkles,
  User,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { api } from '../services/api';

export function CheckoutPage({ onBack, onOrderSuccess }) {
  const { cart, cartSubtotal, shippingFee: rawShippingFee, cartTotal: rawCartTotal, clearCart } = useCart();
  const { showToast } = useToast();
  const { customer, isCustomerAuthenticated, savedAddresses } = useCustomerAuth();

  const [formData, setFormData] = useState({
    customer_name: customer?.name || '',
    customer_email: customer?.email || '',
    customer_phone: '',
    shipping_address: '',
    city: '',
    postal_code: '',
    notes: '',
    payment_method: 'cod' // 'cod' | 'razorpay'
  });

  // Online payment sub-method selection
  const [onlineMethod, setOnlineMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'wallet'

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Form submission & payment processing state
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  // Online Payment Sandbox Modal State (for interactive testing & fallback verification)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [razorpayOrderData, setRazorpayOrderData] = useState(null);
  const [processingVerification, setProcessingVerification] = useState(false);

  // Auto-fill from authenticated customer profile and default address
  useEffect(() => {
    if (isCustomerAuthenticated && customer) {
      setFormData((prev) => ({
        ...prev,
        customer_name: prev.customer_name || customer.name || '',
        customer_email: prev.customer_email || customer.email || ''
      }));

      if (savedAddresses && savedAddresses.length > 0) {
        const defaultAddr = savedAddresses.find((a) => a.is_default === 1) || savedAddresses[0];
        if (defaultAddr) {
          setFormData((prev) => ({
            ...prev,
            customer_name: prev.customer_name || defaultAddr.full_name,
            customer_phone: prev.customer_phone || defaultAddr.phone,
            shipping_address: prev.shipping_address || defaultAddr.street_address,
            city: prev.city || defaultAddr.city,
            postal_code: prev.postal_code || defaultAddr.postal_code
          }));
        }
      }
    }
  }, [isCustomerAuthenticated, customer, savedAddresses]);

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center', maxWidth: '460px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Your Bag is Empty</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Please add garments to your shopping bag before proceeding to checkout.
        </p>
        <button onClick={onBack} className="btn btn-primary">
          Return to Catalog
        </button>
      </div>
    );
  }

  // Calculate pricing with coupon discount
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const effectiveSubtotal = Math.max(0, cartSubtotal - discountAmount);
  const finalShippingFee = effectiveSubtotal >= 100 ? 0 : 10;
  const finalTotal = Math.max(0, Math.round((effectiveSubtotal + finalShippingFee) * 100) / 100);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setValidatingCoupon(true);
    try {
      const res = await api.validateCoupon(couponInput.trim(), cartSubtotal);
      if (res.valid) {
        setAppliedCoupon(res);
        showToast(`Coupon "${res.code}" applied! Saved $${res.discount_amount.toFixed(2)}`, 'success');
      } else {
        showToast(res.message || 'Invalid coupon code', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to apply coupon', 'error');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    showToast('Coupon removed.', 'info');
  };

  const handleSelectSavedAddress = (addr) => {
    setFormData((prev) => ({
      ...prev,
      customer_name: addr.full_name,
      customer_phone: addr.phone,
      shipping_address: addr.street_address,
      city: addr.city,
      postal_code: addr.postal_code
    }));
    setFieldErrors({});
    showToast('Selected saved delivery address.', 'info');
  };

  const validate = () => {
    const errs = {};
    if (!formData.customer_name.trim() || formData.customer_name.trim().length < 2) {
      errs.customer_name = 'Full name must be at least 2 characters.';
    }
    if (!formData.customer_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email.trim())) {
      errs.customer_email = 'Please provide a valid email address.';
    }
    if (!formData.customer_phone.trim() || formData.customer_phone.trim().length < 7) {
      errs.customer_phone = 'Please provide a valid contact phone number.';
    }
    if (!formData.shipping_address.trim() || formData.shipping_address.trim().length < 5) {
      errs.shipping_address = 'Please enter your complete street delivery address.';
    }
    if (!formData.city.trim()) {
      errs.city = 'City is required.';
    }
    if (!formData.postal_code.trim()) {
      errs.postal_code = 'Postal code is required.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      showToast('Please check the required fields below.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const orderPayload = {
        ...formData,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        user_id: customer ? customer.id : null,
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };

      // 1. Create order in database atomically
      const res = await api.createOrder(orderPayload);
      if (!res.success || !res.order) {
        throw new Error(res.error || 'Failed to place order.');
      }

      const createdOrder = res.order;

      // 2. If Cash on Delivery, checkout is complete!
      if (formData.payment_method === 'cod') {
        clearCart();
        showToast('Order placed successfully with Cash on Delivery!', 'success');
        onOrderSuccess(createdOrder);
        return;
      }

      // 3. If Online Payment (Razorpay), initiate gateway transaction
      const rzpRes = await api.createRazorpayOrder({
        orderId: createdOrder.id,
        orderNumber: createdOrder.order_number
      });

      if (!rzpRes.success) {
        throw new Error(rzpRes.error || 'Failed to initialize payment gateway.');
      }

      setPendingOrder(createdOrder);
      setRazorpayOrderData(rzpRes);
      setShowPaymentModal(true);
    } catch (err) {
      console.error('Checkout error:', err);
      setGeneralError(err.message || 'An error occurred while creating your order.');
      showToast(err.message || 'Failed to place order.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Process payment confirmation from gateway modal
  const handleCompleteGatewayPayment = async (simulatedPaymentId = null) => {
    if (!pendingOrder || !razorpayOrderData) return;

    setProcessingVerification(true);
    try {
      const paymentId = simulatedPaymentId || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // Calculate valid signature for sandbox verification
      // (In real mode with Razorpay checkout script, this is provided by the gateway popup)
      // HMAC SHA256 of razorpayOrderId + "|" + paymentId using test secret
      const payloadToSign = `${razorpayOrderData.razorpayOrderId}|${paymentId}`;
      let signature = '';
      if (window.crypto && window.crypto.subtle) {
        const enc = new TextEncoder();
        const key = await window.crypto.subtle.importKey(
          'raw',
          enc.encode('rzp_secret_local_test'),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const sigBuf = await window.crypto.subtle.sign('HMAC', key, enc.encode(payloadToSign));
        signature = Array.from(new Uint8Array(sigBuf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }

      const verificationPayload = {
        orderNumber: pendingOrder.order_number,
        razorpayOrderId: razorpayOrderData.razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature
      };

      const verifyRes = await api.verifyRazorpayPayment(verificationPayload);

      if (verifyRes.success) {
        clearCart();
        setShowPaymentModal(false);
        showToast('Online payment verified successfully!', 'success');
        onOrderSuccess({
          ...pendingOrder,
          payment_status: 'paid',
          order_status: 'processing'
        });
      } else {
        throw new Error(verifyRes.error || 'Payment signature verification failed.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      showToast(err.message || 'Payment verification failed.', 'error');
      // Record failed payment
      try {
        await api.failRazorpayPayment({
          orderNumber: pendingOrder.order_number,
          razorpayOrderId: razorpayOrderData.razorpayOrderId,
          reason: err.message
        });
      } catch (e) {}
    } finally {
      setProcessingVerification(false);
    }
  };

  const handleCancelPayment = async () => {
    if (pendingOrder && razorpayOrderData) {
      try {
        await api.failRazorpayPayment({
          orderNumber: pendingOrder.order_number,
          razorpayOrderId: razorpayOrderData.razorpayOrderId,
          reason: 'Customer cancelled transaction before completion'
        });
      } catch (e) {}
    }
    setShowPaymentModal(false);
    showToast('Payment cancelled. Your order remains pending.', 'info');
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="checkout-page" style={{ padding: '3rem 0 6rem' }}>
      <div className="container">
        {/* Navigation back */}
        <button
          onClick={onBack}
          className="btn btn-sm"
          style={{ color: 'var(--color-text-muted)', padding: '0.4rem 0', marginBottom: '2rem' }}
        >
          <ArrowLeft size={16} /> Return to Wardrobe Catalog
        </button>

        <div style={{ marginBottom: '2.5rem' }}>
          <span className="editorial-tag" style={{ marginBottom: '0.5rem' }}>
            <Lock size={12} /> SECURE ATELIER CHECKOUT // FULFILLMENT
          </span>
          <h1 className="heading-title" style={{ marginTop: '0.25rem' }}>
            Delivery & Payment
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Choose between doorstep Cash on Delivery or instant Indian online payment (UPI, Cards, Net Banking, Wallets).
          </p>
        </div>

        {generalError && (
          <div className="tracking-error-box" style={{ marginBottom: '2rem' }}>
            <AlertCircle size={20} />
            <span>{generalError}</span>
          </div>
        )}

        <div className="checkout-grid">
          {/* Left: Multi-Step Forms */}
          <div>
            <form onSubmit={handleSubmit}>
              {/* Step 1: Customer Contact Information */}
              <div className="checkout-section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 className="checkout-step-title">
                    1. Contact Information
                  </h3>
                  {isCustomerAuthenticated ? (
                    <span className="badge badge-in-stock">Logged in as {customer.name}</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Guest Checkout Enabled</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="customer_name">Full Name *</label>
                  <input
                    id="customer_name"
                    type="text"
                    placeholder="e.g. Eleanor Vance"
                    value={formData.customer_name}
                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                    className={`form-input ${fieldErrors.customer_name ? 'is-invalid' : ''}`}
                    disabled={submitting}
                  />
                  {fieldErrors.customer_name && <span className="form-error-msg">{fieldErrors.customer_name}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="customer_email">Email Address *</label>
                    <input
                      id="customer_email"
                      type="email"
                      placeholder="e.g. eleanor@example.com"
                      value={formData.customer_email}
                      onChange={(e) => handleInputChange('customer_email', e.target.value)}
                      className={`form-input ${fieldErrors.customer_email ? 'is-invalid' : ''}`}
                      disabled={submitting}
                    />
                    {fieldErrors.customer_email && <span className="form-error-msg">{fieldErrors.customer_email}</span>}
                    <span className="form-hint">Order confirmation & tracking dispatched here</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="customer_phone">Phone Number *</label>
                    <input
                      id="customer_phone"
                      type="tel"
                      placeholder="e.g. +91 98765 43210 / +1 555 019"
                      value={formData.customer_phone}
                      onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                      className={`form-input ${fieldErrors.customer_phone ? 'is-invalid' : ''}`}
                      disabled={submitting}
                    />
                    {fieldErrors.customer_phone && <span className="form-error-msg">{fieldErrors.customer_phone}</span>}
                    <span className="form-hint">For courier SMS updates & doorstep delivery</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Delivery Address */}
              <div className="checkout-section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 className="checkout-step-title">
                    2. Delivery Address
                  </h3>
                </div>

                {/* Saved Address Quick-Select if customer has addresses */}
                {isCustomerAuthenticated && savedAddresses && savedAddresses.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                      USE SAVED ADDRESS:
                    </span>
                    <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleSelectSavedAddress(addr)}
                          className="saved-addr-chip"
                        >
                          <strong>{addr.full_name}</strong>
                          <span>{addr.street_address}, {addr.city}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="shipping_address">Street Address *</label>
                  <input
                    id="shipping_address"
                    type="text"
                    placeholder="Apartment, suite, unit, building, street"
                    value={formData.shipping_address}
                    onChange={(e) => handleInputChange('shipping_address', e.target.value)}
                    className={`form-input ${fieldErrors.shipping_address ? 'is-invalid' : ''}`}
                    disabled={submitting}
                  />
                  {fieldErrors.shipping_address && <span className="form-error-msg">{fieldErrors.shipping_address}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="city">City / District *</label>
                    <input
                      id="city"
                      type="text"
                      placeholder="e.g. Mumbai, New York, London"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`form-input ${fieldErrors.city ? 'is-invalid' : ''}`}
                      disabled={submitting}
                    />
                    {fieldErrors.city && <span className="form-error-msg">{fieldErrors.city}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="postal_code">Postal Code / PIN *</label>
                    <input
                      id="postal_code"
                      type="text"
                      placeholder="e.g. 400001 or 10001"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      className={`form-input ${fieldErrors.postal_code ? 'is-invalid' : ''}`}
                      disabled={submitting}
                    />
                    {fieldErrors.postal_code && <span className="form-error-msg">{fieldErrors.postal_code}</span>}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="notes">Courier Delivery Notes (Optional)</label>
                  <textarea
                    id="notes"
                    rows="2"
                    placeholder="e.g. Leave with building doorman or gate code #204"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="form-textarea"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Step 3: Payment Method Selection */}
              <div className="checkout-section-card">
                <h3 className="checkout-step-title">
                  3. Select Payment Method
                </h3>

                <div className="payment-options-group">
                  {/* Option A: Cash on Delivery (COD) */}
                  <label className={`payment-option-card ${formData.payment_method === 'cod' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={formData.payment_method === 'cod'}
                      onChange={() => setFormData({ ...formData, payment_method: 'cod' })}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.0625rem' }}>
                          Cash on Delivery (COD)
                          <span className="badge badge-in-stock" style={{ fontSize: '0.6875rem' }}>Zero Risk</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', lineHeight: '1.5' }}>
                        Inspect your garments right at your doorstep before completing payment. Pay in cash or scan the courier's QR code.
                      </p>
                    </div>
                  </label>

                  {/* Option B: Online Payment (Razorpay) */}
                  <label className={`payment-option-card ${formData.payment_method === 'razorpay' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="razorpay"
                      checked={formData.payment_method === 'razorpay'}
                      onChange={() => setFormData({ ...formData, payment_method: 'razorpay' })}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.0625rem' }}>
                          Online Payment (UPI, Cards, Net Banking)
                          <span className="stamp-badge" style={{ fontSize: '0.6875rem' }}>INSTANT DISPATCH</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', lineHeight: '1.5' }}>
                        Secured by Razorpay. Supports UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, Net Banking, and Wallets.
                      </p>

                      {/* Sub-method pills if online selected */}
                      {formData.payment_method === 'razorpay' && (
                        <div className="online-method-pills">
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setOnlineMethod('upi'); }}
                            className={`online-method-pill ${onlineMethod === 'upi' ? 'active' : ''}`}
                          >
                            <QrCode size={15} /> Instant UPI / QR
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setOnlineMethod('card'); }}
                            className={`online-method-pill ${onlineMethod === 'card' ? 'active' : ''}`}
                          >
                            <CreditCard size={15} /> Credit / Debit Card
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setOnlineMethod('netbanking'); }}
                            className={`online-method-pill ${onlineMethod === 'netbanking' ? 'active' : ''}`}
                          >
                            <Building2 size={15} /> Net Banking
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setOnlineMethod('wallet'); }}
                            className={`online-method-pill ${onlineMethod === 'wallet' ? 'active' : ''}`}
                          >
                            <Wallet size={15} /> Wallets
                          </button>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Order Button */}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-full"
                style={{ padding: '1rem 2rem', fontSize: '1.125rem', fontWeight: 700 }}
                id="place-order-submit-btn"
              >
                {submitting ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div className="spinner spinner-light" />
                    <span>Processing Atelier Order...</span>
                  </div>
                ) : formData.payment_method === 'cod' ? (
                  <span>Place Order with Cash on Delivery (${finalTotal.toFixed(2)})</span>
                ) : (
                  <span>Proceed to Online Payment (${finalTotal.toFixed(2)})</span>
                )}
              </button>
            </form>
          </div>

          {/* Right: Order Summary & Coupon Deduction */}
          <div>
            <div className="checkout-summary-card">
              <h3 className="checkout-step-title" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
                Order Summary ({cart.length} piece{cart.length === 1 ? '' : 's'})
              </h3>

              {/* Items List */}
              <div className="checkout-items-list">
                {cart.map((item) => (
                  <div key={item.product_id} className="checkout-item-row">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="checkout-item-thumb"
                    />
                    <div style={{ flex: 1 }}>
                      <h4 className="checkout-item-title">{item.name}</h4>
                      <span className="checkout-item-sub">
                        Qty: {item.quantity} &times; ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <span className="checkout-item-price">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Code Section */}
              <div className="checkout-coupon-section">
                {appliedCoupon ? (
                  <div className="applied-coupon-pill">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Tag size={16} color="var(--color-success)" />
                      <div>
                        <strong>{appliedCoupon.code}</strong>
                        <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--color-success)' }}>
                          {appliedCoupon.discount_percent}% discount applied (-${appliedCoupon.discount_amount.toFixed(2)})
                        </span>
                      </div>
                    </div>
                    <button onClick={handleRemoveCoupon} className="icon-btn" title="Remove coupon">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="coupon-input-form">
                    <input
                      type="text"
                      placeholder="Promotional code (e.g. ATELIER15)..."
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="form-input"
                      style={{ textTransform: 'uppercase', fontSize: '0.875rem' }}
                    />
                    <button
                      type="submit"
                      disabled={validatingCoupon || !couponInput.trim()}
                      className="btn btn-secondary btn-sm"
                    >
                      {validatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </form>
                )}
              </div>

              {/* Pricing breakdown */}
              <div className="checkout-pricing-breakdown">
                <div className="pricing-line">
                  <span>Item Subtotal</span>
                  <span>${cartSubtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="pricing-line discount-line">
                    <span>Promotional Discount ({appliedCoupon?.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pricing-line">
                  <span>Standard Shipping</span>
                  <span>
                    {finalShippingFee === 0 ? (
                      <strong style={{ color: 'var(--color-success)' }}>FREE</strong>
                    ) : (
                      `$${finalShippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="pricing-total-line">
                  <span>Total Due</span>
                  <span id="checkout-grand-total">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Reassurance */}
              <div className="checkout-trust-badge">
                <ShieldCheck size={18} color="var(--color-success)" />
                <span>256-bit encrypted checkout. Never stores raw card credentials.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Online Payment Gateway Simulation Modal (Razorpay Architecture) */}
      {showPaymentModal && pendingOrder && razorpayOrderData && (
        <div className="payment-gateway-modal-backdrop">
          <div className="payment-gateway-modal">
            <div className="gateway-modal-header">
              <div>
                <span className="gateway-badge">RAZORPAY SECURE GATEWAY</span>
                <h3>Complete Online Payment</h3>
                <p>Order: <strong>{pendingOrder.order_number}</strong> • Amount: <strong>${finalTotal.toFixed(2)}</strong></p>
              </div>
              <button onClick={handleCancelPayment} className="icon-btn">
                <X size={20} />
              </button>
            </div>

            <div className="gateway-modal-body">
              {onlineMethod === 'upi' && (
                <div className="gateway-method-view">
                  <QrCode size={120} style={{ margin: '0 auto 1rem', color: 'var(--color-brand-primary)' }} />
                  <h4>Scan to Pay via UPI</h4>
                  <p>Open Google Pay, PhonePe, Paytm or any UPI app to scan and authorize payment.</p>
                  <div className="gateway-upi-id">
                    <code>atelier@threadandloom</code>
                  </div>
                </div>
              )}

              {onlineMethod === 'card' && (
                <div className="gateway-method-view">
                  <CreditCard size={48} style={{ margin: '0 auto 0.75rem', color: 'var(--color-brand-accent)' }} />
                  <h4>Test Card Authorization</h4>
                  <p>Encrypted test transaction tokenized on the server.</p>
                  <div style={{ backgroundColor: 'var(--color-surface-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', textAlign: 'left', marginTop: '1rem' }}>
                    <div><strong>Card Number:</strong> •••• •••• •••• 4242</div>
                    <div><strong>Expiry:</strong> 12/28 • <strong>CVV:</strong> •••</div>
                  </div>
                </div>
              )}

              {onlineMethod === 'netbanking' && (
                <div className="gateway-method-view">
                  <Building2 size={48} style={{ margin: '0 auto 0.75rem', color: 'var(--color-brand-accent)' }} />
                  <h4>Net Banking Gateway</h4>
                  <p>Choose your bank to proceed with direct verification.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                    <div className="bank-pill">HDFC Bank</div>
                    <div className="bank-pill">ICICI Bank</div>
                    <div className="bank-pill">State Bank of India</div>
                    <div className="bank-pill">Axis Bank</div>
                  </div>
                </div>
              )}

              {onlineMethod === 'wallet' && (
                <div className="gateway-method-view">
                  <Wallet size={48} style={{ margin: '0 auto 0.75rem', color: 'var(--color-brand-accent)' }} />
                  <h4>Authorized Digital Wallets</h4>
                  <p>Pay instantly using PhonePe, Paytm, or Amazon Pay balance.</p>
                </div>
              )}
            </div>

            <div className="gateway-modal-footer">
              <button
                onClick={() => handleCompleteGatewayPayment()}
                disabled={processingVerification}
                className="btn btn-primary btn-full"
                style={{ fontWeight: 700, padding: '0.85rem' }}
              >
                {processingVerification ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div className="spinner spinner-light" />
                    <span>Verifying Cryptographic Signature...</span>
                  </div>
                ) : (
                  <span>Authorize & Pay ${finalTotal.toFixed(2)}</span>
                )}
              </button>

              <button
                onClick={handleCancelPayment}
                disabled={processingVerification}
                className="btn btn-secondary btn-full btn-sm"
                style={{ marginTop: '0.5rem' }}
              >
                Cancel Payment Attempt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
