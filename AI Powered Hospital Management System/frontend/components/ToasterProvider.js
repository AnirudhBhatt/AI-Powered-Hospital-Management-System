'use client';
import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1e2a4a',
          color: '#f1f5f9',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '12px',
          fontSize: '0.875rem',
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
      }}
    />
  );
}
