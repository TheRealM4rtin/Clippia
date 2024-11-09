import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/react"
import localFont from 'next/font/local';
import '98.css';  // Add this import
import './globals.css';
import "xp.css/dist/98.css";
import './tiptap.css';

import '@react95/core/GlobalStyle';
import '@react95/core/themes/win95.css';
import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'clippia.io',
  description: 'Bring back the old internet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Analytics />
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
