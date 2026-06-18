'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#0f0f1a', flexDirection: 'column', gap: '24px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{ fontSize: '4rem' }}>⚠️</div>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Something went wrong</h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, maxWidth: '400px', textAlign: 'center' }}>
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={reset}
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
          padding: '12px 28px', borderRadius: '12px', fontWeight: 600,
          fontSize: '0.9rem', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
        }}
      >🔄 Try Again</button>
    </div>
  );
}
