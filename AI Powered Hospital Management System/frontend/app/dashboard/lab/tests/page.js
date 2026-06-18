'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { labTestAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const WORKFLOW = ['Ordered', 'Sample Collected', 'Testing', 'Report Generated', 'Reviewed'];

const getNextStatuses = (current) => {
  const idx = WORKFLOW.indexOf(current);
  if (idx === -1 || idx === WORKFLOW.length - 1) return [];
  return WORKFLOW.slice(idx + 1, idx + 2);
};

const getPriorityBadge = (priority) => {
  const map = {
    Normal: 'badge badge-info',
    Urgent: 'badge badge-warning',
    Emergency: 'badge badge-danger',
  };
  return map[priority] || 'badge badge-secondary';
};

const getStatusBadge = (status) => {
  const map = {
    Ordered: 'badge badge-secondary',
    'Sample Collected': 'badge badge-info',
    Testing: 'badge badge-warning',
    'Report Generated': 'badge badge-primary',
    Reviewed: 'badge badge-success',
  };
  return map[status] || 'badge badge-secondary';
};

export default function LabTestsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [form, setForm] = useState({ status: '', result: '', notes: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await labTestAPI.getAll();
      setTests(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const testTypes = ['all', ...new Set(tests.map(t => t.testType).filter(Boolean))];
  const statuses = ['all', ...WORKFLOW];

  const filtered = tests.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchType = typeFilter === 'all' || t.testType === typeFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      t.testName?.toLowerCase().includes(q) ||
      t.patientId?.user?.name?.toLowerCase().includes(q) ||
      t._id?.includes(q);
    return matchStatus && matchType && matchSearch;
  });

  const openModal = (test) => {
    setSelectedTest(test);
    const nexts = getNextStatuses(test.status);
    setForm({ status: nexts[0] || '', result: '', notes: '' });
    setModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await labTestAPI.updateStatus(selectedTest._id, form);
      setModalOpen(false);
      fetchTests();
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">📋 Lab Tests Management</h1>
            <p className="page-subtitle">View and manage all lab tests with status workflow</p>
          </div>
          <a href="/dashboard/lab/reports" className="btn btn-primary btn-sm">📤 Upload Report</a>
        </div>

        {error && <div className="alert-emergency"><span>⚠️</span><span>{error}</span></div>}

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search test, patient..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {statuses.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            {testTypes.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchTests}>🔄 Refresh</button>
          <span className="badge badge-primary">{filtered.length} results</span>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No tests found</div>
              <p>Try adjusting your filters</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Test ID</th>
                    <th>Patient Name</th>
                    <th>Doctor</th>
                    <th>Test Name</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Ordered Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(test => (
                    <tr key={test._id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)', fontSize: '0.8rem' }}>
                        #{test._id?.slice(-6).toUpperCase()}
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {test.patientId?.user?.name || test.patientId?.name || 'N/A'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {test.doctorId?.user?.name || test.doctorId?.name || 'N/A'}
                      </td>
                      <td style={{ fontWeight: '500' }}>{test.testName}</td>
                      <td>
                        {test.testType && (
                          <span className="badge badge-secondary">{test.testType}</span>
                        )}
                      </td>
                      <td>
                        <span className={getPriorityBadge(test.priority)}>{test.priority || 'Normal'}</span>
                      </td>
                      <td>
                        <span className={getStatusBadge(test.status)}>{test.status}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {test.createdAt ? new Date(test.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        {getNextStatuses(test.status).length > 0 ? (
                          <button className="btn btn-primary btn-xs" onClick={() => openModal(test)}>
                            ✏️ Update
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {modalOpen && selectedTest && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">✏️ Update Test Status</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <div style={{ fontWeight: '700', marginBottom: '4px' }}>{selectedTest.testName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                <span>Patient: {selectedTest.patientId?.user?.name || 'N/A'}</span>
                <span>Current: <span style={{ color: 'var(--primary-light)' }}>{selectedTest.status}</span></span>
                <span>Priority: <span className={getPriorityBadge(selectedTest.priority)}>{selectedTest.priority}</span></span>
              </div>
            </div>

            {/* Workflow Steps */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
              {WORKFLOW.map((step, idx) => {
                const currentIdx = WORKFLOW.indexOf(selectedTest.status);
                const isDone = idx <= currentIdx;
                return (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', fontWeight: '600',
                      background: isDone ? 'var(--gradient-primary)' : 'var(--bg-elevated)',
                      color: isDone ? 'white' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}>{step}</div>
                    {idx < WORKFLOW.length - 1 && (
                      <span style={{ color: 'var(--text-muted)' }}>→</span>
                    )}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label className="form-label">New Status *</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  required
                >
                  <option value="">Select next status</option>
                  {getNextStatuses(selectedTest.status).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {form.status === 'Report Generated' && (
                <div className="form-group">
                  <label className="form-label">Test Result *</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter detailed test results here..."
                    value={form.result}
                    onChange={e => setForm(f => ({ ...f, result: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Additional notes..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updating || !form.status}>
                  {updating ? '⏳ Updating...' : '✅ Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
