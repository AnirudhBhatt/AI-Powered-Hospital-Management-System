'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { patientAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function NurseDashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states for vitals
  const [bp, setBp] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [spo2, setSpo2] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await patientAPI.getAll();
      setPatients(res.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch patients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleOpenVitalsModal = (patient) => {
    setSelectedPatient(patient);
    // Populate existing vitals if available
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
      const updatedVitals = {
        bloodPressure: bp,
        heartRate,
        temperature,
        spo2,
        weight,
        notes,
        recordedAt: new Date().toISOString()
      };

      // Call API to update the patient with vitals
      await patientAPI.update(selectedPatient._id, {
        ...selectedPatient,
        vitals: updatedVitals
      });

      setModalOpen(false);
      fetchPatients();
    } catch (err) {
      alert(err.message || 'Failed to update vitals');
    } finally {
      setSaving(false);
    }
  };

  // Filter patients based on search
  const filteredPatients = patients.filter((patient) => {
    const name = patient.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate statistics
  const totalPatients = patients.length;
  const vitalsRecorded = patients.filter(p => p.vitals && (p.vitals.bloodPressure || p.vitals.heartRate)).length;
  const pendingTasks = Math.max(0, totalPatients - vitalsRecorded);

  const nurseName = user?.name || 'Nurse';

  return (
    <DashboardLayout title="Nurse Dashboard" subtitle={`Welcome back, ${nurseName}`}>
      {loading && patients.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="loading-spinner" />
        </div>
      ) : error ? (
        <div className="alert-emergency">{error}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Stats Section */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>👥</div>
              <div>
                <div className="stat-value">{totalPatients}</div>
                <div className="stat-label">Today's Patients</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>💓</div>
              <div>
                <div className="stat-value">{vitalsRecorded}</div>
                <div className="stat-label">Vitals Recorded</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>📋</div>
              <div>
                <div className="stat-value">{pendingTasks}</div>
                <div className="stat-label">Pending Vitals</div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div className="search-bar">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search patient by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (patients.length > 0) {
                  handleOpenVitalsModal(patients[0]);
                } else {
                  alert('No patients available to update vitals.');
                }
              }}
            >
              ➕ Update Vitals Quick Action
            </button>
          </div>

          {/* Patient Table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="card-header" style={{ padding: '20px 24px 10px 24px' }}>
              <div>
                <div className="card-title">Ward Patients Overview</div>
                <div className="card-subtitle">List of general ward and outpatient records</div>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Room / Ward</th>
                    <th>Blood Group</th>
                    <th>Status</th>
                    <th>Last Vitals</th>
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
                    filteredPatients.map((patient) => {
                      const vitals = patient.vitals || {};
                      const latestBp = vitals.bloodPressure || vitals.bp || '—';
                      const latestPulse = vitals.heartRate ? `${vitals.heartRate} bpm` : '—';
                      return (
                        <tr key={patient._id}>
                          <td className="text-muted text-xs">
                            {patient.patientId || patient._id?.slice(-8).toUpperCase() || '—'}
                          </td>
                          <td className="font-semibold">{patient.name || '—'}</td>
                          <td>
                            {patient.isAdmitted ? (
                              <span className="badge badge-info">
                                {patient.roomId?.roomNumber || patient.roomId?.name || 'General Ward'}
                              </span>
                            ) : (
                              <span className="text-muted">Outpatient</span>
                            )}
                          </td>
                          <td>
                            {patient.bloodGroup ? (
                              <span className="badge badge-danger">{patient.bloodGroup}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            {patient.isAdmitted ? (
                              <span className="badge badge-success">Admitted</span>
                            ) : (
                              <span className="badge badge-secondary">Regular Visit</span>
                            )}
                          </td>
                          <td className="text-xs">
                            {latestBp !== '—' || latestPulse !== '—' ? (
                              <div>
                                <div>BP: {latestBp}</div>
                                <div>HR: {latestPulse}</div>
                              </div>
                            ) : (
                              <span className="text-muted">No Vitals</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => handleOpenVitalsModal(patient)}
                            >
                              💓 Update Vitals
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Update Vitals Modal */}
      {modalOpen && selectedPatient && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Record Patient Vitals</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveVitals}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Patient</label>
                <select
                  className="form-select"
                  value={selectedPatient._id}
                  onChange={(e) => {
                    const pat = patients.find(p => p._id === e.target.value);
                    if (pat) handleOpenVitalsModal(pat);
                  }}
                >
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-grid" style={{ marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 120/80"
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
                <label className="form-label">Clinical Notes / Symptoms</label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter clinical notes, pain levels, or observed symptoms..."
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
