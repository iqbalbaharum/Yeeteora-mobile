// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppProviders } from '@/components/app-providers'
import { AppLayout } from '@/components/app-layout'
import React from 'react'

export const metadata: Metadata = {
  title: 'Yeeteora - LP Strategies',
  description: 'Discover and provide liquidity for high-performing DLMM pairs',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Yeeteora',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8B5CF6',
}

const links: { label: string; path: string }[] = [
  { label: 'Home', path: '/' },
  { label: 'Damm v2', path: '/damm-v2' },
  { label: 'Account', path: '/account' },
]

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        <AppProviders>
          <AppLayout links={links}>{children}</AppLayout>
        </AppProviders>
      </body>
    </html>
  )
}

// Patch BigInt so we can log it using JSON.stringify without any errors
declare global {
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}