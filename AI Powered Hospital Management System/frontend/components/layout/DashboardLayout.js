'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import AIChatBot from '../ai/AIChatBot';

export default function DashboardLayout({ children, title, subtitle }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Show full-page loading spinner while auth is resolving
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div className="loading-spinner" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</p>
      </div>
    );
  }

  // While redirect is in flight, render nothing
  if (!user) return null;

  function toggleSidebar() {
    setSidebarCollapsed((prev) => !prev);
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main content area */}
      <main className={`main-content${sidebarCollapsed ? ' expanded' : ''}`}>
        {/* Top bar */}
        <TopBar
          title={title}
          subtitle={subtitle}
          onToggleSidebar={toggleSidebar}
        />

        {/* Page content */}
        <div className="page">
          {children}
        </div>
      </main>
      <AIChatBot />
    </div>
  );
}
