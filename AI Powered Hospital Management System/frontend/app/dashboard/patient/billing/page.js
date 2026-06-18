'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { invoiceAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function PatientBillingPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Expandable invoice details state
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await invoiceAPI.getAll();
      setInvoices(res.data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load billing invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Paid':
        return 'badge-success';
      case 'Pending':
        return 'badge-danger';
      case 'Partial':
        return 'badge-warning';
      case 'Cancelled':
        return 'badge-secondary';
      default:
        return 'badge-primary';
    }
  };

  // Calculations for summary cards
  const totalInvoicesCount = invoices.length;
  const paidInvoicesCount = invoices.filter(inv => inv.status === 'Paid').length;
  const pendingInvoicesCount = invoices.filter(inv => ['Pending', 'Partial'].includes(inv.status)).length;

  const totalOutstandingAmount = invoices.reduce((sum, inv) => {
    if (inv.status === 'Cancelled') return sum;
    const outstanding = inv.totalAmount - (inv.paidAmount || 0);
    return sum + (outstanding > 0 ? outstanding : 0);
  }, 0);

  const totalInsuranceCovered = invoices.reduce((sum, inv) => {
    return sum + (inv.insurance?.coveredAmount || 0);
  }, 0);

  const openPaymentModal = (invoice) => {
    const outstanding = invoice.totalAmount - (invoice.paidAmount || 0);
    setSelectedInvoice(invoice);
    setPaymentAmount(outstanding.toFixed(2));
    setPaymentMethod('UPI');
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      setSubmittingPayment(true);
      setError('');
      
      const payload = {
        amount: parseFloat(paymentAmount),
        paymentMethod: paymentMethod,
      };

      await invoiceAPI.pay(selectedInvoice._id, payload);
      
      setSuccess(`Payment of ₹${paymentAmount} processed successfully!`);
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      fetchInvoices();

      // Clear success banner after 4 seconds
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Payment failure:', err);
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const toggleInvoiceExpand = (id) => {
    setExpandedInvoiceId(expandedInvoiceId === id ? null : id);
  };

  return (
    <DashboardLayout title="Billing & Invoices" subtitle="Monitor your outstanding bills, payments, and insurance claims">
      <div className="page">
        {success && (
          <div style={{
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399'
          }}>
            ✅ {success}
          </div>
        )}

        {error && (
          <div className="alert-emergency">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', marginBottom: '24px' }}>
          {/* Card 1: Total Invoices */}
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>🧾</div>
            <div>
              <div className="stat-value">{totalInvoicesCount}</div>
              <div className="stat-label">Total Invoices</div>
            </div>
          </div>

          {/* Card 2: Paid Invoices */}
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>✅</div>
            <div>
              <div className="stat-value">{paidInvoicesCount}</div>
              <div className="stat-label">Paid Invoices</div>
            </div>
          </div>

          {/* Card 3: Pending Bills */}
          <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
            <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>💰</div>
            <div>
              <div className="stat-value">₹{totalOutstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="stat-label">Pending Balance ({pendingInvoicesCount} bill{pendingInvoicesCount !== 1 ? 's' : ''})</div>
            </div>
          </div>

          {/* Card 4: Insurance Covered */}
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(14,165,233,0.15)' }}>🛡️</div>
            <div>
              <div className="stat-value">₹{totalInsuranceCovered.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="stat-label">Insurance Covered</div>
            </div>
          </div>
        </div>

        {/* Invoices List Table */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title" style={{ fontSize: '1.25rem' }}>Invoice History</h2>
          <button className="btn btn-secondary btn-sm" onClick={fetchInvoices} disabled={loading}>
            🔄 Refresh
          </button>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧾</div>
              <div className="empty-state-title">No invoices found</div>
              <p className="text-muted">You do not have any bills recorded in the system.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Date</th>
                    <th>Total Amount</th>
                    <th>Paid Amount</th>
                    <th>Outstanding</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const invoiceIdStr = invoice.invoiceId || `#${invoice._id?.slice(-6).toUpperCase()}`;
                    const outstanding = invoice.totalAmount - (invoice.paidAmount || 0);
                    const isOutstanding = outstanding > 0 && invoice.status !== 'Cancelled';
                    const formattedDate = invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : '—';

                    return (
                      <React.Fragment key={invoice._id}>
                        <tr style={{ cursor: 'pointer' }}>
                          <td
                            style={{ fontFamily: 'monospace', color: 'var(--primary-light)', fontWeight: 600 }}
                            onClick={() => toggleInvoiceExpand(invoice._id)}
                          >
                            {invoiceIdStr}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }} onClick={() => toggleInvoiceExpand(invoice._id)}>
                            {formattedDate}
                          </td>
                          <td style={{ fontWeight: 600 }} onClick={() => toggleInvoiceExpand(invoice._id)}>
                            ₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ color: 'var(--accent)' }} onClick={() => toggleInvoiceExpand(invoice._id)}>
                            ₹{(invoice.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ color: isOutstanding ? 'var(--danger)' : 'var(--text-muted)' }} onClick={() => toggleInvoiceExpand(invoice._id)}>
                            ₹{outstanding > 0 ? outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                          </td>
                          <td onClick={() => toggleInvoiceExpand(invoice._id)}>
                            <span className={`badge ${getStatusBadgeClass(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="btn btn-secondary btn-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleInvoiceExpand(invoice._id);
                                }}
                              >
                                {expandedInvoiceId === invoice._id ? '🔼 Hide' : '🔽 Expand'}
                              </button>
                              {isOutstanding && (
                                <button
                                  className="btn btn-primary btn-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPaymentModal(invoice);
                                  }}
                                >
                                  💳 Pay Now
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Cost Breakdown Row */}
                        {expandedInvoiceId === invoice._id && (
                          <tr key={`${invoice._id}-expanded`}>
                            <td colSpan="7" style={{ background: 'var(--bg-elevated)', padding: '20px 24px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Title */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                                  <strong style={{ color: 'var(--primary-light)', fontSize: '0.95rem' }}>📋 Itemized Cost Breakdown</strong>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payment Method: {invoice.paymentMethod || '—'}</span>
                                </div>

                                {/* Items Table */}
                                <div className="table-container" style={{ background: 'var(--bg-card)' }}>
                                  <table style={{ width: '100%' }}>
                                    <thead style={{ background: 'var(--bg-secondary)' }}>
                                      <tr>
                                        <th style={{ padding: '8px 12px', fontSize: '0.75rem' }}>Description</th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.75rem' }}>Type</th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.75rem', textAlign: 'center' }}>Qty</th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.75rem', textAlign: 'right' }}>Unit Price</th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.75rem', textAlign: 'right' }}>Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(invoice.items || []).map((item, index) => (
                                        <tr key={index}>
                                          <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>{item.description}</td>
                                          <td style={{ padding: '10px 12px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{item.type || 'Other'}</td>
                                          <td style={{ padding: '10px 12px', fontSize: '0.85rem', textAlign: 'center' }}>{item.quantity}</td>
                                          <td style={{ padding: '10px 12px', fontSize: '0.85rem', textAlign: 'right' }}>₹{item.unitPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                          <td style={{ padding: '10px 12px', fontSize: '0.875rem', fontWeight: 600, textAlign: 'right' }}>₹{item.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Financial Calculations */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                                      <span>₹{invoice.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>Tax (GST):</span>
                                      <span>₹{invoice.tax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {invoice.discount > 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)' }}>
                                        <span>Discount:</span>
                                        <span>-₹{invoice.discount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '8px', fontWeight: 700, fontSize: '1rem' }}>
                                      <span>Grand Total:</span>
                                      <span style={{ color: 'var(--text-primary)' }}>₹{invoice.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)' }}>
                                      <span>Amount Paid:</span>
                                      <span>₹{(invoice.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px double var(--border-light)', paddingTop: '8px', fontWeight: 700, color: isOutstanding ? 'var(--danger)' : 'var(--text-secondary)' }}>
                                      <span>Outstanding Balance:</span>
                                      <span>₹{outstanding > 0 ? outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Insurance Details section if present */}
                                {invoice.insurance && invoice.insurance.provider && (
                                  <div style={{ background: 'var(--bg-card)', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                                    <strong style={{ color: 'var(--secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>🛡️ Health Insurance Coverage</strong>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '0.8rem' }}>
                                      <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Provider:</span>
                                        <div style={{ fontWeight: 600 }}>{invoice.insurance.provider}</div>
                                      </div>
                                      <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Claim ID:</span>
                                        <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{invoice.insurance.claimId || '—'}</div>
                                      </div>
                                      <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                                        <div style={{ fontWeight: 600 }}>{invoice.insurance.claimStatus || 'Pending'}</div>
                                      </div>
                                      <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Covered Amount:</span>
                                        <div style={{ fontWeight: 600, color: 'var(--accent)' }}>₹{(invoice.insurance.coveredAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pay Now Modal */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">💳 Process Bill Payment</h3>
              <button className="modal-close" onClick={() => setIsPaymentModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Invoice ID</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-light)' }}>
                  {selectedInvoice.invoiceId || `#${selectedInvoice._id?.slice(-6).toUpperCase()}`}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, etc.)</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Cash">Cash (Counter Deposit)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Amount (INR) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount to pay"
                  max={(selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0)).toFixed(2)}
                  min="1"
                  step="0.01"
                  required
                  disabled={submittingPayment}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Prefilled with outstanding balance. Max allowed: ₹{(selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="modal-footer" style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={submittingPayment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingPayment || parseFloat(paymentAmount) <= 0 || isNaN(parseFloat(paymentAmount))}
                >
                  {submittingPayment ? '⏳ Processing...' : `✅ Confirm ₹${parseFloat(paymentAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
