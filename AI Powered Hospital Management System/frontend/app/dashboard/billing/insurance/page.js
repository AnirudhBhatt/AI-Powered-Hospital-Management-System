'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { invoiceAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function InsuranceClaimsPage() {
  const { user } = useAuth();

  // Invoices State
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter State
  const [statusFilter, setStatusFilter] = useState(''); // '', 'Pending', 'Approved', 'Rejected', 'N/A'

  // Claim Modals State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [claimForm, setClaimForm] = useState({
    provider: '',
    claimId: '',
    claimStatus: 'Pending',
    coveredAmount: 0
  });
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Fetch all invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await invoiceAPI.getAll();
      setInvoices(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Open Submit / Update Claim Modal
  const openClaimModal = (inv) => {
    setSelectedInvoice(inv);
    
    // Check if there are existing claim details
    const existingProvider = inv.insurance?.provider || inv.patientId?.insurance?.provider || '';
    const existingClaimId = inv.insurance?.claimId || '';
    const existingStatus = inv.insurance?.claimStatus && inv.insurance?.claimStatus !== 'N/A' ? inv.insurance.claimStatus : 'Pending';
    const existingCovered = inv.insurance?.coveredAmount || inv.totalAmount || 0;

    setClaimForm({
      provider: existingProvider,
      claimId: existingClaimId,
      claimStatus: existingStatus,
      coveredAmount: existingCovered
    });
    
    setError('');
    setSuccess('');
    setShowClaimModal(true);
  };

  // Submit Claim Update to Provider
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setSubmittingClaim(true);
    setError('');
    setSuccess('');
    try {
      // Body matches what is stored in invoiceSchema.insurance
      const payload = {
        provider: claimForm.provider,
        claimId: claimForm.claimId,
        claimStatus: claimForm.claimStatus,
        coveredAmount: Number(claimForm.coveredAmount)
      };

      await invoiceAPI.insuranceClaim(selectedInvoice._id, payload);
      setSuccess(`Claim details updated for Invoice ${selectedInvoice.invoiceId}!`);
      setShowClaimModal(false);
      fetchInvoices();
    } catch (err) {
      setError(err.message || 'Failed to submit claim');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Filter invoices to get only those with insurance details or associated with insured patients
  const insuranceInvoices = invoices.filter(inv => {
    const hasInvoiceClaim = inv.insurance && inv.insurance.claimStatus && inv.insurance.claimStatus !== 'N/A';
    const hasPatientInsurance = !!inv.patientId?.insurance?.provider;
    
    // Only show invoices that have some insurance context
    if (!hasInvoiceClaim && !hasPatientInsurance) return false;

    // Apply claim status filter
    if (statusFilter) {
      const currentStatus = inv.insurance?.claimStatus || 'N/A';
      return currentStatus === statusFilter;
    }
    
    return true;
  });

  // Claim Status Badge Helper
  const getClaimStatusBadge = (status) => {
    switch (status) {
      case 'Approved': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Rejected': return 'badge-danger';
      case 'N/A':
      default:
        return 'badge-secondary';
    }
  };

  return (
    <DashboardLayout title="Insurance Claims" subtitle="Track and manage insurance claim submissions and status updates">
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ Insurance Claims</h1>
          <p className="page-subtitle">Process claims and track payments from insurance providers</p>
        </div>
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

      {/* Filtering Bar */}
      <div className="filters-bar">
        <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Claim Status Filter:</label>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '200px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Insurance Invoices</option>
          <option value="Pending">Pending Claims</option>
          <option value="Approved">Approved Claims</option>
          <option value="Rejected">Rejected Claims</option>
          <option value="N/A">Not Submitted / Eligible</option>
        </select>
      </div>

      {/* Claims Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center" style={{ padding: '40px 0' }}>
            <div className="loading-spinner"></div>
          </div>
        ) : insuranceInvoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛡️</div>
            <div className="empty-state-title">No insurance invoices found</div>
            <p className="text-muted text-sm">Invoices for patients with insurance details will show up here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Patient</th>
                  <th>Insurance Provider</th>
                  <th>Policy Number</th>
                  <th>Claim ID</th>
                  <th>Claim Status</th>
                  <th>Covered Amount</th>
                  <th>Invoice Total</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {insuranceInvoices.map((inv) => {
                  const claimStatus = inv.insurance?.claimStatus || 'N/A';
                  const displayStatus = claimStatus === 'N/A' ? 'Not Submitted' : claimStatus;
                  const provider = inv.insurance?.provider || inv.patientId?.insurance?.provider || '—';
                  const policyNumber = inv.patientId?.insurance?.policyNumber || '—';
                  const claimId = inv.insurance?.claimId || '—';
                  const coveredAmount = inv.insurance?.coveredAmount || 0;
                  
                  return (
                    <tr key={inv._id}>
                      <td className="font-semibold">{inv.invoiceId}</td>
                      <td>
                        <div className="font-semibold">{inv.patientId?.name || 'Unknown Patient'}</div>
                        <div className="text-xs text-muted">Phone: {inv.patientId?.phone || '—'}</div>
                      </td>
                      <td>{provider}</td>
                      <td>{policyNumber}</td>
                      <td className="font-mono text-xs">{claimId}</td>
                      <td>
                        <span className={`badge ${getClaimStatusBadge(claimStatus)}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="font-semibold text-success">
                        ₹{coveredAmount.toFixed(2)}
                      </td>
                      <td className="font-bold">
                        ₹{inv.totalAmount.toFixed(2)}
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => openClaimModal(inv)}
                          >
                            {claimStatus === 'N/A' ? '🚀 Submit Claim' : '🔄 Update Claim'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Claim Submission and Status Update Modal */}
      {showClaimModal && selectedInvoice && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowClaimModal(false)}>
          <div className="modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedInvoice.insurance?.claimStatus === 'N/A' || !selectedInvoice.insurance?.claimStatus 
                  ? '🚀 Submit Insurance Claim' 
                  : '🔄 Update Claim Details'}
              </h3>
              <button className="modal-close" onClick={() => setShowClaimModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleClaimSubmit}>
              <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div><strong>Invoice ID:</strong> {selectedInvoice.invoiceId}</div>
                <div><strong>Patient Name:</strong> {selectedInvoice.patientId?.name}</div>
                <div><strong>Total Amount:</strong> ₹{selectedInvoice.totalAmount.toFixed(2)}</div>
                {selectedInvoice.patientId?.insurance?.policyNumber && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Patient Registered Policy: {selectedInvoice.patientId.insurance.policyNumber}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Insurance Provider *</label>
                <input
                  type="text"
                  className="form-input"
                  value={claimForm.provider}
                  onChange={(e) => setClaimForm(prev => ({ ...prev, provider: e.target.value }))}
                  required
                  placeholder="e.g. Star Health Insurance"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Claim ID / Reference *</label>
                <input
                  type="text"
                  className="form-input"
                  value={claimForm.claimId}
                  onChange={(e) => setClaimForm(prev => ({ ...prev, claimId: e.target.value }))}
                  required
                  placeholder="e.g. CLAIM-8798124"
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Claim Status</label>
                  <select
                    className="form-select"
                    value={claimForm.claimStatus}
                    onChange={(e) => setClaimForm(prev => ({ ...prev, claimStatus: e.target.value }))}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Covered Amount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    max={selectedInvoice.totalAmount}
                    min="0"
                    step="0.01"
                    value={claimForm.coveredAmount}
                    onChange={(e) => setClaimForm(prev => ({ ...prev, coveredAmount: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowClaimModal(false)}
                  disabled={submittingClaim}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingClaim}
                >
                  {submittingClaim ? 'Submitting...' : 'Save Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
