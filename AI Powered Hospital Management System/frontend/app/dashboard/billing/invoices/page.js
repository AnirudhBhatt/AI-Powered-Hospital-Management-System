'use client';

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { invoiceAPI, patientAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const ITEM_TYPES = ['Consultation', 'Lab Test', 'Medicine', 'Admission', 'Procedure', 'Other'];

const INITIAL_ITEM = {
  description: '',
  type: 'Consultation',
  quantity: 1,
  unitPrice: 0,
  total: 0
};

export default function InvoicesPage() {
  const { user } = useAuth();

  // Invoices and Patients State
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering State
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

  // Generate Invoice Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([ { ...INITIAL_ITEM } ]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Collect Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paidAmount, setPaidAmount] = useState(0);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Fetch all invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = statusFilter ? `status=${statusFilter}` : '';
      const res = await invoiceAPI.getAll(params);
      setInvoices(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Fetch all patients (for selection)
  const fetchPatients = async () => {
    try {
      const res = await patientAPI.getAll();
      setPatients(res.data || []);
    } catch (err) {
      console.error('Failed to load patients', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchPatients();
  }, []);

  // Listen for query parameter to open generate modal automatically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('action') === 'new') {
        openGenerateModal();
        // Clear query parameter
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Invoice calculations
  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice) || 0), 0);
  };
  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.18; // 18% GST
  const totalAmount = subtotal + tax - Number(discount);

  // Open Generate Modal
  const openGenerateModal = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setInvoiceItems([ { ...INITIAL_ITEM } ]);
    setDiscount(0);
    setNotes('');
    setError('');
    setSuccess('');
    setShowGenerateModal(true);
  };

  // Item handler
  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    
    // Auto-calculate item total
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(newItems[index].quantity) || 0;
      const u = Number(newItems[index].unitPrice) || 0;
      newItems[index].total = q * u;
    }
    
    setInvoiceItems(newItems);
  };

  const addItemRow = () => {
    setInvoiceItems([...invoiceItems, { ...INITIAL_ITEM }]);
  };

  const removeItemRow = (index) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Submit Invoice Generation
  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Please select a patient.');
      return;
    }
    if (invoiceItems.some(item => !item.description || item.unitPrice <= 0 || item.quantity <= 0)) {
      setError('Please fill in all item fields with valid quantities and prices.');
      return;
    }

    setSubmittingInvoice(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        patientId: selectedPatient._id,
        items: invoiceItems.map(item => ({
          description: item.description,
          type: item.type,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total)
        })),
        discount: Number(discount),
        notes
      };

      await invoiceAPI.create(payload);
      setSuccess('Invoice generated successfully!');
      setShowGenerateModal(false);
      fetchInvoices();
    } catch (err) {
      setError(err.message || 'Failed to generate invoice');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  // Open Pay Modal
  const openPayModal = (invoice) => {
    setSelectedInvoiceForPay(invoice);
    const remaining = invoice.totalAmount - (invoice.paidAmount || 0);
    setPaidAmount(remaining > 0 ? remaining : 0);
    setPaymentMethod('UPI');
    setError('');
    setSuccess('');
    setShowPayModal(true);
  };

  // Submit Payment Collection
  const handleCollectPayment = async (e) => {
    e.preventDefault();
    setSubmittingPayment(true);
    setError('');
    setSuccess('');
    try {
      await invoiceAPI.pay(selectedInvoiceForPay._id, {
        paymentMethod,
        paidAmount: Number(paidAmount)
      });
      setSuccess(`Payment of ₹${paidAmount} collected successfully!`);
      setShowPayModal(false);
      fetchInvoices();
    } catch (err) {
      setError(err.message || 'Failed to collect payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Expand / Collapse Row
  const toggleExpandRow = (id) => {
    setExpandedInvoiceId(prev => (prev === id ? null : id));
  };

  // Status Badge CSS helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Partial': return 'badge-info';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  // Filter patients locally as user types search query
  const filteredPatients = patients.filter(pat => {
    const name = (pat.name || '').toLowerCase();
    const pid = (pat.patientId || '').toLowerCase();
    const phone = (pat.phone || '').toLowerCase();
    const query = patientSearch.toLowerCase();
    return name.includes(query) || pid.includes(query) || phone.includes(query);
  });

  return (
    <DashboardLayout title="Invoice Management" subtitle="Create, view, and collect payments on invoices">
      <div className="page-header">
        <div>
          <h1 className="page-title">🧾 Invoices</h1>
          <p className="page-subtitle">Track hospital invoices and patient accounts</p>
        </div>
        <button className="btn btn-primary" onClick={openGenerateModal}>
          ➕ Generate Invoice
        </button>
      </div>

      {/* Alert banners */}
      {error && (
        <div className="alert-emergency">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert-emergency" style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)' }}>
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* Filter Options */}
      <div className="filters-bar">
        <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Filter by Status:</label>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Invoices</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center" style={{ padding: '40px 0' }}>
            <div className="loading-spinner"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <div className="empty-state-title">No invoices found</div>
            <p className="text-muted text-sm">Create an invoice to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Patient Name</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Status</th>
                  <th>Payment Method</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isExpanded = expandedInvoiceId === inv._id;
                  const remaining = inv.totalAmount - (inv.paidAmount || 0);
                  
                  return (
                    <React.Fragment key={inv._id}>
                      <tr>
                        <td className="font-semibold">{inv.invoiceId}</td>
                        <td>
                          <div className="font-semibold">{inv.patientId?.name || 'Unknown Patient'}</div>
                          <div className="text-xs text-muted">{inv.patientId?.patientId || 'N/A'}</div>
                        </td>
                        <td className="font-bold">₹{inv.totalAmount.toFixed(2)}</td>
                        <td className="text-success font-semibold">₹{inv.paidAmount?.toFixed(2) || '0.00'}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td>{inv.paymentMethod || '—'}</td>
                        <td>
                          {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => toggleExpandRow(inv._id)}
                            >
                              {isExpanded ? '🔼 Hide' : '🔽 Details'}
                            </button>
                            {(inv.status === 'Pending' || inv.status === 'Partial') && (
                              <button
                                className="btn btn-primary btn-xs"
                                onClick={() => openPayModal(inv)}
                              >
                                💳 Collect Pay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded row showing breakdown */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="8" style={{ background: 'rgba(99, 102, 241, 0.03)', padding: '16px 24px' }}>
                            <div className="flex flex-col gap-3">
                              <h4 className="font-bold text-sm text-primary">Itemized Breakdown</h4>
                              <div className="table-container" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                                <table style={{ background: 'transparent' }}>
                                  <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <tr>
                                      <th>Description</th>
                                      <th>Type</th>
                                      <th>Quantity</th>
                                      <th>Unit Price</th>
                                      <th style={{ textAlign: 'right' }}>Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inv.items?.map((item, idx) => (
                                      <tr key={idx}>
                                        <td>{item.description}</td>
                                        <td><span className="badge badge-secondary">{item.type}</span></td>
                                        <td>{item.quantity}</td>
                                        <td>₹{item.unitPrice.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{item.total.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                    <tr style={{ borderTop: '2px solid var(--border)' }}>
                                      <td colSpan="3"></td>
                                      <td className="font-semibold">Subtotal</td>
                                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{inv.subtotal?.toFixed(2) || '0.00'}</td>
                                    </tr>
                                    <tr>
                                      <td colSpan="3"></td>
                                      <td className="text-muted">Tax (18% GST)</td>
                                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>+₹{inv.tax?.toFixed(2) || '0.00'}</td>
                                    </tr>
                                    {inv.discount > 0 && (
                                      <tr>
                                        <td colSpan="3"></td>
                                        <td className="text-danger">Discount</td>
                                        <td style={{ textAlign: 'right', color: 'var(--danger)' }}>-₹{inv.discount?.toFixed(2)}</td>
                                      </tr>
                                    )}
                                    <tr style={{ background: 'rgba(99, 102, 241, 0.05)' }}>
                                      <td colSpan="3"></td>
                                      <td className="font-bold">Total Amount</td>
                                      <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--primary-light)' }}>₹{inv.totalAmount.toFixed(2)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              {inv.notes && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  <strong>Notes:</strong> {inv.notes}
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

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowGenerateModal(false)}>
          <div className="modal" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🧾 Generate New Invoice</h3>
              <button className="modal-close" onClick={() => setShowGenerateModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleGenerateInvoice}>
              
              {/* Patient Search and Selector */}
              <div className="form-group">
                <label className="form-label">Search Patient *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type patient name, ID, or phone..."
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    if (selectedPatient) setSelectedPatient(null);
                  }}
                />
                
                {/* Search Dropdown list */}
                {patientSearch && !selectedPatient && (
                  <div style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    marginTop: '4px',
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    {filteredPatients.length === 0 ? (
                      <div style={{ padding: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No patients found</div>
                    ) : (
                      filteredPatients.map(pat => (
                        <div
                          key={pat._id}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-light)',
                            fontSize: '0.875rem'
                          }}
                          onClick={() => {
                            setSelectedPatient(pat);
                            setPatientSearch(pat.name);
                          }}
                          className="sidebar-user" // hover styling from global.css
                        >
                          <strong>{pat.name}</strong> ({pat.patientId}) · {pat.phone}
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {selectedPatient && (
                  <div style={{ marginTop: '8px' }}>
                    <span className="badge badge-success">Selected Patient: {selectedPatient.name} ({selectedPatient.patientId})</span>
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                  <h4 className="font-semibold text-sm">Invoice Items</h4>
                  <button type="button" className="btn btn-secondary btn-xs" onClick={addItemRow}>
                    ➕ Add Item
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {invoiceItems.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="form-grid" 
                      style={{ 
                        gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.2fr auto', 
                        alignItems: 'end',
                        background: 'rgba(255,255,255,0.02)',
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label text-xs">Description</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Doctor Fee"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label text-xs">Type</label>
                        <select
                          className="form-select"
                          value={item.type}
                          onChange={(e) => handleItemChange(idx, 'type', e.target.value)}
                        >
                          {ITEM_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label text-xs">Qty</label>
                        <input
                          type="number"
                          className="form-input"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label text-xs">Unit Price</label>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label text-xs">Total</label>
                        <div className="form-input" style={{ background: 'transparent', border: 'none', paddingLeft: 0, fontWeight: 'bold' }}>
                          ₹{(item.quantity * item.unitPrice || 0).toFixed(2)}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-danger btn-xs"
                        onClick={() => removeItemRow(idx)}
                        disabled={invoiceItems.length === 1}
                        style={{ height: '38px', width: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount and Summary Area */}
              <div className="form-grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '32px', marginTop: '16px' }}>
                <div>
                  <div className="form-group">
                    <label className="form-label">Discount Amount (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      max={subtotal + tax}
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes / Remarks</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Enter specific invoice terms, medicine prescription references, etc."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Live Auto-calculated totals summary */}
                <div className="card" style={{ background: 'var(--bg-elevated)', padding: '20px' }}>
                  <h4 className="font-semibold text-sm" style={{ marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>Invoice Summary</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                    <div className="flex justify-between">
                      <span className="text-muted">Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">GST (18%):</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-danger">
                        <span>Discount:</span>
                        <span>-₹{Number(discount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold" style={{ fontSize: '1.1rem', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px', color: 'var(--primary-light)' }}>
                      <span>Total Amount:</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={submittingInvoice}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingInvoice}
                >
                  {submittingInvoice ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showPayModal && selectedInvoiceForPay && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPayModal(false)}>
          <div className="modal" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">💳 Collect Payment</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleCollectPayment}>
              <div style={{ marginBottom: '16px' }}>
                <span className="font-semibold">{selectedInvoiceForPay.invoiceId}</span>
                <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                  Patient: <span className="font-semibold">{selectedInvoiceForPay.patientId?.name}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  <div className="flex justify-between">
                    <span>Total Bill:</span>
                    <span>₹{selectedInvoiceForPay.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span>Amount Already Paid:</span>
                    <span>₹{(selectedInvoiceForPay.paidAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold" style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginTop: '4px' }}>
                    <span>Remaining Balance:</span>
                    <span>₹{(selectedInvoiceForPay.totalAmount - (selectedInvoiceForPay.paidAmount || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI">UPI</option>
                  <option value="Card">Card / Debit Card</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount Paid *</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max={selectedInvoiceForPay.totalAmount - (selectedInvoiceForPay.paidAmount || 0)}
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPayModal(false)}
                  disabled={submittingPayment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingPayment}
                >
                  {submittingPayment ? 'Processing...' : 'Collect Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
