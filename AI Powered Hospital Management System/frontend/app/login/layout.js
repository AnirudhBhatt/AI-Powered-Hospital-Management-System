'use client';
import { AuthProvider } from '@/lib/auth-context';

export default function AuthLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
