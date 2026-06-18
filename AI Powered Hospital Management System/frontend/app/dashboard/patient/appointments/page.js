'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  appointmentAPI,
  doctorAPI,
  aiAPI,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const DEPARTMENTS = [
  { label: 'Cardiology', icon: '❤️' },
  { label: 'Neurology', icon: '🧠' },
  { label: 'Orthopedics', icon: '🦴' },
  { label: 'General Medicine', icon: '🩺' },
  { label: 'Pediatrics', icon: '👶' },
  { label: 'Dermatology', icon: '🥷' },
];

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM',
];

const STATUS_TABS = ['All', 'Requested', 'Confirmed', 'Completed', 'Cancelled'];

function getStatusBadge(status) {
  const map = {
    Requested: 'badge-warning',
    Confirmed: 'badge-info',
    'In Consultation': 'badge-primary',
    Completed: 'badge-success',
    Cancelled: 'badge-danger',
  };
  return map[status] || 'badge-secondary';
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [showBookModal, setShowBookModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(null);

  // Book modal state
  const [form, setForm] = useState({
    department: '',
    doctorId: '',
    date: '',
    timeSlot: '',
    symptoms: '',
  });
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState('');
  const [bookSuccess, setBookSuccess] = useState(false);

  // AI Symptom Analyzer
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentAPI.getAll('sort=-date');
      setAppointments(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    doctorAPI.getAll('limit=200').then(res => setDoctors(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.department) {
      const filtered = doctors.filter(d =>
        d.specialization?.toLowerCase().includes(form.department.toLowerCase()) ||
        d.department?.toLowerCase().includes(form.department.toLowerCase())
      );
      setFilteredDoctors(filtered);
      setForm(f => ({ ...f, doctorId: '' }));
    } else {
      setFilteredDoctors(doctors);
    }
  }, [form.department, doctors]);

  const filtered = activeTab === 'All'
    ? appointments
    : appointments.filter(a => a.status === activeTab);

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelLoading(id);
    try {
      await appointmentAPI.updateStatus(id, { status: 'Cancelled' });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'Cancelled' } : a));
    } catch (e) {
      alert(e.message || 'Failed to cancel appointment');
    } finally {
      setCancelLoading(null);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.department || !form.doctorId || !form.date || !form.timeSlot) {
      setBookError('Please fill all required fields.');
      return;
    }
    setBookLoading(true);
    setBookError('');
    try {
      await appointmentAPI.create({
        doctor: form.doctorId,
        department: form.department,
        date: form.date,
        timeSlot: form.timeSlot,
        symptoms: form.symptoms,
      });
      setBookSuccess(true);
      setTimeout(() => {
        setBookSuccess(false);
        setShowBookModal(false);
        setForm({ department: '', doctorId: '', date: '', timeSlot: '', symptoms: '' });
        setAiResult(null);
        fetchAppointments();
      }, 1500);
    } catch (e) {
      setBookError(e.message || 'Failed to book appointment.');
    } finally {
      setBookLoading(false);
    }
  };

  const handleAnalyzeSymptoms = async () => {
    if (!form.symptoms.trim()) {
      setAiError('Please describe your symptoms first.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    try {
      const res = await aiAPI.analyzeSymptoms(form.symptoms);
      setAiResult(res.data || res);
    } catch (e) {
      setAiError(e.message || 'AI analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  function getUrgencyColor(urgency) {
    const u = (urgency || '').toLowerCase();
    if (u === 'low') return { color: '#34d399', bg: 'rgba(16,185,129,0.15)' };
    if (u === 'moderate') return { color: '#fbbf24', bg: 'rgba(245,158,11,0.15)' };
    if (u === 'high') return { color: '#fb923c', bg: 'rgba(249,115,22,0.15)' };
    if (u === 'emergency') return { color: '#f87171', bg: 'rgba(239,68,68,0.2)' };
    return { color: 'var(--text-secondary)', bg: 'var(--bg-elevated)' };
  }

  return (
    <DashboardLayout title="My Appointments" subtitle="Manage & track your appointments">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">📅 My Appointments</h2>
          <p className="page-subtitle">View all your scheduled and past appointments</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowBookModal(true); setBookError(''); setBookSuccess(false); setAiResult(null); }}>
          + Book Appointment
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="filters-bar">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab !== 'All' && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>
                ({appointments.filter(a => a.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Appointments Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Symptoms</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
                      <td key={j}><div className="skeleton" style={{ height: 14, width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📅</div>
                      <div className="empty-state-title">No appointments found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(appt => (
                  <tr key={appt._id}>
                    <td className="text-xs text-muted">#{appt._id?.slice(-6)}</td>
                    <td>
                      <div className="font-semibold text-sm">
                        Dr. {appt.doctorId?.user?.name || appt.doctorId?.name || '—'}
                      </div>
                    </td>
                    <td className="text-sm">{appt.department || '—'}</td>
                    <td className="text-sm">{formatDate(appt.date)}</td>
                    <td className="text-sm">{appt.timeSlot || '—'}</td>
                    <td><span className={`badge ${getStatusBadge(appt.status)}`}>{appt.status}</span></td>
                    <td className="text-sm" style={{ maxWidth: 160 }}>
                      <span className="truncate" style={{ display: 'block' }}>{appt.symptoms || '—'}</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => { setSelectedAppt(appt); setShowDetailModal(true); }}
                        >
                          View
                        </button>
                        {['Requested', 'Confirmed'].includes(appt.status) && (
                          <button
                            className="btn btn-danger btn-xs"
                            disabled={cancelLoading === appt._id}
                            onClick={() => handleCancel(appt._id)}
                          >
                            {cancelLoading === appt._id ? '...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowBookModal(false); }}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3 className="modal-title">📅 Book New Appointment</h3>
              <button className="modal-close" onClick={() => setShowBookModal(false)}>✕</button>
            </div>

            {bookSuccess ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h3 style={{ color: 'var(--accent)', marginBottom: 8 }}>Appointment Booked!</h3>
                <p className="text-muted">Your appointment request has been submitted.</p>
              </div>
            ) : (
              <form onSubmit={handleBook}>
                {/* Department Selection */}
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {DEPARTMENTS.map(dept => (
                      <button
                        key={dept.label}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, department: dept.label }))}
                        style={{
                          padding: '12px 10px',
                          borderRadius: 10,
                          border: `2px solid ${form.department === dept.label ? 'var(--primary)' : 'var(--border)'}`,
                          background: form.department === dept.label ? 'rgba(99,102,241,0.15)' : 'var(--bg-elevated)',
                          color: form.department === dept.label ? 'var(--primary-light)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{dept.icon}</div>
                        {dept.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Doctor Selection */}
                <div className="form-group">
                  <label className="form-label">Doctor *</label>
                  <select
                    className="form-select"
                    value={form.doctorId}
                    onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
                    required
                  >
                    <option value="">Select a doctor</option>
                    {(form.department ? filteredDoctors : doctors).map(doc => (
                      <option key={doc._id} value={doc._id}>
                        Dr. {doc.user?.name || doc.name} — {doc.specialization || doc.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid">
                  {/* Date Picker */}
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.date}
                      min={getTodayDate()}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Time Slot Grid */}
                <div className="form-group">
                  <label className="form-label">Time Slot *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, timeSlot: slot }))}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: `1.5px solid ${form.timeSlot === slot ? 'var(--primary)' : 'var(--border)'}`,
                          background: form.timeSlot === slot ? 'rgba(99,102,241,0.2)' : 'var(--bg-elevated)',
                          color: form.timeSlot === slot ? 'var(--primary-light)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          transition: 'all 0.15s',
                        }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symptoms */}
                <div className="form-group">
                  <label className="form-label">Symptoms / Reason for Visit</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe your symptoms or reason for the visit..."
                    value={form.symptoms}
                    onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
                    style={{ minHeight: 80 }}
                  />
                </div>

                {/* AI Symptom Analyzer */}
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '16px', marginBottom: 16, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>🤖 AI Symptom Analyzer</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Let AI suggest the best department based on your symptoms</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAnalyzeSymptoms}
                      disabled={aiLoading || !form.symptoms.trim()}
                    >
                      {aiLoading ? '⏳ Analyzing...' : '✨ Analyze my symptoms'}
                    </button>
                  </div>
                  {aiError && <div className="form-error">{aiError}</div>}
                  {aiResult && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Suggested Department:</span>
                        <span className="badge badge-primary">{aiResult.recommendedDepartment || aiResult.department || '—'}</span>
                        <button
                          type="button"
                          className="btn btn-xs btn-secondary"
                          onClick={() => setForm(f => ({ ...f, department: aiResult.recommendedDepartment || aiResult.department || f.department }))}
                        >
                          Use This
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Urgency:</span>
                        {(() => {
                          const uc = getUrgencyColor(aiResult.urgencyLevel || aiResult.urgency);
                          return (
                            <span style={{ background: uc.bg, color: uc.color, padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>
                              {aiResult.urgencyLevel || aiResult.urgency || '—'}
                            </span>
                          );
                        })()}
                      </div>
                      {aiResult.advice && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '10px 12px', borderRadius: 8, marginTop: 4 }}>
                          {aiResult.advice}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {bookError && <div className="form-error" style={{ marginBottom: 12 }}>{bookError}</div>}

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowBookModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={bookLoading}>
                    {bookLoading ? '⏳ Booking...' : '✅ Confirm Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {showDetailModal && selectedAppt && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowDetailModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">📋 Appointment Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="flex justify-between">
                <span className="text-muted text-sm">Appointment ID</span>
                <span className="font-semibold text-sm">#{selectedAppt._id?.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted text-sm">Doctor</span>
                <span className="font-semibold text-sm">Dr. {selectedAppt.doctorId?.user?.name || selectedAppt.doctorId?.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted text-sm">Department</span>
                <span className="text-sm">{selectedAppt.department || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted text-sm">Date</span>
                <span className="text-sm">{formatDate(selectedAppt.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted text-sm">Time Slot</span>
                <span className="text-sm">{selectedAppt.timeSlot || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted text-sm">Status</span>
                <span className={`badge ${getStatusBadge(selectedAppt.status)}`}>{selectedAppt.status}</span>
              </div>
              {selectedAppt.symptoms && (
                <div>
                  <div className="text-muted text-sm" style={{ marginBottom: 6 }}>Symptoms</div>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {selectedAppt.symptoms}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
