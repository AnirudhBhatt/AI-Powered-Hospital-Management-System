'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  patientAPI,
  appointmentAPI,
  prescriptionAPI,
  notificationAPI,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function StatCard({ icon, label, value, color, prefix }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '22' }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <div className="stat-value">
          {prefix}{value}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '—';
  return timeStr;
}

export default function PatientDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profRes, apptRes, rxRes, notifRes] = await Promise.allSettled([
          patientAPI.getMyProfile(),
          appointmentAPI.getAll('limit=10&sort=-date'),
          prescriptionAPI.getAll('limit=10'),
          notificationAPI.getAll('limit=5'),
        ]);
        if (profRes.status === 'fulfilled') setProfile(profRes.value.data);
        if (apptRes.status === 'fulfilled') setAppointments(apptRes.value.data || []);
        if (rxRes.status === 'fulfilled') setPrescriptions(rxRes.value.data || []);
        if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const upcomingAppts = appointments
    .filter(a => ['Requested', 'Confirmed'].includes(a.status))
    .slice(0, 3);

  const activePrescriptions = prescriptions.filter(p => p.status !== 'Cancelled').slice(0, 3);

  const pendingBills = 0; // placeholder; billing page will handle actual computation
  const totalRecords = (profile?.medicalHistory?.surgeries?.length || 0) +
    (profile?.medicalHistory?.allergies?.length || 0) +
    (profile?.medicalHistory?.currentMedications?.length || 0) +
    (profile?.medicalHistory?.previousDiseases?.length || 0);

  const displayName = profile?.name || user?.name || 'Patient';
  const patientId = profile?.patientId || '—';
  const bloodGroup = profile?.bloodGroup || '—';
  const insurance = profile?.insurance?.provider || '—';
  const allergies = profile?.medicalHistory?.allergies || [];
  const currentMeds = profile?.medicalHistory?.currentMedications || [];

  return (
    <DashboardLayout title="Patient Dashboard" subtitle="Your personal health overview">
      {/* Welcome Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #0ea5e9 100%)',
          border: 'none',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '40%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16, position: 'relative' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Welcome back 👋</div>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: 6 }}>
              {loading ? 'Loading...' : displayName}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem' }}>
              Your health is our priority. Stay on top of your care.
            </p>
          </div>
          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>Patient ID</div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{patientId}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>Blood Group</div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>{bloodGroup}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>Insurance</div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>{insurance}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: 24 }}>
        <StatCard icon="📅" label="Upcoming Appointments" value={upcomingAppts.length} color="#6366f1" />
        <StatCard icon="💊" label="Active Prescriptions" value={activePrescriptions.length} color="#10b981" />
        <StatCard icon="💰" label="Pending Bills" value={pendingBills.toLocaleString('en-IN')} prefix="₹" color="#f59e0b" />
        <StatCard icon="📁" label="Medical Records" value={totalRecords} color="#0ea5e9" />
      </div>

      <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
        {/* Upcoming Appointments */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📅 Upcoming Appointments</div>
              <div className="card-subtitle">Your next scheduled visits</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard/patient/appointments')}>
              View All →
            </button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />
              ))}
            </div>
          ) : upcomingAppts.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">No upcoming appointments</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => router.push('/dashboard/patient/appointments')}>
                Book Appointment
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingAppts.map(appt => (
                <div key={appt._id} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      Dr. {appt.doctorId?.user?.name || appt.doctorId?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                      {appt.department} · {formatDate(appt.date)} at {formatTime(appt.timeSlot)}
                    </div>
                  </div>
                  <span className={`badge ${getStatusBadge(appt.status)}`}>{appt.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Prescriptions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">💊 Active Prescriptions</div>
              <div className="card-subtitle">Your current medications</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard/patient/prescriptions')}>
              View All →
            </button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />
              ))}
            </div>
          ) : activePrescriptions.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-state-icon">💊</div>
              <div className="empty-state-title">No active prescriptions</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activePrescriptions.map(rx => (
                <div key={rx._id} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      Dr. {rx.doctorId?.user?.name || rx.doctorId?.name || 'Unknown'}
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Active</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(rx.medicines || []).slice(0, 3).map((med, i) => (
                      <span key={i} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        💊 {med.name}
                      </span>
                    ))}
                    {(rx.medicines || []).length > 3 && (
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>+{rx.medicines.length - 3} more</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
        {/* Recent Notifications */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🔔 Recent Notifications</div>
              <div className="card-subtitle">Your latest updates</div>
            </div>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-state-icon">🔕</div>
              <div className="empty-state-title">No notifications</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {notifications.map(n => (
                <div key={n._id} className={`notif-item${!n.isRead ? ' unread' : ''}`} style={{ paddingLeft: 12, paddingRight: 12, borderRadius: 8 }}>
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-message">{n.message}</div>
                  <div className="notif-item-time">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medical History Overview */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🩺 Medical History Overview</div>
              <div className="card-subtitle">Allergies & Current Medications</div>
            </div>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 120, borderRadius: 10 }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠️ Allergies</div>
                {allergies.length === 0 ? (
                  <span className="text-muted text-sm">No known allergies</span>
                ) : (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {allergies.map((a, i) => (
                      <span key={i} className="badge badge-danger" style={{ fontSize: '0.75rem' }}>{a}</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>💊 Current Medications</div>
                {currentMeds.length === 0 ? (
                  <span className="text-muted text-sm">No medications recorded</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {currentMeds.map((med, i) => (
                      <div key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--accent)' }}>•</span> {med.name} ({med.dosage})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">⚡ Quick Actions</div>
            <div className="card-subtitle">Common health tasks at your fingertips</div>
          </div>
        </div>
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard/patient/appointments')}>
            📅 Book Appointment
          </button>
          <button className="btn btn-secondary" onClick={() => router.push('/dashboard/patient/reports')}>
            📁 View Reports
          </button>
          <button className="btn btn-secondary" onClick={() => router.push('/dashboard/patient/billing')}>
            💰 Pay Bill
          </button>
          <button className="btn btn-secondary" onClick={() => router.push('/dashboard/patient/ai')}>
            🤖 AI Assistant
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
