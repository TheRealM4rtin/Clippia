import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/react"
import localFont from 'next/font/local';
import './globals.css';

import '@react95/core/GlobalStyle';
import '@react95/core/themes/win95.css';
import React from 'react';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased w-full h-full m-0 p-0 overflow-hidden`}>
        <Analytics />
        {children}
      </body>
    </html>
  );
}
