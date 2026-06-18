'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { dashboardAPI, appointmentAPI, emergencyAPI } from '@/lib/api';
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

/* ── helpers ───────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, color, gradient }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}22` }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <div className="stat-value" style={{ color: gradient ? color : undefined }}>{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="text-xs text-muted" style={{ marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: '55%', height: 28, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '75%', height: 14 }} />
      </div>
    </div>
  );
}

const chartTooltipStyle = {
  contentStyle: { background: '#1e2a4a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, color: '#f1f5f9', fontSize: 13 },
  labelStyle: { color: '#94a3b8' },
};

/* ── fallback mock data when backend returns nothing ────── */
const MOCK_REVENUE = [
  { month: 'Jan', revenue: 420000 }, { month: 'Feb', revenue: 580000 },
  { month: 'Mar', revenue: 510000 }, { month: 'Apr', revenue: 690000 },
  { month: 'May', revenue: 750000 }, { month: 'Jun', revenue: 820000 },
];
const MOCK_DEPT = [
  { dept: 'Cardiology', patients: 142 }, { dept: 'Ortho', patients: 98 },
  { dept: 'Neuro', patients: 76 }, { dept: 'Peds', patients: 115 },
  { dept: 'Onco', patients: 54 }, { dept: 'Gyno', patients: 89 },
];
const MOCK_PATIENT_TREND = [
  { day: 'Mon', count: 48 }, { day: 'Tue', count: 62 }, { day: 'Wed', count: 55 },
  { day: 'Thu', count: 71 }, { day: 'Fri', count: 83 }, { day: 'Sat', count: 39 }, { day: 'Sun', count: 27 },
];

function getApptBadge(status) {
  const map = {
    requested: 'badge-warning',
    confirmed: 'badge-info',
    'in-consultation': 'badge-primary',
    completed: 'badge-success',
    cancelled: 'badge-danger',
  };
  return map[status] || 'badge-secondary';
}

/* ── main component ─────────────────────────────────────── */
export default function AdminDashboard() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [emergencies, setEmergencies] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardAPI.getStats();
        setStatsData(res.data || res);
      } catch (e) {
        console.error('Dashboard stats error:', e);
      } finally {
        setLoading(false);
      }
    };

    const fetchAppointments = async () => {
      try {
        const res = await appointmentAPI.getAll('limit=8&sort=-createdAt');
        setAppointments(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setApptLoading(false);
      }
    };

    const fetchEmergencies = async () => {
      try {
        const res = await emergencyAPI.getAll();
        const active = (res.data || []).filter(e => e.status !== 'resolved');
        setEmergencies(active);
      } catch (e) {}
    };

    fetchDashboard();
    fetchAppointments();
    fetchEmergencies();
  }, []);

  /* derived data */
  const s = statsData || {};
  const revenueTrend = s.revenueTrend || MOCK_REVENUE;
  const deptStats = s.deptStats || MOCK_DEPT;
  const patientTrend = s.patientTrend || MOCK_PATIENT_TREND;

  const formatCurrency = (v) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v}`;
  };

  return (
    <DashboardLayout title="Hospital Admin Dashboard" subtitle="Operations & Analytics Overview">

      {/* Emergency Alert Banner */}
      {emergencies.length > 0 && (
        <div className="alert-emergency">
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <div className="font-semibold" style={{ color: '#fca5a5' }}>
              {emergencies.length} Active Emergency Case{emergencies.length > 1 ? 's' : ''}
            </div>
            <div className="text-sm text-muted">
              {emergencies.map(e => e.patientName || e.chief_complaint || 'Emergency').join(' • ')}
            </div>
          </div>
          <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }}>
            View Emergencies
          </button>
        </div>
      )}

      {/* Stats Grid — 8 cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', marginBottom: 24 }}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon="🏥" label="Daily Patients" value={s.dailyPatients ?? s.todayPatients ?? '—'} sub="Registered today" color="#6366f1" />
            <StatCard icon="💰" label="Monthly Revenue" value={formatCurrency(s.monthlyRevenue ?? 0)} sub="This month" color="#10b981" />
            <StatCard icon="👨‍⚕️" label="Total Doctors" value={s.totalDoctors ?? '—'} color="#0ea5e9" />
            <StatCard icon="🛏️" label="Bed Occupancy" value={`${s.bedOccupancy ?? s.occupancyRate ?? 0}%`} sub={`${s.occupiedBeds ?? '?'} / ${s.totalBeds ?? '?'} beds`} color="#8b5cf6" />
            <StatCard icon="🔬" label="Pending Lab Tests" value={s.pendingLabTests ?? '—'} color="#f59e0b" />
            <StatCard icon="💊" label="Low Stock Medicines" value={s.lowStockMedicines ?? s.lowStock ?? '—'} sub="Need reorder" color="#ef4444" />
            <StatCard icon="📅" label="Today's Appointments" value={s.todayAppointments ?? '—'} color="#0ea5e9" />
            <StatCard icon="🚨" label="Active Emergencies" value={emergencies.length} color={emergencies.length > 0 ? '#ef4444' : '#10b981'} />
          </>
        )}
      </div>

      {/* Charts Row 1: Revenue + Dept */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Revenue Area Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">💰 Revenue Trend</div>
              <div className="card-subtitle">Monthly revenue performance</div>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipStyle} formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorRevenue)" dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Performance Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🏥 Department Performance</div>
              <div className="card-subtitle">Patient volume by department</div>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptStats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.1)" vertical={false} />
                <XAxis dataKey="dept" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipStyle} formatter={v => [v, 'Patients']} />
                <Bar dataKey="patients" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Patient Volume Line Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">📈 Patient Volume (This Week)</div>
            <div className="card-subtitle">Daily patient registration trend</div>
          </div>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={patientTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.1)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTooltipStyle} formatter={v => [v, 'Patients']} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Appointments Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">📅 Recent Appointments</div>
            <div className="card-subtitle">Latest scheduled appointments</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = '/dashboard/admin/appointments'}>
            View All →
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {apptLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6].map(j => (
                      <td key={j}><div className="skeleton" style={{ height: 14, width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📅</div>
                      <div className="empty-state-title">No appointments found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((appt, idx) => (
                  <tr key={appt._id || idx}>
                    <td>
                      <div className="font-semibold text-sm">{appt.patientId?.name || appt.patientName || '—'}</div>
                      <div className="text-xs text-muted">{appt.patientId?.email || ''}</div>
                    </td>
                    <td>
                      <div className="text-sm">{appt.doctorId?.name || appt.doctorName || '—'}</div>
                    </td>
                    <td className="text-sm text-muted">{appt.department || appt.doctorId?.specialization || '—'}</td>
                    <td className="text-xs" style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                      {appt.scheduledDate ? new Date(appt.scheduledDate).toLocaleString() : appt.date || '—'}
                    </td>
                    <td>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                        {appt.type || 'General'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getApptBadge(appt.status)}`} style={{ fontSize: '0.7rem' }}>
                        {appt.status || '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
