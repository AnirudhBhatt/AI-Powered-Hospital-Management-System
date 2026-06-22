'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { prescriptionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [dispensing, setDispensing] = useState(false);

  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await prescriptionAPI.getAll();
      setPrescriptions(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = prescriptions.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      p.patientId?.name?.toLowerCase().includes(q) ||
      p.doctorId?.name?.toLowerCase().includes(q) ||
      p._id?.includes(q) ||
      p.diagnosis?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleDispense = (id) => {
    setSelectedId(id);
    setConfirmModal(true);
  };

  const confirmDispense = async () => {
    try {
      setDispensing(true);
      await prescriptionAPI.dispense(selectedId);
      setConfirmModal(false);
      fetchPrescriptions();
    } catch (e) {
      alert(e.message);
    } finally {
      setDispensing(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      Active: 'badge badge-warning',
      Dispensed: 'badge badge-success',
      Cancelled: 'badge badge-danger',
      Expired: 'badge badge-secondary',
    };
    return map[status] || 'badge badge-secondary';
  };

  return (
    <DashboardLayout>
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">💊 Prescription Fulfillment</h1>
            <p className="page-subtitle">View and dispense active prescriptions</p>
          </div>
          <a href="/dashboard/pharmacist" className="btn btn-secondary btn-sm">← Dashboard</a>
        </div>

        {error && <div className="alert-emergency"><span>⚠️</span><span>{error}</span></div>}

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search patient, doctor, diagnosis..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {['all', 'Active', 'Dispensed'].map(s => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={fetchPrescriptions}>🔄 Refresh</button>
          <span className="badge badge-primary">{filtered.length} results</span>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💊</div>
              <div className="empty-state-title">No prescriptions found</div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Prescription ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Diagnosis</th>
                    <th>Medicines</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <>
                      <tr key={p._id} style={{ cursor: 'pointer' }}>
                        <td
                          style={{ fontFamily: 'monospace', color: 'var(--primary-light)', fontSize: '0.8rem' }}
                          onClick={() => setExpandedRow(expandedRow === p._id ? null : p._id)}
                        >
                          #{p._id?.slice(-6).toUpperCase()}
                        </td>
                        <td
                          style={{ fontWeight: '600' }}
                          onClick={() => setExpandedRow(expandedRow === p._id ? null : p._id)}
                        >
                          {p.patientId?.name || 'N/A'}
                        </td>
                        <td
                          style={{ color: 'var(--text-secondary)' }}
                          onClick={() => setExpandedRow(expandedRow === p._id ? null : p._id)}
                        >
                          Dr. {p.doctorId?.name || 'N/A'}
                        </td>
                        <td
                          style={{ color: 'var(--text-secondary)', maxWidth: '150px' }}
                          className="truncate"
                          onClick={() => setExpandedRow(expandedRow === p._id ? null : p._id)}
                        >
                          {p.diagnosis || '—'}
                        </td>
                        <td onClick={() => setExpandedRow(expandedRow === p._id ? null : p._id)}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(p.medicines || []).slice(0, 3).map((m, i) => (
                              <span key={i} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                {m.medicine?.name || m.name || 'Med'}
                              </span>
                            ))}
                            {(p.medicines || []).length > 3 && (
                              <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                                +{p.medicines.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
                          onClick={() => setExpandedRow(expandedRow === p._id ? null : p._id)}
                        >
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td onClick={() => setExpandedRow(expandedRow === p._id ? null : p._id)}>
                          <span className={getStatusBadge(p.status)}>{p.status}</span>
                        </td>
                        <td>
                          {p.status === 'Active' ? (
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => handleDispense(p._id)}
                            >
                              💊 Dispense
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedRow === p._id && (
                        <tr key={`${p._id}-expanded`}>
                          <td colSpan="8" style={{ background: 'var(--bg-elevated)', padding: '16px 20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div>
                                <div style={{ fontWeight: '700', marginBottom: '10px', color: 'var(--primary-light)' }}>
                                  📋 Prescription Details
                                </div>
                                <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <div><span style={{ color: 'var(--text-muted)' }}>Patient:</span> <strong>{p.patientId?.name || 'N/A'}</strong></div>
                                  <div><span style={{ color: 'var(--text-muted)' }}>Doctor:</span> <strong>Dr. {p.doctorId?.name || 'N/A'}</strong></div>
                                  <div><span style={{ color: 'var(--text-muted)' }}>Diagnosis:</span> {p.diagnosis || '—'}</div>
                                  <div><span style={{ color: 'var(--text-muted)' }}>Instructions:</span> {p.instructions || '—'}</div>
                                  <div><span style={{ color: 'var(--text-muted)' }}>Date:</span> {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—'}</div>
                                </div>
                              </div>
                              <div>
                                <div style={{ fontWeight: '700', marginBottom: '10px', color: 'var(--primary-light)' }}>
                                  💊 Medicines
                                </div>
                                {(p.medicines || []).map((m, i) => (
                                  <div key={i} style={{
                                    padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                                    marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                  }}>
                                    <div>
                                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                        {m.medicine?.name || m.name || 'Unknown'}
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {m.dosage} · {m.frequency} · {m.duration}
                                      </div>
                                    </div>
                                    <span className="badge badge-info">{m.medicine?.category || 'Medicine'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dispense Modal */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">💊 Confirm Dispensing</h3>
              <button className="modal-close" onClick={() => setConfirmModal(false)}>✕</button>
            </div>
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💊</div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to dispense this prescription? This action cannot be undone.
              </p>
              <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Prescription ID: <strong style={{ color: 'var(--primary-light)' }}>#{selectedId?.slice(-6).toUpperCase()}</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={confirmDispense} disabled={dispensing}>
                {dispensing ? '⏳ Dispensing...' : '✅ Confirm Dispense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
