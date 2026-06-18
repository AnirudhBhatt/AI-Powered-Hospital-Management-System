'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { aiAPI, patientAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function DoctorAIPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [error, setError] = useState('');

  // Summarizer State
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [summarizeLoading, setSummarizeLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState('');

  // Prescription Assistant State
  const [symptomsInput, setSymptomsInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [suggestionsResult, setSuggestionsResult] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const res = await patientAPI.getAll();
      setPatients(res.data || []);
    } catch (e) {
      setError(e.message || 'Failed to fetch patients list');
    } finally {
      setLoadingPatients(false);
    }
  };

  // Filter patients dropdown
  const filteredPatients = patients.filter(p => {
    const name = p.name || p.user?.name || '';
    return name.toLowerCase().includes(patientSearch.toLowerCase());
  });

  const handlePatientChange = (e) => {
    const id = e.target.value;
    setSelectedPatientId(id);
    const pat = patients.find(p => p._id === id);
    setSelectedPatient(pat || null);
    setSummaryResult(''); // Reset previous summary
  };

  const handleSummarize = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first.');
      return;
    }

    try {
      setSummarizeLoading(true);
      setSummaryResult('');
      setError('');

      // Build records array from patient medical history
      const history = selectedPatient.medicalHistory || {};
      const records = [
        ...(history.previousDiseases || []),
        ...(history.currentMedications || []),
        ...(history.allergies || []),
      ];

      const res = await aiAPI.summarizeRecords(selectedPatient, records);
      setSummaryResult(res.data?.summary || res.summary || 'No medical records found to summarize.');
    } catch (e) {
      setSummaryResult('Failed to generate summary. The service might be temporarily unavailable.');
    } finally {
      setSummarizeLoading(false);
    }
  };

  const handleGetSuggestions = async (e) => {
    e.preventDefault();
    if (!symptomsInput.trim()) {
      alert('Please enter symptoms or a diagnosis.');
      return;
    }

    try {
      setAssistantLoading(true);
      setSuggestionsResult('');
      setError('');

      const doctorContext = `You are a clinical assistant advising a doctor. Recommending medicines, dosage, frequency, duration, and cautions. Output in clear markdown format. Symptoms/Diagnosis provided: ${symptomsInput}`;
      
      const res = await aiAPI.chat(symptomsInput, doctorContext);
      setSuggestionsResult(res.data?.reply || res.reply || res.data?.text || res.text || 'No suggestions returned.');
    } catch (e) {
      setSuggestionsResult('Failed to obtain treatment suggestions. Please try again later.');
    } finally {
      setAssistantLoading(false);
    }
  };

  // Safe and clean custom Markdown parser to display formatted headings, lists, and bold text
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, index) => {
      let content = line;
      
      // Parse bold text **bold**
      const boldRegex = /\*\*(.*?)\*\//g; // standard regex might fail on incomplete stars, let's do a basic loop or replace
      let parts = [];
      let currentStr = content;
      let boldMatch;
      
      // We will parse **text** safely
      const matches = [...currentStr.matchAll(/\*\*(.*?)\*\*/g)];
      if (matches.length > 0) {
        let lastIdx = 0;
        matches.forEach((m, mIdx) => {
          const startIdx = m.index;
          if (startIdx > lastIdx) {
            parts.push(currentStr.substring(lastIdx, startIdx));
          }
          parts.push(<strong key={mIdx} style={{ color: 'var(--primary-light)', fontWeight: '600' }}>{m[1]}</strong>);
          lastIdx = startIdx + m[0].length;
        });
        if (lastIdx < currentStr.length) {
          parts.push(currentStr.substring(lastIdx));
        }
      } else {
        parts.push(currentStr);
      }

      // Check for headings
      if (content.startsWith('### ')) {
        const hText = content.replace('### ', '');
        return <h4 key={index} style={{ color: 'var(--primary-light)', marginTop: '16px', marginBottom: '8px', fontSize: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>{hText}</h4>;
      }
      if (content.startsWith('## ')) {
        const hText = content.replace('## ', '');
        return <h3 key={index} style={{ color: 'var(--primary-light)', marginTop: '20px', marginBottom: '10px', fontSize: '1.15rem' }}>{hText}</h3>;
      }
      if (content.startsWith('# ')) {
        const hText = content.replace('# ', '');
        return <h2 key={index} style={{ color: 'var(--primary-light)', marginTop: '24px', marginBottom: '12px', fontSize: '1.3rem' }}>{hText}</h2>;
      }

      // Check for bullet points
      if (content.trim().startsWith('- ') || content.trim().startsWith('* ')) {
        // Strip bullet prefix
        const cleanParts = parts.map(p => {
          if (typeof p === 'string') {
            return p.replace(/^[\s-*]+/, '');
          }
          return p;
        });
        return (
          <li key={index} style={{ marginLeft: '16px', marginBottom: '6px', listStyleType: 'disc', fontSize: '0.875rem' }}>
            {cleanParts}
          </li>
        );
      }

      return (
        <p key={index} style={{ marginBottom: '8px', fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
          {parts}
        </p>
      );
    });
  };

  return (
    <DashboardLayout title="AI Clinical Assistant" subtitle="Leverage Gemini AI for patient history summaries and treatment suggestions">
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🤖 Doctor AI Center</h1>
            <p className="page-subtitle">Interactive AI tools for clinical decisions and summarization</p>
          </div>
        </div>

        {error && <div className="alert-emergency"><span>⚠️</span> {error}</div>}

        <div className="grid-2">
          
          {/* Module 1: Patient Record Summarizer */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
            <div className="card-header" style={{ margin: 0, paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📋</span> Patient History Summarizer
                </h3>
                <p className="card-subtitle">Generate a markdown clinical summary of the patient's medical history</p>
              </div>
            </div>

            {loadingPatients ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px' }}>
                <div className="loading-spinner" style={{ width: '24px', height: '24px' }}></div>
                <span className="text-sm text-muted">Loading patients...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Search and Select */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Search Patient</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by name..."
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    style={{ marginBottom: '8px' }}
                  />
                  <select
                    className="form-select"
                    value={selectedPatientId}
                    onChange={handlePatientChange}
                  >
                    <option value="">-- Select Patient --</option>
                    {filteredPatients.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name || p.user?.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPatient && (
                  <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: '600', color: 'var(--primary-light)', marginBottom: '4px' }}>Patient Info Preview:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div>Gender: {selectedPatient.gender || 'N/A'}</div>
                      <div>DOB: {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                      <div>Blood Group: {selectedPatient.bloodGroup || 'N/A'}</div>
                      <div>Allergies Count: {selectedPatient.medicalHistory?.allergies?.length || 0}</div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-primary w-full"
                  onClick={handleSummarize}
                  disabled={summarizeLoading || !selectedPatientId}
                  style={{ justifyContent: 'center' }}
                >
                  {summarizeLoading ? 'Generating Summary...' : '🤖 Summarize History'}
                </button>
              </div>
            )}

            {/* Summarizer Result Card */}
            {(summarizeLoading || summaryResult) && (
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--primary-light)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✨</span> Summary Result
                </h4>
                
                {summarizeLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', gap: '8px' }}>
                    <div className="loading-spinner"></div>
                    <span className="text-xs text-muted">Analyzing medical documents...</span>
                  </div>
                ) : (
                  <div className="card" style={{ background: 'var(--bg-elevated)', padding: '16px', overflowY: 'auto', maxHeight: '400px' }}>
                    {renderMarkdown(summaryResult)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Module 2: AI Prescription Assistant */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
            <div className="card-header" style={{ margin: 0, paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💊</span> AI Prescription Assistant
                </h3>
                <p className="card-subtitle">Get recommendations on medicines, dosage, and cautions based on symptoms</p>
              </div>
            </div>

            <form onSubmit={handleGetSuggestions} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Symptoms / Diagnosis Input</label>
                <textarea
                  className="form-textarea"
                  placeholder="e.g. Patient is presenting with a persistent wet cough, mild chest congestion, and a low-grade fever for 3 days. Or type diagnosis like 'Acute Bronchitis'."
                  value={symptomsInput}
                  onChange={e => setSymptomsInput(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={assistantLoading}
                style={{ justifyContent: 'center' }}
              >
                {assistantLoading ? 'Analyzing & Fetching Suggestions...' : '🤖 Get AI Treatment Suggestions'}
              </button>
            </form>

            {/* Suggestions Result Card */}
            {(assistantLoading || suggestionsResult) && (
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--primary-light)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✨</span> AI Treatment Recommendations
                </h4>
                
                {assistantLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', gap: '8px' }}>
                    <div className="loading-spinner"></div>
                    <span className="text-xs text-muted">Consulting clinical guidelines...</span>
                  </div>
                ) : (
                  <div className="card" style={{ background: 'var(--bg-elevated)', padding: '16px', overflowY: 'auto', maxHeight: '400px' }}>
                    {renderMarkdown(suggestionsResult)}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
