'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { prescriptionAPI, aiAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Chat Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedMedicineName, setSelectedMedicineName] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await prescriptionAPI.getAll();
      setPrescriptions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch prescriptions:', err);
      setError('Failed to load prescriptions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'badge-warning';
      case 'Dispensed':
        return 'badge-success';
      case 'Expired':
        return 'badge-secondary';
      default:
        return 'badge-primary';
    }
  };

  const openAiModal = (prescription) => {
    setSelectedPrescription(prescription);
    const medicines = prescription.medicines || [];
    const firstMedName = medicines[0]?.medicine?.name || medicines[0]?.name || '';
    setSelectedMedicineName(firstMedName);
    setAiQuestion(firstMedName ? `How does ${firstMedName} help me?` : 'How do these medicines help me?');
    setAiChatHistory([]);
    setIsAiModalOpen(true);
  };

  const handleMedicineChange = (e) => {
    const medName = e.target.value;
    setSelectedMedicineName(medName);
    setAiQuestion(medName ? `How does ${medName} help me?` : 'How do these medicines help me?');
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!selectedMedicineName || !aiQuestion.trim()) return;

    const currentQuestion = aiQuestion;
    const currentMedicine = selectedMedicineName;

    // Add user message to chat
    setAiChatHistory((prev) => [...prev, { role: 'user', content: currentQuestion }]);
    setAiLoading(true);
    setAiQuestion('');

    try {
      const response = await aiAPI.explainPrescription(currentMedicine, currentQuestion);
      setAiChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: response.data || response.message || response.explanation || 'I am unable to explain this prescription at the moment.' }
      ]);
    } catch (err) {
      console.error('AI Error:', err);
      setAiChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error while processing your request. Please try again.' }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <DashboardLayout title="Prescriptions" subtitle="View and manage your active and past prescriptions">
      <div className="page">
        {error && (
          <div className="alert-emergency">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title" style={{ fontSize: '1.25rem' }}>Your Prescriptions</h2>
          <button className="btn btn-secondary btn-sm" onClick={fetchPrescriptions} disabled={loading}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="loading-spinner"></div>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">💊</div>
              <div className="empty-state-title">No prescriptions found</div>
              <p className="text-muted">You do not have any prescriptions recorded in the system.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '20px' }}>
            {prescriptions.map((rx) => {
              const doctorName = rx.doctorId?.user?.name || rx.doctorId?.name || 'Unknown Doctor';
              const dateStr = rx.createdAt ? new Date(rx.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }) : '—';

              return (
                <div key={rx._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Card Header */}
                  <div className="flex justify-between items-start" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Dr. {doctorName}</h3>
                      <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                        📅 Issued: {dateStr}
                      </div>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(rx.status)}`}>{rx.status}</span>
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Diagnosis
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{rx.diagnosis || 'General Consultation'}</div>
                  </div>

                  {/* Medicines List */}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Medicines
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(rx.medicines || []).map((med, index) => {
                        const mName = med.medicine?.name || med.name || 'Unknown Medicine';
                        return (
                          <div key={index} style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--primary-light)', fontSize: '0.875rem' }}>💊 {mName}</span>
                              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{med.dosage}</span>
                            </div>
                            <div className="text-xs text-muted" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div><strong>Frequency:</strong> {med.frequency} · <strong>Duration:</strong> {med.duration}</div>
                              {med.instructions && <div><strong>Instructions:</strong> {med.instructions}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Treatment Plan / Instructions */}
                  <div style={{ padding: '12px', background: 'rgba(99,102,241,0.05)', borderLeft: '3px solid var(--primary)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-light)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Treatment Plan & Advice
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {rx.instructions || 'Follow medicine dosages as instructed by the doctor.'}
                    </p>
                  </div>

                  {/* Ask AI Button */}
                  <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => openAiModal(rx)}
                    >
                      🤖 Ask AI about Prescription
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Chat Modal */}
      {isAiModalOpen && selectedPrescription && (
        <div className="modal-overlay" onClick={() => setIsAiModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', height: '80vh', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="modal-title">🤖 Prescription AI Assistant</h3>
                <p className="text-xs text-muted" style={{ marginTop: '2px' }}>
                  Ask about drugs, side effects, and guidelines
                </p>
              </div>
              <button className="modal-close" onClick={() => setIsAiModalOpen(false)}>✕</button>
            </div>

            {/* Medicine Selector */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Select Medicine</label>
              <select className="form-select" value={selectedMedicineName} onChange={handleMedicineChange}>
                {(selectedPrescription.medicines || []).map((m, i) => {
                  const mName = m.medicine?.name || m.name || '';
                  return (
                    <option key={i} value={mName}>
                      {mName}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Chat Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {aiChatHistory.length === 0 && (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div style={{ fontSize: '32px' }}>🤖</div>
                  <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>Ready to Explain</div>
                  <p className="text-xs text-muted" style={{ maxWidth: '280px', margin: '0 auto' }}>
                    Select a medicine and click Send to get information regarding usage, guidelines, and potential side effects.
                  </p>
                </div>
              )}

              {aiChatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`ai-message ${msg.role === 'user' ? 'user' : 'bot'}`}
                  style={{
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {msg.content}
                </div>
              ))}

              {aiLoading && (
                <div className="ai-typing" style={{ alignSelf: 'flex-start' }}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleAskAI} style={{ display: 'flex', gap: '8px' }}>
              <input
                className="form-input"
                placeholder="Ask something about this medicine..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                disabled={aiLoading}
              />
              <button className="btn btn-primary" type="submit" disabled={aiLoading || !aiQuestion.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
