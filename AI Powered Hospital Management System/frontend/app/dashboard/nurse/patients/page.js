'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { patientAPI, appointmentAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function NursePatientList() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal and vitals states
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bp, setBp] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [spo2, setSpo2] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientsRes, appointmentsRes] = await Promise.all([
        patientAPI.getAll(),
        appointmentAPI.getAll()
      ]);
      setPatients(patientsRes.data || []);
      setAppointments(appointmentsRes.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenVitalsModal = (patient) => {
    setSelectedPatient(patient);
    const v = patient.vitals || {};
    setBp(v.bloodPressure || v.bp || '');
    setHeartRate(v.heartRate || '');
    setTemperature(v.temperature || '');
    setSpo2(v.spo2 || '');
    setWeight(v.weight || '');
    setNotes(v.notes || '');
    setModalOpen(true);
  };

  const handleSaveVitals = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      setSaving(true);
      const vitalsPayload = {
        bloodPressure: bp,
        heartRate: Number(heartRate),
        temperature: Number(temperature),
        spo2: Number(spo2),
        weight: Number(weight),
        notes,
        recordedAt: new Date().toISOString()
      };

      // Update patient profile/vitals
      await patientAPI.update(selectedPatient._id, {
        ...selectedPatient,
        vitals: vitalsPayload,
        // Also save in medicalHistory for compatibility
        medicalHistory: {
          ...selectedPatient.medicalHistory,
          vitals: vitalsPayload
        }
      });

      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update vitals');
    } finally {
      setSaving(false);
    }
  };

  const getAssignedDoctor = (patientId) => {
    // Look up in appointments for the doctor assigned to this patient
    const appt = appointments.find(
      (a) => a.patientId?._id === patientId || a.patientId === patientId
    );
    if (appt?.doctorId?.name) {
      return `Dr. ${appt.doctorId.name}`;
    }
    return 'Not Assigned';
  };

  const getPatientRoom = (patient) => {
    if (!patient.isAdmitted) return 'Outpatient';
    if (patient.roomId) {
      return patient.roomId.roomNumber || patient.roomId.name || 'General Ward';
    }
    return 'General Ward';
  };

  const filteredPatients = patients.filter((p) =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Patient List" subtitle="Manage patient records and clinical vitals">
      {loading && patients.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="loading-spinner" />
        </div>
      ) : error ? (
        <div className="alert-emergency">{error}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div className="search-bar">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search patients by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted">
              Total Patients: <strong style={{ color: 'var(--text-primary)' }}>{filteredPatients.length}</strong>
            </div>
          </div>

          {/* Patients Table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Room</th>
                    <th>Blood Group</th>
                    <th>Doctor Assigned</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center' }}>
                        <div className="empty-state">
                          <div className="empty-state-icon">👥</div>
                          <div className="empty-state-title">No patients found</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient) => (
                      <tr key={patient._id}>
                        <td className="text-muted text-xs">
                          {patient.patientId || patient._id?.slice(-8).toUpperCase() || '—'}
                        </td>
                        <td className="font-semibold">{patient.name || '—'}</td>
                        <td>{getPatientRoom(patient)}</td>
                        <td>
                          {patient.bloodGroup ? (
                            <span className="badge badge-danger">{patient.bloodGroup}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="font-medium text-sm">
                          {getAssignedDoctor(patient._id)}
                        </td>
                        <td>
                          {patient.isAdmitted ? (
                            <span className="badge badge-success">Admitted</span>
                          ) : (
                            <span className="badge badge-secondary">Outpatient</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => handleOpenVitalsModal(patient)}
                          >
                            💓 Update Vitals
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vitals Entry Modal */}
      {modalOpen && selectedPatient && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Update Vitals for {selectedPatient.name}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveVitals}>
              <div className="form-grid" style={{ marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Blood Pressure (e.g. 120/80)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="120/80"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 72"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-3" style={{ marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="e.g. 98.6"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SpO2 (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 98"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="e.g. 70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  placeholder="Add details on allergies, current medications, pain levels or comments..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Vitals'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
