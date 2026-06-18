'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { emergencyAPI, patientAPI, doctorAPI, notificationAPI } from '@/lib/api';

export default function EmergencyPage() {
  const [emergencies, setEmergencies] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patientId: '', symptoms: '', notes: '', doctorId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eRes, pRes, dRes] = await Promise.all([
        emergencyAPI.getAll(),
        patientAPI.getAll(),
        doctorAPI.getAll()
      ]);
      setEmergencies(eRes.data || []);
      setPatients(pRes.data || []);
      setDoctors(dRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEmergency = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await emergencyAPI.register(form);
      setMessage('🚨 Emergency case registered! All doctors and admins have been notified.');
      setShowModal(false);
      setForm({ patientId: '', symptoms: '', notes: '', doctorId: '' });
      await fetchData();
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = { 'Confirmed': 'badge-danger', 'In Consultation': 'badge-warning', 'Requested': 'badge-danger' };
    return <span className={`badge ${map[status] || 'badge-secondary'} badge-emergency`}>{status}</span>;
  };

  return (
    <DashboardLayout title="Emergency Management" subtitle="Immediate registration & priority queue">
      {message && (
        <div className="alert-emergency" style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <div style={{ fontWeight: 700, color: '#fca5a5' }}>Emergency Alert</div>
            <div style={{ fontSize: '0.85rem', color: '#fecaca' }}>{message}</div>
          </div>
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => setMessage('')}>✕</button>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">🚨 Emergency Management</h1>
          <p className="page-subtitle">Active emergency cases — immediate attention required</p>
        </div>
        <button className="btn btn-danger" onClick={() => setShowModal(true)}>
          🆘 Register Emergency Case
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>🚨</div>
          <div>
            <div className="stat-value" style={{ color: '#f87171' }}>{emergencies.length}</div>
            <div className="stat-label">Active Emergency Cases</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>⚡</div>
          <div>
            <div className="stat-value">{doctors.filter(d => d.isAvailable).length}</div>
            <div className="stat-label">Available Doctors</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>🏥</div>
          <div>
            <div className="stat-value">24/7</div>
            <div className="stat-label">Emergency Response</div>
          </div>
        </div>
      </div>

      {/* Emergency Cases */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Active Emergency Cases</div>
            <div className="card-subtitle">Priority queue — sorted by registration time</div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="loading-spinner"></div>
          </div>
        ) : emergencies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">No Active Emergency Cases</div>
            <p>All emergency cases have been handled.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Case ID</th>
                  <th>Patient</th>
                  <th>Blood Group</th>
                  <th>Doctor Assigned</th>
                  <th>Symptoms</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {emergencies.map((e, idx) => (
                  <tr key={e._id}>
                    <td>
                      <span style={{ color: '#f87171', fontWeight: 700, fontSize: '1.2rem' }}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td><code style={{ color: '#a78bfa', fontSize: '0.8rem' }}>{e.appointmentId}</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{e.patientId?.name || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.patientId?.phone}</div>
                    </td>
                    <td>
                      <span className="badge badge-danger">{e.patientId?.bloodGroup || 'Unknown'}</span>
                    </td>
                    <td>{e.doctorId?.name || <span style={{ color: 'var(--text-muted)' }}>Auto-assigning...</span>}</td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                        {e.symptoms || 'No symptoms recorded'}
                      </div>
                    </td>
                    <td>{getStatusBadge(e.status)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Emergency Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🚨 Register Emergency Case</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, color: '#fca5a5', fontSize: '0.875rem' }}>
              ⚠️ This will immediately notify ALL doctors and hospital administrators.
            </div>

            <form onSubmit={handleRegisterEmergency}>
              <div className="form-group">
                <label className="form-label">Select Patient *</label>
                <select className="form-select" value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})} required>
                  <option value="">-- Search Patient --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.name} — {p.patientId} | {p.bloodGroup || 'Unknown BG'}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Doctor (Optional — Auto-assigns if blank)</label>
                <select className="form-select" value={form.doctorId} onChange={e => setForm({...form, doctorId: e.target.value})}>
                  <option value="">Auto-assign available doctor</option>
                  {doctors.filter(d => d.isAvailable).map(d => (
                    <option key={d._id} value={d._id}>Dr. {d.name} — {d.specialization}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Presenting Symptoms *</label>
                <textarea className="form-textarea" rows={3} value={form.symptoms} onChange={e => setForm({...form, symptoms: e.target.value})} required placeholder="e.g., Severe chest pain, shortness of breath, unconscious patient..." />
              </div>

              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any additional information for the responding team..." />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  {submitting ? 'Registering...' : '🚨 Register Emergency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
