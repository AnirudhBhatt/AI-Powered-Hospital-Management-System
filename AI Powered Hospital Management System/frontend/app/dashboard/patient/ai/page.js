'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { patientAPI, doctorAPI, prescriptionAPI, aiAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function PatientAiPage() {
  const { user } = useAuth();
  
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState('symptoms'); // symptoms, appointment, prescription, chat

  // Data states
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [activeMedicines, setActiveMedicines] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // 1. AI Symptom Analyzer State
  const [symptomText, setSymptomText] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState('Other');
  const [analyzingSymptoms, setAnalyzingSymptoms] = useState(false);
  const [symptomResult, setSymptomResult] = useState(null);
  const [symptomError, setSymptomError] = useState('');

  // 2. AI Appointment Assistant State
  const [apptQuery, setApptQuery] = useState('');
  const [findingAppt, setFindingAppt] = useState(false);
  const [apptResult, setApptResult] = useState(null);
  const [apptError, setApptError] = useState('');

  // 3. AI Prescription Helper State
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [explainingMed, setExplainingMed] = useState(false);
  const [medExplanation, setMedExplanation] = useState('');
  const [medError, setMedError] = useState('');

  // 4. General Health AI Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      const [profileRes, doctorRes, rxRes] = await Promise.allSettled([
        patientAPI.getMyProfile(),
        doctorAPI.getAll(),
        prescriptionAPI.getAll(),
      ]);

      let patientProfile = null;
      let medsList = [];

      if (profileRes.status === 'fulfilled') {
        patientProfile = profileRes.value.data;
        setProfile(patientProfile);
        
        // Extract meds from medicalHistory
        if (patientProfile?.medicalHistory?.currentMedications) {
          medsList = patientProfile.medicalHistory.currentMedications.map(m => 
            typeof m === 'string' ? m : (m.name || m.medicine?.name || '')
          ).filter(Boolean);
        } else if (patientProfile?.currentMedications) {
          medsList = patientProfile.currentMedications.map(m =>
            typeof m === 'string' ? m : (m.name || m.medicine?.name || '')
          ).filter(Boolean);
        }
      }

      if (doctorRes.status === 'fulfilled') {
        setDoctors(doctorRes.value.data || []);
      }

      // Supplement from prescriptions if available
      if (rxRes.status === 'fulfilled') {
        const prescriptions = rxRes.value.data || [];
        prescriptions.forEach(rx => {
          if (rx.status === 'Active' && rx.medicines) {
            rx.medicines.forEach(m => {
              const name = m.medicine?.name || m.name;
              if (name && !medsList.includes(name)) {
                medsList.push(name);
              }
            });
          }
        });
      }

      // Deduplicate medicines list
      setActiveMedicines([...new Set(medsList)]);

    } catch (err) {
      console.error('Error fetching patient data context:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // 1. Symptom Analyzer handler
  const handleAnalyzeSymptoms = async (e) => {
    e.preventDefault();
    if (!symptomText.trim()) return;

    try {
      setAnalyzingSymptoms(true);
      setSymptomError('');
      setSymptomResult(null);

      // Combine symptoms text and body part for richer prompt context
      const fullSymptomString = `${symptomText} (Body location: ${selectedBodyPart})`;
      const response = await aiAPI.analyzeSymptoms(fullSymptomString);
      
      // The API may return data wrapper or directly the object
      setSymptomResult(response.data || response);
    } catch (err) {
      console.error('Symptom analysis failed:', err);
      setSymptomError(err.message || 'Symptom analysis failed. Please try again.');
    } finally {
      setAnalyzingSymptoms(false);
    }
  };

  // Shortcut to Appointment Assistant
  const handleBookShortcut = (dept) => {
    setActiveTab('appointment');
    setApptQuery(`I need to book a ${dept || 'general physician'} next Monday morning`);
    setApptResult(null);
  };

  // 2. Appointment Assistant handler
  const handleAppointmentSearch = async (e) => {
    e.preventDefault();
    if (!apptQuery.trim()) return;

    try {
      setFindingAppt(true);
      setApptError('');
      setApptResult(null);

      // Pass the doctors list fetched initially so the AI can run scheduling algorithms
      const response = await aiAPI.appointmentAssistant(apptQuery, doctors);
      setApptResult(response.data || response);
    } catch (err) {
      console.error('Appointment helper failed:', err);
      setApptError(err.message || 'Appointment matching failed. Please try again.');
    } finally {
      setFindingAppt(false);
    }
  };

  // 3. Prescription explainer handler
  const handleExplainMedicine = async (medName) => {
    try {
      setSelectedMedicine(medName);
      setExplainingMed(true);
      setMedError('');
      setMedExplanation('');

      const defaultQuestion = 'Explain usage, minor and major side effects, and precautions in simple terms.';
      const response = await aiAPI.explainPrescription(medName, defaultQuestion);
      
      setMedExplanation(response.data || response.message || response.explanation || 'No explanation returned.');
    } catch (err) {
      console.error('Medicine explanation failed:', err);
      setMedError('Could not explain medication details.');
    } finally {
      setExplainingMed(false);
    }
  };

  // 4. General Chat handler
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const message = chatMessage;
    setChatMessage('');
    setChatHistory((prev) => [...prev, { role: 'user', content: message }]);
    setChatLoading(true);

    try {
      // Build a rich patient health context
      const chatContext = {
        patientName: profile?.user?.name || user?.name || 'Patient',
        allergies: profile?.medicalHistory?.allergies || profile?.allergies || [],
        currentMedications: activeMedicines,
        bloodGroup: profile?.bloodGroup || '—',
      };

      const response = await aiAPI.chat(message, chatContext);
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: response.data || response.message || response.reply || 'I am sorry, I am unable to answer that right now.' }
      ]);
    } catch (err) {
      console.error('Chat AI failed:', err);
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: 'An error occurred. Please try sending your question again.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <DashboardLayout title="Personal AI Assistant" subtitle="AI triaging, appointment routing, prescription guidance, and health chat">
      <div className="page" style={{ padding: '0px' }}>
        
        {/* Navigation Sidebar Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', minHeight: '70vh' }}>
          
          {/* AI Tab Menu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className={`btn w-full ${activeTab === 'symptoms' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
              onClick={() => setActiveTab('symptoms')}
            >
              🩺 Symptom Analyzer
            </button>
            <button
              className={`btn w-full ${activeTab === 'appointment' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
              onClick={() => setActiveTab('appointment')}
            >
              📅 Appointment Router
            </button>
            <button
              className={`btn w-full ${activeTab === 'prescription' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
              onClick={() => setActiveTab('prescription')}
            >
              💊 Medicine Guide
            </button>
            <button
              className={`btn w-full ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
              onClick={() => setActiveTab('chat')}
            >
              💬 General Health Chat
            </button>

            {/* Sidebar Context Card */}
            <div className="card" style={{ marginTop: 'auto', background: 'var(--bg-elevated)', padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>
                🧬 AI Health Context
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                <div>Name: <strong>{profile?.user?.name || user?.name || 'Loading...'}</strong></div>
                <div>Blood: <strong>{profile?.bloodGroup || '—'}</strong></div>
                <div>Allergies: <strong style={{ color: 'var(--danger)' }}>{(profile?.medicalHistory?.allergies || profile?.allergies || []).length || 'None'}</strong></div>
                <div>Meds: <strong>{activeMedicines.length} Active</strong></div>
              </div>
            </div>
          </div>

          {/* Right Panel Contents */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
            
            {/* 1. SYMPTOM ANALYZER */}
            {activeTab === 'symptoms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '4px' }}>🩺 AI Symptom Analyzer</h3>
                  <p className="text-xs text-muted">Input symptoms and obtain immediate clinical triaging recommendations</p>
                </div>

                {symptomError && (
                  <div className="alert-emergency">
                    <span>⚠️</span>
                    <span>{symptomError}</span>
                  </div>
                )}

                <form onSubmit={handleAnalyzeSymptoms} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Describe your symptoms in detail</label>
                    <textarea
                      className="form-textarea"
                      placeholder="E.g., I have had a throbbing pain in my forehead for 2 days, feeling dizzy and sensitive to bright light..."
                      value={symptomText}
                      onChange={(e) => setSymptomText(e.target.value)}
                      rows={4}
                      required
                      disabled={analyzingSymptoms}
                    />
                  </div>

                  <div className="form-group" style={{ maxWidth: '300px' }}>
                    <label className="form-label">Primary Body Area Affected</label>
                    <select
                      className="form-select"
                      value={selectedBodyPart}
                      onChange={(e) => setSelectedBodyPart(e.target.value)}
                      disabled={analyzingSymptoms}
                    >
                      <option value="Head">Head / Neck</option>
                      <option value="Chest">Chest / Heart</option>
                      <option value="Abdomen">Abdomen / Stomach</option>
                      <option value="Back">Back / Spine</option>
                      <option value="Limbs">Limbs (Arms/Legs/Joints)</option>
                      <option value="Skin">Skin / Rashes</option>
                      <option value="Other">Other / General Systemic</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ alignSelf: 'flex-start' }}
                    disabled={analyzingSymptoms || !symptomText.trim()}
                  >
                    {analyzingSymptoms ? '⏳ Analyzing Symptoms...' : '✨ Analyze Symptoms'}
                  </button>
                </form>

                {/* Analysis Results Display */}
                {symptomResult && (
                  <div style={{
                    marginTop: '16px',
                    padding: '20px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                      <strong style={{ color: 'var(--primary-light)', fontSize: '1.05rem' }}>📋 Triage Assessment</strong>
                      <span className={`badge ${
                        symptomResult.urgencyLevel === 'Low' ? 'badge-success' :
                        symptomResult.urgencyLevel === 'Moderate' ? 'badge-warning' :
                        symptomResult.urgencyLevel === 'High' ? 'badge-danger' : 'badge-emergency'
                      }`}>
                        Urgency: {symptomResult.urgencyLevel || 'Moderate'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Possible Conditions</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                          {symptomResult.possibleConditions?.map((cond, i) => (
                            <span key={i} className="badge badge-primary">{cond}</span>
                          )) || <span className="text-sm">General symptoms detected</span>}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recommended Department</span>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '4px', color: 'var(--secondary)' }}>
                          {symptomResult.recommendedDepartment || 'General Medicine'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Symptomatic Advice</span>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>
                        {symptomResult.advice}
                      </p>
                    </div>

                    {symptomResult.disclaimer && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                        ⚠️ {symptomResult.disclaimer}
                      </p>
                    )}

                    <button
                      className="btn btn-secondary"
                      style={{ alignSelf: 'flex-end', borderColor: 'var(--primary)', color: 'var(--primary-light)' }}
                      onClick={() => handleBookShortcut(symptomResult.recommendedDepartment)}
                    >
                      📅 Book Appointment in {symptomResult.recommendedDepartment || 'General Medicine'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. APPOINTMENT ROUTER */}
            {activeTab === 'appointment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '4px' }}>📅 AI Appointment Assistant</h3>
                  <p className="text-xs text-muted">Use natural queries to recommend matching specialists and check slot availability</p>
                </div>

                {apptError && (
                  <div className="alert-emergency">
                    <span>⚠️</span>
                    <span>{apptError}</span>
                  </div>
                )}

                <form onSubmit={handleAppointmentSearch} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    className="form-input"
                    placeholder="E.g., I need to book a cardiologist next Monday morning"
                    value={apptQuery}
                    onChange={(e) => setApptQuery(e.target.value)}
                    required
                    disabled={findingAppt}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={findingAppt || !apptQuery.trim()}
                  >
                    {findingAppt ? '⏳ Matching...' : 'Search'}
                  </button>
                </form>

                {apptResult && (
                  <div style={{
                    marginTop: '8px',
                    padding: '20px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recommended Specialist</span>
                      <h4 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                        👤 {apptResult.recommendedDoctor || 'Available Specialists'}
                      </h4>
                      <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                        Department: <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{apptResult.department || 'General Practitioner'}</span>
                      </div>
                    </div>

                    {apptResult.reasoning && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Match Rationale</span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {apptResult.reasoning}
                        </p>
                      </div>
                    )}

                    {apptResult.availableSlots && apptResult.availableSlots.length > 0 && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Suggested Time Slots</span>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {apptResult.availableSlots.map((slot, idx) => (
                            <span key={idx} className="badge badge-success" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                              ⏰ {slot}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                      💡 Use the <strong>Appointments</strong> section in the dashboard sidebar to make a formal booking request for these slots.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. PRESCRIPTION HELPER */}
            {activeTab === 'prescription' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '4px' }}>💊 AI Prescription Helper</h3>
                  <p className="text-xs text-muted">Select an active medication to receive clear descriptions of guidelines, side effects, and precautions</p>
                </div>

                {medError && (
                  <div className="alert-emergency">
                    <span>⚠️</span>
                    <span>{medError}</span>
                  </div>
                )}

                {activeMedicines.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 0' }}>
                    <div style={{ fontSize: '40px' }}>💊</div>
                    <div className="empty-state-title">No Active Medications</div>
                    <p className="text-xs text-muted" style={{ maxWidth: '280px', margin: '0 auto' }}>
                      No current medications or active prescriptions could be located in your history.
                    </p>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                      Your Current Medicines (Click to explain)
                    </span>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                      {activeMedicines.map((medName, idx) => (
                        <div
                          key={idx}
                          className="card"
                          style={{
                            padding: '12px 18px',
                            background: selectedMedicine === medName ? 'var(--gradient-primary)' : 'var(--bg-elevated)',
                            color: selectedMedicine === medName ? 'white' : 'var(--text-primary)',
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-md)',
                            border: selectedMedicine === medName ? 'none' : '1px solid var(--border)',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onClick={() => handleExplainMedicine(medName)}
                        >
                          💊 {medName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {explainingMed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px' }}>
                    <div className="loading-spinner"></div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Consulting AI Pharmacist regarding {selectedMedicine}...</span>
                  </div>
                )}

                {medExplanation && (
                  <div style={{
                    padding: '20px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--primary-light)', marginBottom: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                      🛡️ Clinical Explanations: {selectedMedicine}
                    </strong>
                    {medExplanation}
                  </div>
                )}
              </div>
            )}

            {/* 4. GENERAL AI CHAT */}
            {activeTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '4px' }}>💬 General Health AI Chat</h3>
                  <p className="text-xs text-muted">Chat with Gemini powered assistant initialized with your health conditions and medications</p>
                </div>

                {/* Messages Container */}
                <div style={{
                  flex: 1,
                  minHeight: '380px',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginTop: '16px',
                  marginBottom: '16px'
                }}>
                  {chatHistory.length === 0 && (
                    <div className="empty-state" style={{ padding: '60px 0' }}>
                      <div style={{ fontSize: '40px' }}>💬</div>
                      <div className="empty-state-title">Ask Health Questions</div>
                      <p className="text-xs text-muted" style={{ maxWidth: '300px', margin: '0 auto' }}>
                        Query information about general wellness, diets, vitamins, or clarification of health parameters.
                      </p>
                    </div>
                  )}

                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`ai-message ${msg.role === 'user' ? 'user' : 'bot'}`}
                      style={{
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%'
                      }}
                    >
                      {msg.content}
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="ai-typing" style={{ alignSelf: 'flex-start' }}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <input
                    className="form-input"
                    placeholder="Type your health-related question here..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    disabled={chatLoading}
                    required
                  />
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={chatLoading || !chatMessage.trim()}
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
