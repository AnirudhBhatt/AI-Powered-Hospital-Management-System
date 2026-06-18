'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { prescriptionAPI, patientAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function DoctorPrescriptionsPage() {
  const { user, profile } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State - New Prescription
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Prescription Form Fields
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [labTests, setLabTests] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Modal State - View Details
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [prescRes, patientRes] = await Promise.all([
        prescriptionAPI.getAll(),
        patientAPI.getAll(),
      ]);
      setPrescriptions(prescRes.data || []);
      setPatients(patientRes.data || []);
    } catch (e) {
      setError(e.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Filter prescriptions created by this doctor, search patient name, and filter status
  const filteredPrescriptions = prescriptions.filter(p => {
    // Check if prescription is created by current doctor
    const docId = p.doctorId?._id || p.doctor;
    const isDocMatch = !profile?._id || docId === profile?._id;
    if (!isDocMatch) return false;

    // Status filter
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;

    // Search query
    const patientName = p.patientId?.name || p.patientId?.user?.name || '';
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || patientName.toLowerCase().includes(q) || p.diagnosis?.toLowerCase().includes(q) || p._id?.includes(q);

    return matchStatus && matchSearch;
  });

  // Filter patients list inside the New Prescription modal
  const filteredPatients = patients.filter(p => {
    const name = p.name || p.user?.name || '';
    return name.toLowerCase().includes(patientSearch.toLowerCase());
  });

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const handleRemoveMedicine = (index) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = medicines.map((m, i) => {
      if (i === index) {
        return { ...m, [field]: value };
      }
      return m;
    });
    setMedicines(updated);
  };

  const handleNewPrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient.');
      return;
    }
    // Validate medicines
    for (let m of medicines) {
      if (!m.name.trim()) {
        alert('Please provide a name for all medicines.');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const payload = {
        patient: selectedPatientId,
        diagnosis,
        symptoms,
        medicines: medicines.map(m => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions
        })),
        labTests,
        treatmentPlan,
        followUpDate: followUpDate || undefined,
        status: 'Active'
      };

      await prescriptionAPI.create(payload);
      setSuccess('Prescription created successfully!');
      
      // Reset Form
      setSelectedPatientId('');
      setPatientSearch('');
      setDiagnosis('');
      setSymptoms('');
      setMedicines([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
      setLabTests('');
      setTreatmentPlan('');
      setFollowUpDate('');
      
      setNewModalOpen(false);
      fetchData();
    } catch (e) {
      setError(e.message || 'Failed to create prescription.');
    } finally {
      setSubmitting(false);
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

  const openDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setDetailModalOpen(true);
  };

  return (
    <DashboardLayout title="Prescriptions" subtitle="Manage patient prescriptions and recommendations">
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">💊 Prescriptions</h1>
            <p className="page-subtitle">{filteredPrescriptions.length} prescription{filteredPrescriptions.length !== 1 ? 's' : ''} found</p>
          </div>
          <div>
            <button className="btn btn-primary" onClick={() => setNewModalOpen(true)}>
              ➕ New Prescription
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
            <option value="Active">Active</option>
            <option value="Dispensed">Dispensed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Expired">Expired</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>🔄 Refresh</button>
        </div>

        {/* Prescription Table */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💊</div>
              <div className="empty-state-title">No prescriptions found</div>
              <p>Create a new prescription or clear filters to view more.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Prescription ID</th>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Diagnosis</th>
                    <th>Medicines</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrescriptions.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary-light)' }}>
                        #{p._id?.slice(-8).toUpperCase()}
                      </td>
                      <td className="font-semibold">
                        {p.patientId?.name || p.patientId?.user?.name || 'N/A'}
                      </td>
                      <td>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="truncate" style={{ maxWidth: '200px' }}>
                        {p.diagnosis || '—'}
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {p.medicines?.length || 0} medicine{p.medicines?.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadge(p.status)}>{p.status || 'Active'}</span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-xs" onClick={() => openDetails(p)}>
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

      {/* New Prescription Modal */}
      {newModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setNewModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ New Prescription</h3>
              <button className="modal-close" onClick={() => setNewModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleNewPrescriptionSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Patient Selector */}
                <div className="form-group">
                  <label className="form-label">Select Patient *</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search patient name..."
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <select
                    className="form-select"
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {filteredPatients.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name || p.user?.name} {p.dateOfBirth ? `(DOB: ${new Date(p.dateOfBirth).toLocaleDateString()})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid">
                  {/* Diagnosis */}
                  <div className="form-group">
                    <label className="form-label">Diagnosis *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Hypertension, Viral Fever"
                      value={diagnosis}
                      onChange={e => setDiagnosis(e.target.value)}
                      required
                    />
                  </div>
                  {/* Symptoms */}
                  <div className="form-group">
                    <label className="form-label">Symptoms</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Headache, Sore throat, Fatigue"
                      value={symptoms}
                      onChange={e => setSymptoms(e.target.value)}
                    />
                  </div>
                </div>

                {/* Dynamic Medicines List */}
                <div className="card" style={{ background: 'var(--bg-elevated)', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 className="card-title" style={{ color: 'var(--primary-light)' }}>💊 Medicines List</h4>
                    <button type="button" className="btn btn-primary btn-xs" onClick={handleAddMedicine}>
                      ➕ Add Medicine
                    </button>
                  </div>
                  
                  {medicines.map((med, index) => (
                    <div key={index} style={{ borderBottom: index < medicines.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Medicine #{index + 1}</span>
                        {medicines.length > 1 && (
                          <button type="button" className="btn btn-danger btn-xs" onClick={() => handleRemoveMedicine(index)}>
                            ✕ Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="form-grid-3" style={{ marginBottom: '8px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label text-xs">Name *</label>
                          <input
                            type="text"
                            className="form-input form-input-sm"
                            placeholder="Medicine name"
                            value={med.name}
                            onChange={e => handleMedicineChange(index, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label text-xs">Dosage</label>
                          <input
                            type="text"
                            className="form-input form-input-sm"
                            placeholder="e.g. 500mg, 1 tablet"
                            value={med.dosage}
                            onChange={e => handleMedicineChange(index, 'dosage', e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label text-xs">Frequency</label>
                          <input
                            type="text"
                            className="form-input form-input-sm"
                            placeholder="e.g. Twice daily, Once in morning"
                            value={med.frequency}
                            onChange={e => handleMedicineChange(index, 'frequency', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-grid" style={{ marginBottom: 0 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label text-xs">Duration</label>
                          <input
                            type="text"
                            className="form-input form-input-sm"
                            placeholder="e.g. 5 days, 1 month"
                            value={med.duration}
                            onChange={e => handleMedicineChange(index, 'duration', e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label text-xs">Instructions</label>
                          <input
                            type="text"
                            className="form-input form-input-sm"
                            placeholder="e.g. Take after meals, Drink plenty of water"
                            value={med.instructions}
                            onChange={e => handleMedicineChange(index, 'instructions', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lab Tests */}
                <div className="form-group">
                  <label className="form-label">Lab Tests to Order</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. CBC, Lipid Profile, Thyroid Panel (separated by commas)"
                    value={labTests}
                    onChange={e => setLabTests(e.target.value)}
                  />
                </div>

                {/* Treatment Plan */}
                <div className="form-group">
                  <label className="form-label">Treatment Plan</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe patient treatment plan, diet changes, restrictions..."
                    value={treatmentPlan}
                    onChange={e => setTreatmentPlan(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Follow-up Date */}
                <div className="form-group">
                  <label className="form-label">Follow-up Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                  />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setNewModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Submit Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Prescription Details Modal */}
      {detailModalOpen && selectedPrescription && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📋 Prescription Details</h3>
              <button className="modal-close" onClick={() => setDetailModalOpen(false)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ID: <strong style={{ color: 'var(--primary-light)', fontFamily: 'monospace' }}>#{selectedPrescription._id}</strong>
                </span>
                <span className={getStatusBadge(selectedPrescription.status)}>{selectedPrescription.status}</span>
              </div>

              <div className="grid-2">
                <div className="card" style={{ padding: '16px', background: 'var(--bg-elevated)' }}>
                  <div className="card-title" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>👤 Patient Info</div>
                  <div className="text-sm">
                    <div><strong>Name:</strong> {selectedPrescription.patientId?.name || selectedPrescription.patientId?.user?.name || 'N/A'}</div>
                    {selectedPrescription.patientId?.gender && <div><strong>Gender:</strong> {selectedPrescription.patient.gender}</div>}
                    {selectedPrescription.patientId?.phone && <div><strong>Phone:</strong> {selectedPrescription.patient.phone}</div>}
                  </div>
                </div>
                <div className="card" style={{ padding: '16px', background: 'var(--bg-elevated)' }}>
                  <div className="card-title" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>🩺 Medical Info</div>
                  <div className="text-sm">
                    <div><strong>Date Created:</strong> {selectedPrescription.createdAt ? new Date(selectedPrescription.createdAt).toLocaleString() : 'N/A'}</div>
                    {selectedPrescription.followUpDate && (
                      <div><strong>Follow-up Date:</strong> {new Date(selectedPrescription.followUpDate).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <strong className="text-sm">Symptoms:</strong>
                <p className="text-sm text-muted" style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginTop: '4px' }}>
                  {selectedPrescription.symptoms || 'None recorded'}
                </p>
              </div>

              <div>
                <strong className="text-sm">Diagnosis:</strong>
                <p className="text-sm text-muted" style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginTop: '4px' }}>
                  {selectedPrescription.diagnosis || 'None'}
                </p>
              </div>

              {/* Medicines details */}
              <div>
                <strong className="text-sm" style={{ display: 'block', marginBottom: '8px' }}>💊 Prescribed Medicines:</strong>
                {(!selectedPrescription.medicines || selectedPrescription.medicines.length === 0) ? (
                  <p className="text-sm text-muted">No medicines prescribed.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedPrescription.medicines.map((m, i) => (
                      <div key={i} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--primary-light)' }}>{m.name || m.medicine?.name}</span>
                          <span className="text-muted">{m.dosage}</span>
                        </div>
                        <div className="text-xs text-muted" style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                          <span><strong>Frequency:</strong> {m.frequency || 'N/A'}</span>
                          <span><strong>Duration:</strong> {m.duration || 'N/A'}</span>
                        </div>
                        {m.instructions && (
                          <div className="text-xs text-muted" style={{ marginTop: '4px', borderTop: '1px solid var(--border-light)', paddingTop: '4px' }}>
                            <strong>Instructions:</strong> {m.instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPrescription.labTests && (
                <div>
                  <strong className="text-sm">Ordered Lab Tests:</strong>
                  <p className="text-sm text-muted" style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginTop: '4px' }}>
                    {selectedPrescription.labTests}
                  </p>
                </div>
              )}

              {selectedPrescription.treatmentPlan && (
                <div>
                  <strong className="text-sm">Treatment Plan:</strong>
                  <p className="text-sm text-muted" style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                    {selectedPrescription.treatmentPlan}
                  </p>
                </div>
              )}

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
