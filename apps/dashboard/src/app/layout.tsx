import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'VEXXX Dashboard',
  description: 'VEXXX customer dashboard.',
  // The dashboard lives behind auth and must never be indexed.
  robots: { index: false, follow: false },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
