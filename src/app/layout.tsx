import type { Metadata } from 'next';
import './globals.css'; // Sesuaikan dengan path file CSS global Anda

export const metadata: Metadata = {
  title: 'Mini App Chat MVP',
  description: 'Chat app with offline support',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
