import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LayoutShell } from '../components/layout-shell';

export const metadata: Metadata = {
  title: 'RoomTrace | Spatial Object Movement Engine - Made by Hasim',
  description: 'Detect, store, and measure indoor object movement using smartphone cameras and AR/spatial tracking. Designed & engineered by Hasim.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
