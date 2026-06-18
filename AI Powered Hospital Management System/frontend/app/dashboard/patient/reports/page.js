'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { medicalRecordAPI, labTestAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function PatientReportsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [loadingLabTests, setLoadingLabTests] = useState(true);
  const [errorRecords, setErrorRecords] = useState('');
  const [errorLabTests, setErrorLabTests] = useState('');

  // Modal State for Medical Records
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Modal State for Lab Results
  const [selectedLabTest, setSelectedLabTest] = useState(null);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);

  useEffect(() => {
    fetchRecords();
    fetchLabTests();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoadingRecords(true);
      setErrorRecords('');
      const res = await medicalRecordAPI.getAll();
      setRecords(res.data || []);
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setErrorRecords('Failed to load medical records.');
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchLabTests = async () => {
    try {
      setLoadingLabTests(true);
      setErrorLabTests('');
      const res = await labTestAPI.getAll();
      setLabTests(res.data || []);
    } catch (err) {
      console.error('Error fetching lab tests:', err);
      setErrorLabTests('Failed to load lab tests.');
    } finally {
      setLoadingLabTests(false);
    }
  };

  // Get icons based on record type
  const getRecordIcon = (type) => {
    switch (type) {
      case 'Prescription':
        return '💊';
      case 'Lab Report':
        return '🧪';
      case 'X-Ray':
      case 'MRI Report':
      case 'CT Scan':
        return '🩻';
      case 'Discharge Summary':
        return '🏥';
      default:
        return '📁';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Normal':
        return 'badge-info';
      case 'Urgent':
        return 'badge-warning';
      case 'Emergency':
        return 'badge-danger badge-emergency';
      default:
        return 'badge-secondary';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Ordered':
        return 'badge-secondary';
      case 'Sample Collected':
        return 'badge-info';
      case 'Testing':
        return 'badge-warning';
      case 'Report Generated':
        return 'badge-primary';
      case 'Reviewed':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  };

  const openRecordModal = (record) => {
    setSelectedRecord(record);
    setIsRecordModalOpen(true);
  };

  const openLabModal = (test) => {
    setSelectedLabTest(test);
    setIsLabModalOpen(true);
  };

  return (
    <DashboardLayout title="Medical Records & Lab Results" subtitle="View and track your clinical history, reports, and lab outcomes">
      <div className="page">
        {/* Medical Records Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title" style={{ fontSize: '1.25rem' }}>🗄️ Clinical Records & Documents</h2>
            <button className="btn btn-secondary btn-sm" onClick={fetchRecords} disabled={loadingRecords}>
              🔄 Refresh Records
            </button>
          </div>

          {errorRecords && (
            <div className="alert-emergency">
              <span>⚠️</span>
              <span>{errorRecords}</span>
            </div>
          )}

          {loadingRecords ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="card mb-4">
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-state-icon">📁</div>
                <div className="empty-state-title">No records available</div>
                <p className="text-muted">No clinical documents have been uploaded yet.</p>
              </div>
            </div>
          ) : (
            <div className="grid-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {records.map((record) => {
                const dateStr = record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }) : '—';

                return (
                  <div key={record._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                    <div className="flex gap-3 items-center">
                      <div style={{ fontSize: '2rem', padding: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                        {getRecordIcon(record.type)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="truncate" style={{ fontSize: '1rem', color: 'var(--text-primary)' }} title={record.title}>
                          {record.title}
                        </h3>
                        <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                          Type: {record.type} · Issued: {dateStr}
                        </div>
                      </div>
                    </div>
                    {record.category && (
                      <div style={{ fontSize: '0.85rem' }}>
                        <span className="text-muted">Category:</span> <span style={{ color: 'var(--primary-light)' }}>{record.category}</span>
                      </div>
                    )}
                    <button className="btn btn-secondary w-full btn-sm" onClick={() => openRecordModal(record)}>
                      👁️ View Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '32px 0' }} />

        {/* Lab Test Results Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title" style={{ fontSize: '1.25rem' }}>🔬 Lab Test Results</h2>
            <button className="btn btn-secondary btn-sm" onClick={fetchLabTests} disabled={loadingLabTests}>
              🔄 Refresh Lab Tests
            </button>
          </div>

          {errorLabTests && (
            <div className="alert-emergency">
              <span>⚠️</span>
              <span>{errorLabTests}</span>
            </div>
          )}

          {loadingLabTests ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : labTests.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-state-icon">🔬</div>
                <div className="empty-state-title">No lab tests found</div>
                <p className="text-muted">You do not have any lab tests ordered or completed.</p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Test ID</th>
                      <th>Test Name</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date Ordered</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labTests.map((test) => {
                      const testId = test.testId || (test._id ? `#${test._id.slice(-6).toUpperCase()}` : '—');
                      const hasResult = ['Report Generated', 'Reviewed'].includes(test.status);
                      const dateStr = test.createdAt ? new Date(test.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : '—';

                      return (
                        <tr key={test._id}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)', fontSize: '0.85rem' }}>
                            {testId}
                          </td>
                          <td style={{ fontWeight: 600 }}>{test.testName}</td>
                          <td>{test.testType || 'General'}</td>
                          <td>
                            <span className={`badge ${getPriorityBadgeClass(test.priority)}`}>
                              {test.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(test.status)}`}>
                              {test.status}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{dateStr}</td>
                          <td>
                            {hasResult ? (
                              <button className="btn btn-primary btn-xs" onClick={() => openLabModal(test)}>
                                🔬 View Result
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                Processing...
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Medical Record Details Modal */}
      {isRecordModalOpen && selectedRecord && (
        <div className="modal-overlay" onClick={() => setIsRecordModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📄 Record Details</h3>
              <button className="modal-close" onClick={() => setIsRecordModalOpen(false)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {selectedRecord.title}
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span className="badge badge-primary">{selectedRecord.type}</span>
                  {selectedRecord.category && <span className="badge badge-info">{selectedRecord.category}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded By</span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {selectedRecord.uploadedBy?.name || selectedRecord.uploadedBy?.user?.name || 'Medical Staff'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Associated Doctor</span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {selectedRecord.doctorId?.name || selectedRecord.doctorId?.user?.name || 'Dr. ' + (selectedRecord.doctorId?.name || 'N/A')}
                  </div>
                </div>
              </div>

              {selectedRecord.tags && selectedRecord.tags.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Tags
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedRecord.tags.map((tag, i) => (
                      <span key={i} className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Description / Details
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  padding: '12px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedRecord.fileData || 'No record description provided.'}
                </div>
              </div>

              {selectedRecord.fileUrl && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                  <a
                    href={selectedRecord.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary w-full"
                    style={{ justifyContent: 'center' }}
                  >
                    📥 Open Attached Document
                  </a>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsRecordModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Result Details Modal */}
      {isLabModalOpen && selectedLabTest && (
        <div className="modal-overlay" onClick={() => setIsLabModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔬 Lab Report Results</h3>
              <button className="modal-close" onClick={() => setIsLabModalOpen(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {selectedLabTest.testName}
                </h4>
                <div className="text-xs text-muted">
                  Test ID: {selectedLabTest.testId || selectedLabTest._id}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</span>
                  <div>
                    <span className={`badge ${getStatusBadgeClass(selectedLabTest.status)}`} style={{ marginTop: '4px' }}>
                      {selectedLabTest.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ordering Doctor</span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '4px' }}>
                    Dr. {selectedLabTest.doctorId?.name || selectedLabTest.doctorId?.user?.name || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Test Results & Findings
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  lineHeight: '1.6',
                  padding: '16px',
                  background: 'rgba(16,185,129,0.06)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedLabTest.result || 'No results entered yet.'}
                </div>
              </div>

              {selectedLabTest.notes && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Notes
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {selectedLabTest.notes}
                  </p>
                </div>
              )}

              {selectedLabTest.reportData && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                  {selectedLabTest.reportData.startsWith('http') ? (
                    <a
                      href={selectedLabTest.reportData}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary w-full"
                      style={{ justifyContent: 'center' }}
                    >
                      🔗 Open Digital Report Link
                    </a>
                  ) : (
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Report Data / Ref</span>
                      <p style={{ fontSize: '0.85rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {selectedLabTest.reportData}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsLabModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
