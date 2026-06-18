'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { patientAPI, aiAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function DoctorPatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // History modal
  const [historyModal, setHistoryModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // AI modal
  const [aiModal, setAiModal] = useState(false);
  const [aiPatient, setAiPatient] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    patientAPI.getAll()
      .then(res => setPatients(res.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    !search || (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const openHistory = (p) => { setSelectedPatient(p); setHistoryModal(true); };

  const openAI = async (p) => {
    setAiPatient(p);
    setAiSummary('');
    setAiModal(true);
    setAiLoading(true);
    try {
      const records = [
        ...(p.medicalHistory?.previousDiseases || []),
        ...(p.medicalHistory?.currentMedications || []),
        ...(p.medicalHistory?.allergies || []),
      ];
      const res = await aiAPI.summarizeRecords(p, records);
      setAiSummary(res.data?.summary || res.summary || 'No summary generated.');
    } catch (e) {
      setAiSummary('AI summary unavailable. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <DashboardLayout title="My Patients" subtitle="Patients who have had appointments with you">
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Patients</h1>
            <p className="page-subtitle">{filtered.length} patient{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="search-bar">
            <span>🔍</span>
            <input
              placeholder="Search patients by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
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
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Date of Birth</th>
                    <th>Blood Group</th>
                    <th>Phone</th>
                    <th>Allergies</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state">
                          <div className="empty-state-icon">👥</div>
                          <div className="empty-state-title">No patients found</div>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map(p => (
                    <tr key={p._id}>
                      <td className="text-muted text-xs">{p._id?.slice(-8).toUpperCase() || '—'}</td>
                      <td className="font-semibold">{p.name || '—'}</td>
                      <td>{p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : '—'}</td>
                      <td>
                        {p.bloodGroup ? (
                          <span className="badge badge-danger">{p.bloodGroup}</span>
                        ) : '—'}
                      </td>
                      <td>{p.phone || '—'}</td>
                      <td className="text-sm text-muted">
                        {p.medicalHistory?.allergies?.length
                          ? p.medicalHistory.allergies.slice(0, 2).join(', ') + (p.medicalHistory.allergies.length > 2 ? '...' : '')
                          : 'None'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-secondary btn-xs" onClick={() => openHistory(p)}>
                            View History
                          </button>
                          <button className="btn btn-primary btn-xs" onClick={() => openAI(p)}>
                            🤖 AI Summarize
                          </button>
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

      {/* Medical History Modal */}
      {historyModal && selectedPatient && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setHistoryModal(false)}>
          <div className="modal" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 className="modal-title">📋 Medical History — {selectedPatient.name}</h3>
              <button className="modal-close" onClick={() => setHistoryModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="grid-2">
                <div className="card" style={{ padding: '16px' }}>
                  <div className="card-title" style={{ marginBottom: '8px', fontSize: '0.85rem' }}>🧬 Basic Info</div>
                  <div className="text-sm" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><span className="text-muted">DOB: </span>{selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : '—'}</div>
                    <div><span className="text-muted">Blood Group: </span><strong>{selectedPatient.bloodGroup || '—'}</strong></div>
                    <div><span className="text-muted">Gender: </span>{selectedPatient.gender || '—'}</div>
                    <div><span className="text-muted">Phone: </span>{selectedPatient.phone || '—'}</div>
                  </div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                  <div className="card-title" style={{ marginBottom: '8px', fontSize: '0.85rem' }}>🚨 Emergency Contact</div>
                  <div className="text-sm" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><span className="text-muted">Name: </span>{selectedPatient.emergencyContact?.name || '—'}</div>
                    <div><span className="text-muted">Relation: </span>{selectedPatient.emergencyContact?.relation || '—'}</div>
                    <div><span className="text-muted">Phone: </span>{selectedPatient.emergencyContact?.phone || '—'}</div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <div className="card-title" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>⚠️ Allergies</div>
                {selectedPatient.medicalHistory?.allergies?.length ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedPatient.medicalHistory.allergies.map((a, i) => (
                      <span key={i} className="badge badge-danger">{a}</span>
                    ))}
                  </div>
                ) : <span className="text-muted text-sm">No known allergies</span>}
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <div className="card-title" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>🏥 Previous Diseases</div>
                {selectedPatient.medicalHistory?.previousDiseases?.length ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedPatient.medicalHistory.previousDiseases.map((d, i) => (
                      <span key={i} className="badge badge-warning">{d}</span>
                    ))}
                  </div>
                ) : <span className="text-muted text-sm">None recorded</span>}
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <div className="card-title" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>💊 Current Medications</div>
                {selectedPatient.medicalHistory?.currentMedications?.length ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedPatient.medicalHistory.currentMedications.map((m, i) => (
                      <span key={i} className="badge badge-info">{m}</span>
                    ))}
                  </div>
                ) : <span className="text-muted text-sm">None</span>}
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <div className="card-title" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>🔪 Surgeries</div>
                {selectedPatient.medicalHistory?.surgeries?.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedPatient.medicalHistory.surgeries.map((s, i) => (
                      <div key={i} className="text-sm">
                        <strong>{s.name || s}</strong>
                        {s.date && <span className="text-muted"> — {new Date(s.date).toLocaleDateString()}</span>}
                      </div>
                    ))}
                  </div>
                ) : <span className="text-muted text-sm">No surgeries recorded</span>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {aiModal && aiPatient && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAiModal(false)}>
          <div className="modal" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🤖 AI Summary — {aiPatient.name}</h3>
              <button className="modal-close" onClick={() => setAiModal(false)}>✕</button>
            </div>
            {aiLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '16px' }}>
                <div className="loading-spinner" />
                <p className="text-muted">Generating AI summary...</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span className="badge badge-primary">✨ Gemini AI</span>
                  <span className="text-xs text-muted">AI-generated clinical summary</span>
                </div>
                <div className="card" style={{ background: 'var(--bg-elevated)', padding: '20px', lineHeight: '1.7' }}>
                  <p className="text-sm">{aiSummary}</p>
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAiModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => openAI(aiPatient)} disabled={aiLoading}>
                🔄 Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
