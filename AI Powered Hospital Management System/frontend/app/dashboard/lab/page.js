'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { labTestAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LabDashboardPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusModal, setStatusModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', result: '', notes: '' });
  const [updating, setUpdating] = useState(false);

  const WORKFLOW = ['Ordered', 'Sample Collected', 'Testing', 'Report Generated', 'Reviewed'];

  const getNextStatuses = (current) => {
    const idx = WORKFLOW.indexOf(current);
    if (idx === -1 || idx === WORKFLOW.length - 1) return [];
    return WORKFLOW.slice(idx + 1, idx + 2);
  };

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

  const pendingTests = tests.filter(t => !['Reviewed', 'Report Generated'].includes(t.status));
  const completedToday = tests.filter(t => {
    const today = new Date().toDateString();
    return t.status === 'Reviewed' && new Date(t.updatedAt).toDateString() === today;
  });
  const urgentTests = tests.filter(t => t.priority === 'Urgent' || t.priority === 'Emergency');
  const avgTat = tests.length
    ? Math.round(tests.reduce((acc, t) => {
        if (t.createdAt && t.updatedAt) {
          return acc + (new Date(t.updatedAt) - new Date(t.createdAt)) / 3600000;
        }
        return acc;
      }, 0) / tests.length)
    : 0;

  const stats = [
    { label: 'Pending Tests', value: pendingTests.length, icon: '🧪', color: 'rgba(99,102,241,0.15)' },
    { label: 'Completed Today', value: completedToday.length, icon: '✅', color: 'rgba(16,185,129,0.15)' },
    { label: 'Urgent Tests', value: urgentTests.length, icon: '🚨', color: 'rgba(239,68,68,0.15)' },
    { label: 'Avg TAT (hrs)', value: avgTat, icon: '⏱️', color: 'rgba(245,158,11,0.15)' },
  ];

  const getPriorityBadge = (priority) => {
    const map = {
      Normal: 'badge badge-info',
      Urgent: 'badge badge-warning',
      Emergency: 'badge badge-danger badge-emergency',
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

  const openStatusModal = (test) => {
    setSelectedTest(test);
    const nexts = getNextStatuses(test.status);
    setStatusForm({ status: nexts[0] || '', result: '', notes: '' });
    setStatusModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;
    try {
      setUpdating(true);
      await labTestAPI.updateStatus(selectedTest._id, statusForm);
      setStatusModal(false);
      fetchTests();
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const activePendingTests = tests.filter(t => ['Ordered', 'Sample Collected', 'Testing'].includes(t.status));

  return (
    <DashboardLayout>
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🧪 Lab Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.name || 'Lab Technician'} — Manage tests and reports</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="/dashboard/lab/tests" className="btn btn-secondary btn-sm">📋 All Tests</a>
            <a href="/dashboard/lab/reports" className="btn btn-primary btn-sm">📤 Upload Report</a>
          </div>
        </div>

        {error && <div className="alert-emergency"><span>⚠️</span><span>{error}</span></div>}

        {/* Stats */}
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-icon" style={{ background: s.color }}>
                {s.icon}
              </div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">⚡ Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a href="/dashboard/lab/tests" className="btn btn-secondary">📋 View All Tests</a>
            <a href="/dashboard/lab/reports" className="btn btn-primary">📤 Upload Report</a>
            <button className="btn btn-warning" onClick={fetchTests}>🔄 Refresh</button>
          </div>
        </div>

        {/* Pending / In-Progress Tests */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔬 Pending & In-Progress Tests</h3>
            <span className="badge badge-warning">{activePendingTests.length} active</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : activePendingTests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎉</div>
              <div className="empty-state-title">All tests are up to date!</div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Test ID</th>
                    <th>Patient</th>
                    <th>Test Name</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Ordered Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activePendingTests.map(test => (
                    <tr key={test._id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>
                        #{test._id?.slice(-6).toUpperCase()}
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {test.patientId?.user?.name || test.patientId?.name || 'N/A'}
                      </td>
                      <td>{test.testName}</td>
                      <td><span className={getPriorityBadge(test.priority)}>{test.priority}</span></td>
                      <td><span className={getStatusBadge(test.status)}>{test.status}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        {getNextStatuses(test.status).length > 0 && (
                          <button className="btn btn-primary btn-xs" onClick={() => openStatusModal(test)}>
                            ✏️ Update
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Urgent Tests Alert */}
        {urgentTests.length > 0 && (
          <div className="card" style={{ marginTop: '24px', borderColor: 'rgba(239,68,68,0.4)' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ color: 'var(--danger)' }}>🚨 Urgent / Emergency Tests</h3>
              <span className="badge badge-danger">{urgentTests.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {urgentTests.map(test => (
                <div key={test._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: 'rgba(239,68,68,0.08)',
                  borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)'
                }}>
                  <div>
                    <span style={{ fontWeight: '600' }}>{test.testName}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '12px', fontSize: '0.8rem' }}>
                      {test.patientId?.user?.name || 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={getPriorityBadge(test.priority)}>{test.priority}</span>
                    <span className={getStatusBadge(test.status)}>{test.status}</span>
                    {getNextStatuses(test.status).length > 0 && (
                      <button className="btn btn-danger btn-xs" onClick={() => openStatusModal(test)}>Update</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {statusModal && selectedTest && (
        <div className="modal-overlay" onClick={() => setStatusModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">✏️ Update Test Status</h3>
              <button className="modal-close" onClick={() => setStatusModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: '600' }}>{selectedTest.testName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Patient: {selectedTest.patientId?.user?.name || 'N/A'} | Current: {selectedTest.status}
              </div>
            </div>
            <form onSubmit={handleUpdateStatus}>
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select
                  className="form-select"
                  value={statusForm.status}
                  onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}
                  required
                >
                  {getNextStatuses(selectedTest.status).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {statusForm.status === 'Report Generated' && (
                <div className="form-group">
                  <label className="form-label">Result</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter test result details..."
                    value={statusForm.result}
                    onChange={e => setStatusForm(f => ({ ...f, result: e.target.value }))}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Any additional notes..."
                  value={statusForm.notes}
                  onChange={e => setStatusForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setStatusModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
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
