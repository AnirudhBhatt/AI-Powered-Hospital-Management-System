'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { patientAPI, doctorAPI, userAPI, auditLogAPI } from '@/lib/api';

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '80%', height: 14 }} />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <td key={i}>
          <div className="skeleton" style={{ height: 14, width: '80%' }} />
        </td>
      ))}
    </tr>
  );
}

function StatCard({ icon, label, value, change, changeType, color }) {
  return (
    <div className="stat-card" style={{ '--accent-color': color }}>
      <div className="stat-icon" style={{ background: color + '22' }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {change && (
          <div className={`stat-change ${changeType}`}>
            {changeType === 'up' ? '▲' : '▼'} {change}
          </div>
        )}
      </div>
    </div>
  );
}

function getActionBadge(action) {
  const map = {
    CREATE: 'badge-success',
    UPDATE: 'badge-info',
    DELETE: 'badge-danger',
    LOGIN: 'badge-primary',
    LOGOUT: 'badge-secondary',
    VIEW: 'badge-secondary',
  };
  const key = action?.toUpperCase();
  return map[key] || 'badge-secondary';
}

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ patients: 0, doctors: 0, staff: 0 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pRes, dRes, uRes] = await Promise.allSettled([
          patientAPI.getAll('limit=1'),
          doctorAPI.getAll('limit=1'),
          userAPI.getAll('limit=100'),
        ]);

        const pTotal = pRes.status === 'fulfilled' ? (pRes.value.total || pRes.value.count || (pRes.value.data?.length) || 0) : 0;
        const dTotal = dRes.status === 'fulfilled' ? (dRes.value.total || dRes.value.count || (dRes.value.data?.length) || 0) : 0;
        const uData = uRes.status === 'fulfilled' ? (uRes.value.data || []) : [];
        const staffCount = uData.filter(u => u.role !== 'patient').length;

        setStats({ patients: pTotal, doctors: dTotal, staff: staffCount });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await auditLogAPI.getAll('limit=10&sort=-createdAt');
        setAuditLogs(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLogsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <DashboardLayout title="Super Admin Dashboard" subtitle="System Overview & Control">

      {/* Hospital Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #0ea5e9 100%)',
          border: 'none',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', top: -40, right: -40, width: 200, height: 200,
            borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: -60, left: '30%', width: 160, height: 160,
            borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
          }}
        />
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16, position: 'relative' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '1.6rem', marginBottom: 6 }}>
              🏥 Apollo Multi-Specialty Hospital
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
              Central Management System — Full Administrative Access
            </p>
          </div>
          <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.patients}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Patients</div>
            </div>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.doctors}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Doctors</div>
            </div>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.staff}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Staff</div>
            </div>
            <span className="badge" style={{ background: 'rgba(16,185,129,0.3)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.5)', fontSize: '0.85rem', padding: '6px 14px' }}>
              ● Online
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {loading ? (
          [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon="🏥" label="Total Patients" value={stats.patients.toLocaleString()} change="+12 this week" changeType="up" color="#6366f1" />
            <StatCard icon="👨‍⚕️" label="Total Doctors" value={stats.doctors.toLocaleString()} change="+2 this month" changeType="up" color="#0ea5e9" />
            <StatCard icon="👥" label="Active Staff" value={stats.staff.toLocaleString()} color="#10b981" />
            <StatCard icon="💚" label="System Health" value="99.9%" change="All systems operational" changeType="up" color="#10b981" />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">⚡ Quick Actions</div>
            <div className="card-subtitle">Common administrative tasks</div>
          </div>
        </div>
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary">
            ➕ Create Hospital Admin
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/dashboard/super-admin/audit-logs'}>
            📋 View All Logs
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/dashboard/super-admin/settings'}>
            ⚙️ System Settings
          </button>
          <button className="btn btn-secondary">
            📊 Generate Report
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">📋 Recent Audit Logs</div>
            <div className="card-subtitle">Latest system activity</div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => window.location.href = '/dashboard/super-admin/audit-logs'}
          >
            View All →
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logsLoading ? (
                [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-title">No audit logs found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                auditLogs.map((log, idx) => (
                  <tr key={log._id || idx}>
                    <td className="text-xs text-muted">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                    </td>
                    <td>
                      <div className="text-sm font-semibold">{log.userEmail || log.user?.email || '—'}</div>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        {log.userRole || log.user?.role || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getActionBadge(log.action)}`} style={{ fontSize: '0.7rem' }}>
                        {log.action || '—'}
                      </span>
                    </td>
                    <td className="text-sm">{log.resource || log.entity || '—'}</td>
                    <td>
                      <span className={`badge ${log.status === 'success' || log.statusCode < 400 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                        {log.status || (log.statusCode < 400 ? 'success' : 'error') || '—'}
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
