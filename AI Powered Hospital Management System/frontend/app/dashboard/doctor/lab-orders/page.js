'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { labTestAPI, patientAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function DoctorLabOrdersPage() {
  const { user, profile } = useAuth();
  const [labTests, setLabTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State - Order New Test
  const [newOrderModal, setNewOrderModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Lab Order Fields
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [testType, setTestType] = useState('Blood Test');
  const [testName, setTestName] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [notes, setNotes] = useState('');

  // Modal State - View Details
  const [selectedTest, setSelectedTest] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [testsRes, patientsRes] = await Promise.all([
        labTestAPI.getAll(),
        patientAPI.getAll(),
      ]);
      setLabTests(testsRes.data || []);
      setPatients(patientsRes.data || []);
    } catch (e) {
      setError(e.message || 'Failed to fetch lab orders');
    } finally {
      setLoading(false);
    }
  };

  // Filter lab orders created by this doctor, status filter, and patient search
  const filteredTests = labTests.filter(t => {
    // Check if test was ordered by the current doctor
    const docId = t.doctorId?._id || t.doctor;
    const isDocMatch = !profile?._id || docId === profile?._id;
    if (!isDocMatch) return false;

    // Status filter
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;

    // Patient search query
    const patientName = t.patientId?.name || t.patientId?.user?.name || '';
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || patientName.toLowerCase().includes(q) || t.testName?.toLowerCase().includes(q) || t._id?.includes(q);

    return matchStatus && matchSearch;
  });

  // Filter patients inside the new lab order modal
  const filteredPatients = patients.filter(p => {
    const name = p.name || p.user?.name || '';
    return name.toLowerCase().includes(patientSearch.toLowerCase());
  });

  const getPriorityBadge = (prio) => {
    const map = {
      Normal: 'badge badge-info',
      Urgent: 'badge badge-warning',
      Emergency: 'badge badge-danger',
    };
    return map[prio] || 'badge badge-secondary';
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

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient.');
      return;
    }
    if (!testName.trim()) {
      alert('Please enter a test name.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const payload = {
        patient: selectedPatientId,
        testType,
        testName,
        priority,
        notes,
        status: 'Ordered'
      };

      await labTestAPI.create(payload);
      setSuccess('Lab test ordered successfully!');
      
      // Reset Form fields
      setSelectedPatientId('');
      setPatientSearch('');
      setTestType('Blood Test');
      setTestName('');
      setPriority('Normal');
      setNotes('');
      
      setNewOrderModal(false);
      fetchData();
    } catch (e) {
      setError(e.message || 'Failed to order lab test.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetails = (test) => {
    setSelectedTest(test);
    setDetailModalOpen(true);
  };

  return (
    <DashboardLayout title="Lab Orders" subtitle="Manage and track lab tests ordered for patients">
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🔬 Lab Orders</h1>
            <p className="page-subtitle">{filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''} found</p>
          </div>
          <div>
            <button className="btn btn-primary" onClick={() => setNewOrderModal(true)}>
              🧪 Order New Test
            </button>
          </div>
        </div>

        {error && <div className="alert-emergency"><span>⚠️</span> {error}</div>}
        {success && <div className="card" style={{ border: '1px solid var(--accent)', color: 'var(--accent)', padding: '12px 16px', marginBottom: '20px', borderRadius: 'var(--radius-md)' }}>✅ {success}</div>}

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-bar">
            <span>🔍</span>
            <input
              placeholder="Search by patient name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="form-select" 
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Ordered">Ordered</option>
            <option value="Sample Collected">Sample Collected</option>
            <option value="Testing">Testing</option>
            <option value="Report Generated">Report Generated</option>
            <option value="Reviewed">Reviewed</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>🔄 Refresh</button>
        </div>

        {/* Lab Tests Table */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔬</div>
              <div className="empty-state-title">No lab orders found</div>
              <p>Place a new lab order or clear filters to view more.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Test ID</th>
                    <th>Patient</th>
                    <th>Test Name</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Ordered Date</th>
                    <th>Result</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTests.map(test => (
                    <tr key={test._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary-light)' }}>
                        #{test._id?.slice(-8).toUpperCase()}
                      </td>
                      <td className="font-semibold">
                        {test.patientId?.name || test.patientId?.user?.name || 'N/A'}
                      </td>
                      <td className="font-semibold">{test.testName || '—'}</td>
                      <td>
                        {test.testType ? (
                          <span className="badge badge-secondary">{test.testType}</span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={getPriorityBadge(test.priority)}>{test.priority || 'Normal'}</span>
                      </td>
                      <td>
                        <span className={getStatusBadge(test.status)}>{test.status || 'Ordered'}</span>
                      </td>
                      <td>
                        {test.createdAt ? new Date(test.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="truncate" style={{ maxWidth: '150px' }}>
                        {test.result || <span className="text-muted text-xs">Awaiting Report</span>}
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-xs" onClick={() => openDetails(test)}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order New Test Modal */}
      {newOrderModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setNewOrderModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🧪 Order New Test</h3>
              <button className="modal-close" onClick={() => setNewOrderModal(false)}>✕</button>
            </div>
            <form onSubmit={handleOrderSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Patient Selector */}
                <div className="form-group">
                  <label className="form-label">Select Patient *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search patient name..."
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    style={{ marginBottom: '8px' }}
                  />
                  <select
                    className="form-select"
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {filteredPatients.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name || p.user?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid">
                  {/* Test Type */}
                  <div className="form-group">
                    <label className="form-label">Test Type *</label>
                    <select
                      className="form-select"
                      value={testType}
                      onChange={e => setTestType(e.target.value)}
                      required
                    >
                      <option value="Blood Test">Blood Test</option>
                      <option value="Urine Test">Urine Test</option>
                      <option value="X-Ray">X-Ray</option>
                      <option value="MRI Scan">MRI Scan</option>
                      <option value="CT Scan">CT Scan</option>
                      <option value="Ultrasound">Ultrasound</option>
                      <option value="ECG">ECG</option>
                      <option value="Biopsy">Biopsy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="form-group">
                    <label className="form-label">Priority *</label>
                    <select
                      className="form-select"
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                      required
                    >
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                {/* Test Name */}
                <div className="form-group">
                  <label className="form-label">Test Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Complete Blood Count (CBC), Fasting Blood Sugar"
                    value={testName}
                    onChange={e => setTestName(e.target.value)}
                    required
                  />
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">Instructions / Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter special instructions or clinical notes for lab technicians..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setNewOrderModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Ordering...' : 'Order Lab Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Test Details Modal */}
      {detailModalOpen && selectedTest && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📋 Lab Order Details</h3>
              <button className="modal-close" onClick={() => setDetailModalOpen(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ID: <strong style={{ color: 'var(--primary-light)', fontFamily: 'monospace' }}>#{selectedTest._id}</strong>
                </span>
                <span className={getStatusBadge(selectedTest.status)}>{selectedTest.status}</span>
              </div>

              <div className="grid-2">
                <div className="card" style={{ padding: '16px', background: 'var(--bg-elevated)' }}>
                  <div className="card-title" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>👤 Patient Info</div>
                  <div className="text-sm">
                    <div><strong>Name:</strong> {selectedTest.patientId?.name || selectedTest.patientId?.user?.name || 'N/A'}</div>
                    {selectedTest.patientId?.gender && <div><strong>Gender:</strong> {selectedTest.patient.gender}</div>}
                    {selectedTest.patientId?.phone && <div><strong>Phone:</strong> {selectedTest.patient.phone}</div>}
                  </div>
                </div>
                <div className="card" style={{ padding: '16px', background: 'var(--bg-elevated)' }}>
                  <div className="card-title" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>🔬 Test Specification</div>
                  <div className="text-sm">
                    <div><strong>Name:</strong> {selectedTest.testName}</div>
                    <div><strong>Type:</strong> {selectedTest.testType || 'Blood Test'}</div>
                    <div>
                      <strong>Priority: </strong>
                      <span className={getPriorityBadge(selectedTest.priority)}>{selectedTest.priority}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <strong className="text-sm">Ordered Date:</strong>
                <p className="text-sm text-muted" style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginTop: '4px' }}>
                  {selectedTest.createdAt ? new Date(selectedTest.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>

              <div>
                <strong className="text-sm">Doctor Notes / Instructions:</strong>
                <p className="text-sm text-muted" style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                  {selectedTest.notes || 'No notes specified.'}
                </p>
              </div>

              <div>
                <strong className="text-sm">Lab Results / Report:</strong>
                {selectedTest.result ? (
                  <p className="text-sm" style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {selectedTest.result}
                  </p>
                ) : (
                  <div className="empty-state" style={{ padding: '16px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <div className="empty-state-icon" style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                    <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>Awaiting Sample / Testing</div>
                    <p style={{ fontSize: '0.8rem' }}>The laboratory technician has not generated the report yet.</p>
                  </div>
                )}
              </div>

            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
