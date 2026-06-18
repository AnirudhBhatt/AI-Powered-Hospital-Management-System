'use client';
import { AuthProvider } from '@/lib/auth-context';

export default function RegisterLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
