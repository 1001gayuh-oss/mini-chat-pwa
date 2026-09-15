import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mini Chat App',
  description: 'Chat App Offline First',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
      {children}
    
  );
}