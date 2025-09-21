import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppProviders } from '@/components/app-providers'
import React from 'react'
import dynamic from 'next/dynamic'

// If the error persists, dynamically import AppLayout to prevent SSR
const AppLayout = dynamic(
  () => import('@/components/app-layout').then(mod => ({ default: mod.AppLayout })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Yeeteora...</p>
          </div>
        </div>
      </div>
    )
  }
)

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