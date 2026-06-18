'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { userAPI } from '@/lib/api';

const STAFF_ROLES = [
  { value: 'nurse', label: 'Nurse', icon: '🩺' },
  { value: 'receptionist', label: 'Receptionist', icon: '🛎️' },
  { value: 'pharmacist', label: 'Pharmacist', icon: '💊' },
  { value: 'lab_technician', label: 'Lab Technician', icon: '🔬' },
  { value: 'billing_executive', label: 'Billing Executive', icon: '💳' },
];

const DEPARTMENTS = [
  'Emergency',
  'ICU',
  'Outpatient (OPD)',
  'Pharmacy',
  'Laboratory',
  'Billing & Finance',
  'Reception/Front Desk',
  'Cardiology',
  'Neurology',
  'General Medicine',
];

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'nurse',
  department: 'Emergency',
};

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i}>
          <div className="skeleton" style={{ height: 16, width: '80%' }} />
        </td>
      ))}
    </tr>
  );
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch users with a high limit to ensure we get all staff
      const res = await userAPI.getAll('limit=200');
      const allUsers = res.data || [];
      
      // Filter users to only include staff roles
      const staffOnly = allUsers.filter(u =>
        STAFF_ROLES.some(role => role.value === u.role)
      );
      setStaff(staffOnly);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch staff members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await userAPI.create({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department,
      });

      setSuccess(`Staff member "${form.name}" added successfully!`);
      setForm(EMPTY_FORM);
      setShowModal(false);
      fetchStaff();
    } catch (e) {
      setError(e.message || 'Failed to add staff member. Email might already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId, userName) => {
    setError('');
    setSuccess('');
    try {
      await userAPI.toggle(userId);
      setSuccess(`Status toggled for "${userName}" successfully.`);
      fetchStaff();
    } catch (e) {
      setError(e.message || `Failed to toggle status for ${userName}.`);
    }
  };

  // Filter staff based on search query and role filter
  const filteredStaff = staff.filter(member => {
    const name = (member.name || '').toLowerCase();
    const email = (member.email || '').toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch = name.includes(query) || email.includes(query);
    const matchesRole = roleFilter ? member.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const getRoleLabel = roleValue => {
    const r = STAFF_ROLES.find(item => item.value === roleValue);
    return r ? `${r.icon} ${r.label}` : roleValue;
  };

  const formatLastLogin = dateStr => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout title="Staff Management" subtitle="Manage hospital staff, accounts, roles, and status">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">👩‍💼 Hospital Staff</h1>
          <p className="page-subtitle">
            {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowModal(true);
            setError('');
            setSuccess('');
          }}
        >
          ➕ Add Staff Member
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div
          className="alert-emergency"
          style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)', marginBottom: 16 }}
        >
          <span>✅</span>
          <span className="text-sm">{success}</span>
        </div>
      )}

      {error && !showModal && (
        <div
          className="alert-emergency"
          style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)', marginBottom: 16 }}
        >
          <span>⚠️</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 180 }}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">All Staff Roles</option>
          {STAFF_ROLES.map(role => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>

        {(search || roleFilter) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearch('');
              setRoleFilter('');
            }}
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* Staff Table Card */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <div className="empty-state-title">No staff members found</div>
                      <p className="text-sm text-muted">Try adjusting your filters or add a new staff member.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member, index) => (
                  <tr key={member._id || member.id || index}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="sidebar-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {(member.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="font-semibold text-sm">{member.name || '—'}</div>
                      </div>
                    </td>
                    <td className="text-sm text-muted">{member.email}</td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                        {getRoleLabel(member.role)}
                      </span>
                    </td>
                    <td className="text-sm">{member.department || '—'}</td>
                    <td>
                      <span
                        className={`badge ${member.isActive !== false ? 'badge-success' : 'badge-danger'}`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {member.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-sm text-muted">{formatLastLogin(member.lastLogin)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={`btn btn-xs ${member.isActive !== false ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleStatus(member._id || member.id, member.name)}
                      >
                        {member.isActive !== false ? '🔒 Deactivate' : '🔓 Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Add New Staff Member</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="form-error" style={{ marginBottom: 16, fontSize: '0.8rem' }}>
                  ⚠️ {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  name="name"
                  className="form-input"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    name="email"
                    type="email"
                    className="form-input"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="john.doe@hospital.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    name="password"
                    type="password"
                    className="form-input"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="Min 6 characters"
                    minLength={6}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    name="role"
                    className="form-select"
                    value={form.role}
                    onChange={handleChange}
                    required
                  >
                    {STAFF_ROLES.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select
                    name="department"
                    className="form-select"
                    value={form.department}
                    onChange={handleChange}
                    required
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? '⏳ Adding…' : '✅ Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
