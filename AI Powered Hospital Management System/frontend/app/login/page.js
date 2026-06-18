'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/lib/auth-context';

const DEMO_CREDENTIALS = [
  { role: 'super_admin',       label: 'Super Admin',       email: 'superadmin@hms.com',  password: 'Admin@123',     icon: '👑', color: '#6366f1' },
  { role: 'hospital_admin',    label: 'Hospital Admin',    email: 'admin@hms.com',        password: 'Admin@123',     icon: '🏥', color: '#8b5cf6' },
  { role: 'doctor',            label: 'Doctor',            email: 'doctor@hms.com',       password: 'Doctor@123',    icon: '👨‍⚕️', color: '#0ea5e9' },
  { role: 'nurse',             label: 'Nurse',             email: 'nurse@hms.com',        password: 'Nurse@123',     icon: '💉', color: '#10b981' },
  { role: 'receptionist',      label: 'Receptionist',      email: 'reception@hms.com',    password: 'Reception@123', icon: '🗃️', color: '#f59e0b' },
  { role: 'lab_technician',    label: 'Lab Technician',    email: 'lab@hms.com',          password: 'Lab@123',       icon: '🔬', color: '#06b6d4' },
  { role: 'pharmacist',        label: 'Pharmacist',        email: 'pharmacy@hms.com',     password: 'Pharma@123',    icon: '💊', color: '#84cc16' },
  { role: 'billing_executive', label: 'Billing Executive', email: 'billing@hms.com',      password: 'Billing@123',   icon: '💳', color: '#f97316' },
  { role: 'patient',           label: 'Patient',           email: 'patient@hms.com',      password: 'Patient@123',   icon: '🧑‍🦯', color: '#ef4444' },
];

function LoginForm() {
  const router = useRouter();
  const { login, getRolePath } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoClick = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(getRolePath(user.role));
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── Left hero column ── */}
      <div className="login-hero">
        {/* Animated orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <div className="hero-content">
          {/* Brand */}
          <div className="hero-brand">
            <div className="hero-logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.15"/>
                <path d="M16 6v20M6 16h20M11 11h10M11 21h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="hero-brand-name">HMS Pro</div>
              <div className="hero-brand-tagline">Hospital Management System</div>
            </div>
          </div>

          {/* Headline */}
          <div className="hero-headline">
            <h1 className="hero-title">
              Healthcare<br />
              <span className="hero-title-gradient">Reimagined</span>
            </h1>
            <p className="hero-subtitle">
              AI-powered enterprise platform connecting patients, clinicians,
              and operations in one unified workspace.
            </p>
          </div>

          {/* Feature pills */}
          <div className="hero-features">
            {[
              { icon: '🤖', text: 'AI Symptom Analysis' },
              { icon: '📋', text: 'Digital EMR & Records' },
              { icon: '💊', text: 'Pharmacy Management' },
              { icon: '📊', text: 'Real-time Analytics' },
            ].map((f) => (
              <div key={f.text} className="hero-feature-pill">
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Stats strip */}
          <div className="hero-stats">
            {[
              { value: '50K+', label: 'Patients Served' },
              { value: '300+', label: 'Doctors' },
              { value: '99.9%', label: 'Uptime' },
            ].map((s) => (
              <div key={s.label} className="hero-stat">
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form column ── */}
      <div className="login-form-col">
        <div className="login-form-wrap">

          {/* Form header */}
          <div className="login-form-header">
            <div className="login-form-logo">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <path d="M16 4v24M4 16h24" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h2 className="login-form-title">Welcome back</h2>
              <p className="login-form-sub">Sign in to your HMS account</p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="login-form-inner">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="email"
                  type="email"
                  className="form-input login-input-padded"
                  placeholder="you@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="password"
                  type="password"
                  className="form-input login-input-padded"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full login-submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="login-spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo credentials section */}
          <div className="demo-section">
            <div className="demo-divider">
              <span className="demo-divider-line" />
              <span className="demo-divider-text">Quick Demo Login</span>
              <span className="demo-divider-line" />
            </div>
            <p className="demo-hint">Click any role card to fill credentials instantly</p>
            <div className="demo-grid">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  className="demo-card"
                  onClick={() => handleDemoClick(cred)}
                  title={`${cred.email} / ${cred.password}`}
                  style={{ '--demo-color': cred.color }}
                >
                  <span className="demo-card-icon">{cred.icon}</span>
                  <span className="demo-card-label">{cred.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Register link */}
          <p className="login-register-link">
            New patient?{' '}
            <Link href="/register" className="login-link">
              Create an account →
            </Link>
          </p>
        </div>
      </div>

      {/* ── Scoped styles ── */}
      <style>{`
        /* === PAGE SHELL === */
        .login-page {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
          overflow: hidden;
        }

        /* === LEFT HERO === */
        .login-hero {
          flex: 1;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: linear-gradient(145deg, #0a0a1a 0%, #0d1333 40%, #0f0f2a 100%);
        }

        /* Decorative animated orbs */
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: float 6s ease-in-out infinite;
          pointer-events: none;
        }
        .hero-orb-1 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%);
          top: -100px; left: -100px;
          animation-delay: 0s;
        }
        .hero-orb-2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%);
          bottom: -50px; right: 50px;
          animation-delay: -2s;
        }
        .hero-orb-3 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%);
          top: 50%; left: 50%;
          animation-delay: -4s;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 520px;
          width: 100%;
        }

        /* Brand row */
        .hero-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 56px;
        }
        .hero-logo {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: var(--gradient-primary);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 32px rgba(99,102,241,0.5);
          flex-shrink: 0;
        }
        .hero-brand-name {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .hero-brand-tagline {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 400;
        }

        /* Headline */
        .hero-headline { margin-bottom: 40px; }
        .hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          color: var(--text-primary);
          margin-bottom: 20px;
        }
        .hero-title-gradient {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 400px;
        }

        /* Feature pills */
        .hero-features {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 48px;
        }
        .hero-feature-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
          backdrop-filter: blur(4px);
        }

        /* Stats strip */
        .hero-stats {
          display: flex;
          gap: 40px;
        }
        .hero-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .hero-stat-value {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* === RIGHT FORM COLUMN === */
        .login-form-col {
          width: 520px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          overflow-y: auto;
          background: var(--bg-secondary);
          border-left: 1px solid var(--border);
          padding: 40px 32px;
        }
        .login-form-wrap {
          width: 100%;
          max-width: 420px;
          padding: 8px 0 40px;
        }

        /* Form header */
        .login-form-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }
        .login-form-logo {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: var(--gradient-primary);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: var(--shadow-glow);
        }
        .login-form-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .login-form-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 3px;
        }

        /* Error */
        .login-error {
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

        /* Input with icon */
        .login-form-inner { margin-bottom: 8px; }
        .login-input-wrap { position: relative; }
        .login-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
          z-index: 1;
        }
        .login-input-padded { padding-left: 42px !important; }

        /* Submit button */
        .login-submit {
          width: 100%;
          justify-content: center;
          padding: 13px 20px;
          font-size: 0.95rem;
          margin-top: 8px;
          border-radius: var(--radius-md);
        }
        .login-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        /* Demo section */
        .demo-section { margin-top: 28px; }
        .demo-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        .demo-divider-line {
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .demo-divider-text {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .demo-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-align: center;
          margin-bottom: 14px;
        }
        .demo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .demo-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition);
          font-family: inherit;
          color: var(--text-secondary);
          position: relative;
          overflow: hidden;
        }
        .demo-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--demo-color, #6366f1);
          opacity: 0;
          transition: var(--transition);
        }
        .demo-card:hover::before { opacity: 0.08; }
        .demo-card:hover {
          border-color: var(--demo-color, #6366f1);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          color: var(--text-primary);
        }
        .demo-card:active { transform: scale(0.97); }
        .demo-card-icon {
          font-size: 1.3rem;
          position: relative;
          z-index: 1;
          line-height: 1;
        }
        .demo-card-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-align: center;
          line-height: 1.3;
          position: relative;
          z-index: 1;
        }

        /* Register link */
        .login-register-link {
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 24px;
        }
        .login-link {
          color: var(--primary-light);
          font-weight: 600;
          transition: var(--transition);
        }
        .login-link:hover { color: white; }

        /* Responsive */
        @media (max-width: 900px) {
          .login-hero { display: none; }
          .login-form-col { width: 100%; }
        }
        @media (max-width: 480px) {
          .login-form-col { padding: 24px 16px; }
          .demo-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
