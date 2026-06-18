'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { doctorAPI, userAPI, authAPI } from '@/lib/api';

/* ── Star Rating ──────────────────────────────────────── */
function Stars({ rating }) {
  const r = Math.round(rating || 0);
  return (
    <span style={{ color: '#fbbf24', fontSize: '0.85rem', letterSpacing: 1 }}>
      {'★'.repeat(r)}{'☆'.repeat(5 - r)}
      <span className="text-muted" style={{ fontSize: '0.75rem', marginLeft: 4 }}>
        {rating ? rating.toFixed(1) : '—'}
      </span>
    </span>
  );
}

/* ── Skeleton row ─────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i}><div className="skeleton" style={{ height: 14, width: '80%' }} /></td>
      ))}
    </tr>
  );
}

const SPECIALIZATIONS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology',
  'Gynecology', 'Dermatology', 'Psychiatry', 'Radiology', 'General Surgery',
  'Internal Medicine', 'ENT', 'Ophthalmology', 'Urology', 'Gastroenterology',
];

const DEPARTMENTS = [
  'Emergency', 'OPD', 'ICU', 'Surgery', 'Cardiology', 'Neurology',
  'Orthopedics', 'Pediatrics', 'Oncology', 'Gynecology', 'Radiology',
];

const EMPTY_FORM = {
  // user fields
  name: '', email: '', password: '', phone: '',
  // doctor fields
  specialization: '', department: '', experience: '', consultationFee: '',
  qualifications: '', bio: '',
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (specFilter) params.set('specialization', specFilter);
      if (search) params.set('search', search);
      const res = await doctorAPI.getAll(params.toString());
      setDoctors(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, specFilter]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      // 1) Create user account
      const userRes = await userAPI.create({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: 'doctor',
      });
      const userId = userRes.data?._id || userRes.data?.id;

      // 2) Create doctor profile
      await doctorAPI.create({
        userId,
        specialization: form.specialization,
        department: form.department,
        experience: Number(form.experience),
        consultationFee: Number(form.consultationFee),
        qualifications: form.qualifications ? form.qualifications.split(',').map(s => s.trim()) : [],
        bio: form.bio,
      });

      setSuccess('Doctor added successfully!');
      setForm(EMPTY_FORM);
      setShowModal(false);
      fetchDoctors();
    } catch (e) {
      setError(e.message || 'Failed to add doctor. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = doctors.filter(d => {
    const name = (d.user?.name || d.name || '').toLowerCase();
    const email = (d.user?.email || d.email || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <DashboardLayout title="Doctor Management" subtitle="Manage all registered doctors">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">👨‍⚕️ Doctors</h1>
          <p className="page-subtitle">{filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); setSuccess(''); }}>
          ➕ Add Doctor
        </button>
      </div>

      {success && (
        <div className="alert-emergency" style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)', marginBottom: 16 }}>
          <span>✅</span>
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
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
          value={specFilter}
          onChange={e => setSpecFilter(e.target.value)}
        >
          <option value="">All Specializations</option>
          {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || specFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setSpecFilter(''); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Doctor ID</th>
                <th>Name</th>
                <th>Specialization</th>
                <th>Department</th>
                <th>Experience</th>
                <th>Consult Fee</th>
                <th>Rating</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👨‍⚕️</div>
                      <div className="empty-state-title">No doctors found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((doc, idx) => (
                  <tr key={doc._id || idx}>
                    <td className="text-xs text-muted">
                      #{(doc._id || idx + 1).toString().slice(-6).toUpperCase()}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="sidebar-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {(doc.user?.name || doc.name || 'D').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{doc.user?.name || doc.name || '—'}</div>
                          <div className="text-xs text-muted">{doc.user?.email || doc.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        {doc.specialization || '—'}
                      </span>
                    </td>
                    <td className="text-sm text-muted">{doc.department || '—'}</td>
                    <td className="text-sm">{doc.experience != null ? `${doc.experience} yrs` : '—'}</td>
                    <td className="text-sm">
                      {doc.consultationFee != null ? `₹${doc.consultationFee.toLocaleString()}` : '—'}
                    </td>
                    <td><Stars rating={doc.averageRating || doc.rating} /></td>
                    <td>
                      <span className={`badge ${doc.isAvailable !== false ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                        {doc.isAvailable !== false ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Add New Doctor</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Personal Info */}
              <div className="text-xs text-muted font-semibold" style={{ marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Personal Information
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input name="name" className="form-input" value={form.name} onChange={handleChange} required placeholder="Dr. Jane Smith" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} required placeholder="doctor@hospital.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input name="password" type="password" className="form-input" value={form.password} onChange={handleChange} required placeholder="Minimum 6 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input name="phone" className="form-input" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" />
                </div>
              </div>

              {/* Professional Info */}
              <div className="text-xs text-muted font-semibold" style={{ margin: '16px 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Professional Information
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Specialization *</label>
                  <select name="specialization" className="form-select" value={form.specialization} onChange={handleChange} required>
                    <option value="">Select specialization</option>
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select name="department" className="form-select" value={form.department} onChange={handleChange}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Experience (years)</label>
                  <input name="experience" type="number" min="0" max="60" className="form-input" value={form.experience} onChange={handleChange} placeholder="e.g. 10" />
                </div>
                <div className="form-group">
                  <label className="form-label">Consultation Fee (₹)</label>
                  <input name="consultationFee" type="number" min="0" className="form-input" value={form.consultationFee} onChange={handleChange} placeholder="e.g. 500" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Qualifications (comma separated)</label>
                <input name="qualifications" className="form-input" value={form.qualifications} onChange={handleChange} placeholder="MBBS, MD, DM" />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea name="bio" className="form-textarea" value={form.bio} onChange={handleChange} placeholder="Brief professional bio…" style={{ minHeight: 80 }} />
              </div>

              {error && <div className="form-error" style={{ marginBottom: 12 }}>⚠️ {error}</div>}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Adding…' : '✅ Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
