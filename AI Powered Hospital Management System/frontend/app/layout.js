import './globals.css';
import ToasterProvider from '@/components/ToasterProvider';

export const metadata = {
  title: 'HMS Pro — AI-Powered Hospital Management System',
  description: 'Enterprise-grade hospital management system with AI-powered features for patients, doctors, and staff.',
  keywords: 'hospital management, EMR, healthcare, medical records, appointments',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
