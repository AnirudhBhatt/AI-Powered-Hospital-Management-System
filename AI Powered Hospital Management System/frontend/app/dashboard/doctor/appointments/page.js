'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { appointmentAPI, patientAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const STATUS_BADGE = {
  'Requested': 'badge-warning',
  'Confirmed': 'badge-info',
  'In Consultation': 'badge-primary',
  'Completed': 'badge-success',
  'Cancelled': 'badge-danger',
};

export default function DoctorAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Consultation modal state
  const [consultModal, setConsultModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    appointmentAPI.getAll()
      .then(res => {
        const data = res.data || [];
        setAppointments(data);
        setFiltered(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = appointments;
    if (statusFilter) data = data.filter(a => a.status === statusFilter);
    setFiltered(data);
  }, [statusFilter, appointments]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await appointmentAPI.updateStatus(id, { status });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    } catch (e) { alert(e.message); }
  };

  const openConsultModal = (appt) => {
    setSelectedAppt(appt);
    setDiagnosis('');
    setTreatmentPlan('');
    setNotes('');
    setConsultModal(true);
    handleStatusUpdate(appt._id, 'In Consultation');
  };

  const handleSaveComplete = async () => {
    if (!selectedAppt) return;
    setSaving(true);
    try {
      await appointmentAPI.updateStatus(selectedAppt._id, {
        status: 'Completed',
        diagnosis,
        treatmentPlan,
        notes,
      });
      setAppointments(prev => prev.map(a =>
        a._id === selectedAppt._id ? { ...a, status: 'Completed' } : a
      ));
      setConsultModal(false);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout title="My Appointments" subtitle="Manage and track patient appointments">
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Appointments</h1>
            <p className="page-subtitle">{filtered.length} appointment{filtered.length !== 1 ? 's' : ''} found</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <select
            className="form-select"
            style={{ width: '200px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Requested">Requested</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In Consultation">In Consultation</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {error && <div className="alert-emergency">{error}</div>}

        {loading ? (
          <div className="loading-spinner" />
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Symptoms</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state">
                          <div className="empty-state-icon">📭</div>
                          <div className="empty-state-title">No appointments found</div>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map(appt => (
                    <tr key={appt._id}>
                      <td className="font-semibold">{appt.patientId?.name || '—'}</td>
                      <td>{appt.date ? new Date(appt.date).toLocaleDateString() : '—'}</td>
                      <td>{appt.timeSlot || '—'}</td>
                      <td>{appt.department || '—'}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[appt.status] || 'badge-secondary'}`}>
                          {appt.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="text-sm text-muted" style={{ maxWidth: '180px' }}>
                        <span className="truncate" style={{ display: 'block' }}>{appt.symptoms || '—'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {appt.status !== 'Completed' && appt.status !== 'Cancelled' && appt.status !== 'In Consultation' && (
                            <button
                              className="btn btn-primary btn-xs"
                              onClick={() => openConsultModal(appt)}
                            >
                              Start Consultation
                            </button>
                          )}
                          {appt.status === 'In Consultation' && (
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => openConsultModal(appt)}
                            >
                              Complete
                            </button>
                          )}
                          {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => handleStatusUpdate(appt._id, 'Cancelled')}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Consultation Modal */}
      {consultModal && selectedAppt && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConsultModal(false)}>
          <div className="modal" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🩺 Consultation — {selectedAppt.patientId?.name}</h3>
              <button className="modal-close" onClick={() => setConsultModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Diagnosis *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter diagnosis..."
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Treatment Plan *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter treatment plan..."
                  value={treatmentPlan}
                  onChange={e => setTreatmentPlan(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConsultModal(false)}>Cancel</button>
              <button
                className="btn btn-success"
                onClick={handleSaveComplete}
                disabled={saving || !diagnosis || !treatmentPlan}
              >
                {saving ? 'Saving...' : '✅ Save & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
