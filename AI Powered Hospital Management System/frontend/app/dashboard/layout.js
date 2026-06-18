'use client';
import { AuthProvider } from '@/lib/auth-context';

export default function DashboardRootLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
