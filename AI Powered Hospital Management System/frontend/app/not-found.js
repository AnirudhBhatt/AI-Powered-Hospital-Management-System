import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#0f0f1a', flexDirection: 'column', gap: '24px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{ fontSize: '6rem', lineHeight: 1 }}>🏥</div>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>404</h1>
      <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>This page could not be found</p>
      <Link
        href="/login"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
          padding: '12px 28px', borderRadius: '12px', fontWeight: 600,
          fontSize: '0.9rem', textDecoration: 'none', boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          transition: 'all 0.2s ease'
        }}
      >← Return to HMS Pro</Link>
    </div>
  );
}
