'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dob: '',
    gender: '',
    bloodGroup: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.name.trim())          return 'Full name is required.';
    if (!form.email.trim())         return 'Email is required.';
    if (form.password.length < 6)   return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!form.phone.trim())         return 'Phone number is required.';
    if (!form.dob)                  return 'Date of birth is required.';
    if (!form.gender)               return 'Gender is required.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');

    try {
      await authAPI.register({
        name:        form.name,
        email:       form.email,
        password:    form.password,
        phone:       form.phone,
        dob:         form.dob,
        gender:      form.gender,
        bloodGroup:  form.bloodGroup || undefined,
      });

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Decorative orbs */}
      <div className="reg-orb reg-orb-1" />
      <div className="reg-orb reg-orb-2" />

      <div className="register-card">
        {/* Header */}
        <div className="reg-header">
          <div className="reg-logo">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path d="M16 4v24M4 16h24" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="reg-title">Create Account</h1>
            <p className="reg-sub">Join HMS Pro as a patient</p>
          </div>
        </div>

        {/* Success banner */}
        {success && (
          <div className="reg-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Account created successfully! Redirecting to login…
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="reg-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="reg-form">
          {/* Row 1: Name + Email */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Row 2: Password + Confirm */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Row 3: Phone + DOB */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-input"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dob">Date of Birth *</label>
              <input
                id="dob"
                name="dob"
                type="date"
                className="form-input"
                value={form.dob}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Row 4: Gender + Blood Group */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                className="form-select"
                value={form.gender}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="bloodGroup">Blood Group</label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                className="form-select"
                value={form.bloodGroup}
                onChange={handleChange}
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Terms notice */}
          <p className="reg-terms">
            By registering, you agree to the HMS Pro{' '}
            <span className="reg-terms-link">Terms of Service</span> and{' '}
            <span className="reg-terms-link">Privacy Policy</span>.
          </p>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary w-full reg-submit"
            disabled={loading || success}
          >
            {loading ? (
              <>
                <div className="reg-spinner" />
                Creating Account…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="reg-login-link">
          Already have an account?{' '}
          <Link href="/login" className="reg-link">Sign in →</Link>
        </p>
      </div>

      {/* Scoped styles */}
      <style>{`
        .register-page {
          min-height: 100vh;
          background: var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }

        .reg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }
        .reg-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%);
          top: -150px; left: -150px;
          animation: float 7s ease-in-out infinite;
        }
        .reg-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%);
          bottom: -100px; right: -100px;
          animation: float 9s ease-in-out infinite reverse;
        }

        .register-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 640px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 40px;
          box-shadow: var(--shadow-lg);
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Header */
        .reg-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }
        .reg-logo {
          width: 48px; height: 48px;
          border-radius: 14px;
          background: var(--gradient-primary);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: var(--shadow-glow);
        }
        .reg-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .reg-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 3px;
        }

        /* Banners */
        .reg-success {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.35);
          border-radius: var(--radius-md);
          color: #34d399;
          font-size: 0.875rem;
          margin-bottom: 20px;
        }
        .reg-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.35);
          border-radius: var(--radius-md);
          color: #f87171;
          font-size: 0.85rem;
          margin-bottom: 20px;
        }

        /* Form */
        .reg-form { margin-bottom: 20px; }

        /* Terms */
        .reg-terms {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-align: center;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .reg-terms-link {
          color: var(--primary-light);
          cursor: pointer;
          font-weight: 500;
        }

        /* Submit */
        .reg-submit {
          width: 100%;
          justify-content: center;
          padding: 13px 20px;
          font-size: 0.95rem;
          border-radius: var(--radius-md);
        }
        .reg-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        /* Login link */
        .reg-login-link {
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 20px;
        }
        .reg-link {
          color: var(--primary-light);
          font-weight: 600;
          transition: var(--transition);
        }
        .reg-link:hover { color: white; }

        @media (max-width: 640px) {
          .register-card { padding: 28px 20px; }
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
