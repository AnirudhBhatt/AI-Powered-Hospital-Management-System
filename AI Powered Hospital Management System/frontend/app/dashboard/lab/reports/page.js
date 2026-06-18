'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { labTestAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import FileUpload from '@/components/medical/FileUpload';

export default function LabReportsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [form, setForm] = useState({
    testId: '',
    result: '',
    reportData: '',
    notes: '',
  });

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

  const reportsGenerated = tests.filter(t => t.status === 'Report Generated' || t.status === 'Reviewed');
  const pendingReports = tests.filter(t => t.status === 'Testing' || t.status === 'Sample Collected');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.testId) {
      setError('Please select or enter a Test ID');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await labTestAPI.updateStatus(form.testId, {
        status: 'Report Generated',
        result: form.result,
        reportData: form.reportData,
        notes: form.notes,
      });

      if (selectedFile) {
        const formData = new FormData();
        formData.append('report', selectedFile);
        await labTestAPI.uploadReport(form.testId, formData);
      }

      setSuccess('Report uploaded successfully!');
      setForm({ testId: '', result: '', reportData: '', notes: '' });
      setSelectedFile(null);
      fetchTests();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
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

  return (
    <DashboardLayout>
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">📤 Upload Lab Reports</h1>
            <p className="page-subtitle">Upload test results and generate reports</p>
          </div>
          <a href="/dashboard/lab" className="btn btn-secondary btn-sm">← Back to Dashboard</a>
        </div>

        {success && (
          <div style={{
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399'
          }}>
            ✅ {success}
          </div>
        )}
        {error && <div className="alert-emergency"><span>⚠️</span><span>{error}</span></div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Upload Form */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📝 Upload Report</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Test ID / Search Test *</label>
                <select
                  className="form-select"
                  value={form.testId}
                  onChange={e => setForm(f => ({ ...f, testId: e.target.value }))}
                  required
                >
                  <option value="">— Select a pending test —</option>
                  {pendingReports.map(t => (
                    <option key={t._id} value={t._id}>
                      #{t._id?.slice(-6).toUpperCase()} — {t.testName} ({t.patientId?.user?.name || 'N/A'})
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Showing tests in Sample Collected / Testing status
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Result / Findings *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter detailed test results, findings, measurements, normal ranges..."
                  value={form.result}
                  onChange={e => setForm(f => ({ ...f, result: e.target.value }))}
                  rows={5}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Upload PDF / Image</label>
                <FileUpload onFileSelect={file => setSelectedFile(file)} />
              </div>

              <div className="form-group">
                <label className="form-label">Report External Link (Optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Or provide a URL if hosted externally (e.g. https://reports.hospital.com/report123.pdf)"
                  value={form.reportData}
                  onChange={e => setForm(f => ({ ...f, reportData: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Additional notes for the doctor or patient..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? '⏳ Uploading...' : '📤 Upload Report'}
              </button>
            </form>
          </div>

          {/* Quick Stats & Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📊 Summary</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Awaiting Reports</span>
                  <span style={{ fontWeight: '700', color: 'var(--warning)' }}>{pendingReports.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reports Generated</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{reportsGenerated.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Tests</span>
                  <span style={{ fontWeight: '700' }}>{tests.length}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ flex: '1' }}>
              <div className="card-header">
                <h3 className="card-title">📋 Awaiting Report</h3>
                <span className="badge badge-warning">{pendingReports.length}</span>
              </div>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                  <div className="loading-spinner"></div>
                </div>
              ) : pendingReports.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px' }}>
                  <div className="empty-state-icon">🎉</div>
                  <div className="empty-state-title">All reports up to date!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pendingReports.slice(0, 5).map(t => (
                    <div key={t._id} style={{
                      padding: '10px 12px', background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{t.testName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {t.patientId?.user?.name || 'N/A'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className={getStatusBadge(t.status)}>{t.status}</span>
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => setForm(f => ({ ...f, testId: t._id }))}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">📁 Recent Reports Generated</h3>
            <span className="badge badge-success">{reportsGenerated.length}</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : reportsGenerated.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <div className="empty-state-title">No reports generated yet</div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Test ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Test Name</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Result Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsGenerated.map(t => (
                    <tr key={t._id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)', fontSize: '0.8rem' }}>
                        #{t._id?.slice(-6).toUpperCase()}
                      </td>
                      <td style={{ fontWeight: '600' }}>{t.patientId?.user?.name || 'N/A'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{t.doctorId?.user?.name || 'N/A'}</td>
                      <td>{t.testName}</td>
                      <td><span className={getStatusBadge(t.status)}>{t.status}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '200px' }} className="truncate">
                        {t.result || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
