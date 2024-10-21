import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '98.css' // Import the 98.css package

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fenestro.io',
  description: 'Bring back the old internet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="w-full h-full">
      <body className={`${inter.className} w-full h-full m-0 p-0 overflow-hidden`}>
        {children}
      </body>
    </html>
  )
}
