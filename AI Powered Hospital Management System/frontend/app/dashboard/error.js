'use client';

export default function DashboardError({ error, reset }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', flexDirection: 'column', gap: '20px',
      padding: '40px'
    }}>
      <div style={{ fontSize: '3rem' }}>🏥</div>
      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Dashboard Error</h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0, textAlign: 'center', maxWidth: '400px' }}>
        {error?.message || 'Failed to load dashboard. Please try again.'}
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={reset}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
            padding: '10px 24px', borderRadius: '12px', fontWeight: 600,
            fontSize: '0.875rem', border: 'none', cursor: 'pointer'
          }}
        >🔄 Retry</button>
        <a
          href="/login"
          style={{
            background: '#1e2a4a', color: '#f1f5f9', border: '1px solid rgba(99,102,241,0.2)',
            padding: '10px 24px', borderRadius: '12px', fontWeight: 600,
            fontSize: '0.875rem', textDecoration: 'none'
          }}
        >← Back to Login</a>
      </div>
    </div>
  );
}
