'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { dashboardAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StarRating({ rating }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ color: s <= Math.round(rating || 0) ? '#f59e0b' : '#334155', fontSize: '18px' }}>★</span>
      ))}
      <span className="text-muted text-sm" style={{ marginLeft: '6px' }}>({(rating || 0).toFixed(1)})</span>
    </span>
  );
}

export default function DoctorDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardAPI.getDoctorStats()
      .then(res => setStats(res.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const doctorName = profile?.name || user?.name || 'Doctor';
  const todayAppts = stats?.todayAppointments || [];

  const QUICK_ACTIONS = [
    { label: 'New Prescription', icon: '💊', href: '/dashboard/doctor/prescriptions', color: '#6366f1' },
    { label: 'Order Lab Test', icon: '🔬', href: '/dashboard/doctor/lab-orders', color: '#0ea5e9' },
    { label: 'View Medical Records', icon: '📋', href: '/dashboard/doctor/records', color: '#10b981' },
    { label: 'AI Summarizer', icon: '🤖', href: '/dashboard/doctor/ai', color: '#8b5cf6' },
  ];

  return (
    <DashboardLayout title="Doctor Dashboard" subtitle="Your clinical overview">
      {loading ? (
        <div className="page"><div className="loading-spinner" /></div>
      ) : error ? (
        <div className="page"><div className="alert-emergency">{error}</div></div>
      ) : (
        <div className="page">
          {/* Welcome Card */}
          <div className="card" style={{ background: 'var(--gradient-primary)', border: 'none', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ color: 'white', marginBottom: '6px' }}>
                  {getGreeting()}, Dr. {doctorName} 👋
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div style={{ fontSize: '64px' }}>🩺</div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>📅</div>
              <div>
                <div className="stat-value">{todayAppts.length}</div>
                <div className="stat-label">Today's Appointments</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(14,165,233,0.15)' }}>👥</div>
              <div>
                <div className="stat-value">{stats?.totalUniquePatients ?? 0}</div>
                <div className="stat-label">Total Patients</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>⭐</div>
              <div>
                <div className="stat-value">
                  <StarRating rating={stats?.doctor?.rating ?? 4.5} />
                </div>
                <div className="stat-label">Patient Rating</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>🔬</div>
              <div>
                <div className="stat-value">{stats?.pendingTests ?? 0}</div>
                <div className="stat-label">Pending Lab Reports</div>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ gap: '20px' }}>
            {/* Today's Schedule */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">📅 Today's Schedule</div>
                  <div className="card-subtitle">{todayAppts.length} appointment{todayAppts.length !== 1 ? 's' : ''} today</div>
                </div>
                <Link href="/dashboard/doctor/appointments" className="btn btn-secondary btn-sm">View All</Link>
              </div>
              {todayAppts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <div className="empty-state-title">No appointments today</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {todayAppts.slice(0, 6).map((appt, i) => (
                    <div key={appt._id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '14px', flexShrink: 0 }}>
                        {(appt.patientId?.name || 'P')[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="font-semibold text-sm">{appt.patientId?.name || 'Patient'}</div>
                        <div className="text-xs text-muted">{appt.timeSlot || appt.time || 'TBD'} · {appt.department || ''}</div>
                      </div>
                      <span className={`badge ${appt.status === 'Completed' ? 'badge-success' : appt.status === 'Cancelled' ? 'badge-danger' : 'badge-primary'}`}>
                        {appt.status || 'Scheduled'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">⚡ Quick Actions</div>
              </div>
              <div className="grid-2">
                {QUICK_ACTIONS.map(action => (
                  <Link key={action.href} href={action.href}>
                    <div className="card" style={{ textAlign: 'center', cursor: 'pointer', padding: '20px 12px', border: `1px solid ${action.color}30` }}>
                      <div style={{ fontSize: '36px', marginBottom: '10px' }}>{action.icon}</div>
                      <div className="font-semibold text-sm">{action.label}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
