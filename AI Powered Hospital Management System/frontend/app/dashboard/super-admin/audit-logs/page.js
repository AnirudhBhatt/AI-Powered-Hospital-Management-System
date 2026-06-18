'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { auditLogAPI } from '@/lib/api';

const ACTION_OPTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW'];

function getActionBadge(action) {
  const map = {
    CREATE: 'badge-success',
    UPDATE: 'badge-info',
    DELETE: 'badge-danger',
    LOGIN: 'badge-primary',
    LOGOUT: 'badge-secondary',
    VIEW: 'badge-secondary',
  };
  return map[action?.toUpperCase()] || 'badge-secondary';
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6, 7].map(i => (
        <td key={i}>
          <div className="skeleton" style={{ height: 14, width: '80%' }} />
        </td>
      ))}
    </tr>
  );
}

const PAGE_SIZE = 15;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        sort: '-createdAt',
      });
      if (actionFilter) params.set('action', actionFilter);
      if (resourceSearch) params.set('resource', resourceSearch);

      const res = await auditLogAPI.getAll(params.toString());
      setLogs(res.data || []);
      setTotal(res.total || res.count || (res.data?.length) || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, resourceSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [actionFilter, resourceSearch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <DashboardLayout title="Audit Logs" subtitle="Complete system activity trail">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Audit Logs</h1>
          <p className="page-subtitle">Track all system activity across users and roles</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchLogs}>
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-bar" style={{ minWidth: 220 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search resource..."
            value={resourceSearch}
            onChange={e => setResourceSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 160 }}
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
        >
          <option value="">All Actions</option>
          {ACTION_OPTIONS.filter(Boolean).map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {(actionFilter || resourceSearch) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setActionFilter(''); setResourceSearch(''); }}
          >
            ✕ Clear Filters
          </button>
        )}

        <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>
          {total} total records
        </span>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Timestamp</th>
                <th>User Email</th>
                <th>Role</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🔍</div>
                      <div className="empty-state-title">No audit logs match your filters</div>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log._id || idx}>
                    <td className="text-muted text-xs">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="text-xs" style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                    </td>
                    <td>
                      <div className="text-sm font-semibold">{log.userEmail || log.user?.email || '—'}</div>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        {(log.userRole || log.user?.role || '—').replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getActionBadge(log.action)}`} style={{ fontSize: '0.7rem' }}>
                        {log.action || '—'}
                      </span>
                    </td>
                    <td className="text-sm">
                      {log.resource || log.entity || '—'}
                      {log.resourceId && (
                        <div className="text-xs text-muted">ID: {log.resourceId}</div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          log.status === 'success' || (log.statusCode && log.statusCode < 400)
                            ? 'badge-success'
                            : 'badge-danger'
                        }`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {log.status || (log.statusCode ? (log.statusCode < 400 ? 'success' : 'error') : '—')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between" style={{ marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
            <div className="text-sm text-muted">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
