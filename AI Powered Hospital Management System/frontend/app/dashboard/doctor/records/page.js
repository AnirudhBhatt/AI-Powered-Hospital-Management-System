'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { medicalRecordAPI, patientAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import FileUpload from '@/components/medical/FileUpload';

export default function DoctorMedicalRecordsPage() {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal State - Upload Record
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState('Prescription');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Modal State - View Record Description
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [descModalOpen, setDescModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [recordsRes, patientsRes] = await Promise.all([
        medicalRecordAPI.getAll(),
        patientAPI.getAll(),
      ]);
      setRecords(recordsRes.data || []);
      setPatients(patientsRes.data || []);
    } catch (e) {
      setError(e.message || 'Failed to fetch medical records');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search medical records
  const filteredRecords = records.filter(r => {
    // Type Filter
    const matchType = typeFilter === 'all' || r.type === typeFilter;

    // Patient Name Search
    const patientName = r.patientId?.name || r.patientId?.user?.name || '';
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || patientName.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q) || r._id?.includes(q);

    return matchType && matchSearch;
  });

  // Filter patients inside Upload Record modal
  const filteredPatients = patients.filter(p => {
    const name = p.name || p.user?.name || '';
    return name.toLowerCase().includes(patientSearch.toLowerCase());
  });

  const getRecordTypeBadge = (type) => {
    const map = {
      Prescription: 'badge badge-primary',
      'Lab Report': 'badge badge-info',
      'X-Ray': 'badge badge-warning',
      'MRI Report': 'badge badge-danger',
      'CT Scan': 'badge badge-secondary',
      Other: 'badge badge-secondary',
    };
    return map[type] || 'badge badge-secondary';
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient.');
      return;
    }
    if (!title.trim()) {
      alert('Please enter a title.');
      return;
    }
    if (!selectedFile) {
      alert('Please upload a file.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('patientId', selectedPatientId);
      formData.append('title', title);
      formData.append('type', recordType);
      formData.append('description', description);
      if (selectedFile) formData.append('file', selectedFile);

      await medicalRecordAPI.upload(formData);
      setSuccess('Medical record uploaded successfully!');
      
      // Reset Form fields
      setSelectedPatientId('');
      setPatientSearch('');
      setTitle('');
      setRecordType('Prescription');
      setDescription('');
      setSelectedFile(null);

      setUploadModalOpen(false);
      fetchData();
    } catch (e) {
      setError(e.message || 'Failed to upload medical record.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDescModal = (record) => {
    setSelectedRecord(record);
    setDescModalOpen(true);
  };

  return (
    <DashboardLayout title="Medical Records" subtitle="View and upload clinical documents and laboratory findings">
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">📁 Medical Records</h1>
            <p className="page-subtitle">{filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found</p>
          </div>
          <div>
            <button className="btn btn-primary" onClick={() => setUploadModalOpen(true)}>
              📤 Upload Record
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
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Prescription">Prescription</option>
            <option value="Lab Report">Lab Report</option>
            <option value="X-Ray">X-Ray</option>
            <option value="MRI Report">MRI Report</option>
            <option value="CT Scan">CT Scan</option>
            <option value="Other">Other</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>🔄 Refresh</button>
        </div>

        {/* Medical Records Table */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <div className="empty-state-title">No medical records found</div>
              <p>Upload a new record or adjust filters to view more.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Patient</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(r => (
                    <tr key={r._id}>
                      <td>
                        <div>
                          <div className="font-semibold">{r.title || 'Untitled Record'}</div>
                          {r.description && (
                            <div className="text-xs text-muted truncate" style={{ maxWidth: '240px', cursor: 'pointer' }} onClick={() => openDescModal(r)}>
                              {r.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={getRecordTypeBadge(r.type)}>{r.type}</span>
                      </td>
                      <td className="font-semibold">
                        {r.patientId?.name || r.patientId?.user?.name || 'N/A'}
                      </td>
                      <td>
                        {r.uploadedBy?.name || r.uploadedBy?.user?.name || 'Staff'}
                      </td>
                      <td>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {r.fileUrl ? (
                            <a
                              href={r.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary btn-xs"
                              style={{ display: 'inline-flex', alignItems: 'center' }}
                            >
                              🔗 View / Download
                            </a>
                          ) : (
                            <span className="text-muted text-xs">No File URL</span>
                          )}
                          {r.description && (
                            <button className="btn btn-secondary btn-xs" onClick={() => openDescModal(r)}>
                              Notes
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Record Modal */}
      {uploadModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setUploadModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📤 Upload Medical Record</h3>
              <button className="modal-close" onClick={() => setUploadModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleUploadSubmit}>
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
                  {/* Title */}
                  <div className="form-group">
                    <label className="form-label">Record Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Chest X-Ray Report, Blood Panel"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  {/* Type */}
                  <div className="form-group">
                    <label className="form-label">Record Type *</label>
                    <select
                      className="form-select"
                      value={recordType}
                      onChange={e => setRecordType(e.target.value)}
                      required
                    >
                      <option value="Prescription">Prescription</option>
                      <option value="Lab Report">Lab Report</option>
                      <option value="X-Ray">X-Ray</option>
                      <option value="MRI Report">MRI Report</option>
                      <option value="CT Scan">CT Scan</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* File Upload component */}
                <div className="form-group">
                  <label className="form-label">Upload Document *</label>
                  <FileUpload onFileSelect={file => setSelectedFile(file)} />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Clinical Notes / Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe findings, impressions, or notes related to this record..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setUploadModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Uploading...' : 'Save & Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Description / Notes Modal */}
      {descModalOpen && selectedRecord && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDescModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📝 Clinical Notes</h3>
              <button className="modal-close" onClick={() => setDescModalOpen(false)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>{selectedRecord.title}</strong>
                <span className={getRecordTypeBadge(selectedRecord.type)} style={{ marginTop: '6px' }}>{selectedRecord.type}</span>
              </div>
              
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <strong className="text-xs text-muted">Description / Findings:</strong>
                <p className="text-sm" style={{ marginTop: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {selectedRecord.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Uploaded by: <strong>{selectedRecord.uploadedBy?.name || selectedRecord.uploadedBy?.user?.name || 'Staff'}</strong> on {selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString() : 'N/A'}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDescModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
