'use client'

import { useEffect, useState } from 'react'
import { AppHero } from '@/components/app-hero'
import dynamic from 'next/dynamic'

// Dynamically import MeteoraStrategyFilter to prevent SSR issues
const MeteoraStrategyFilter = dynamic(
  () => import('@/components/meteora/meteora-strategy-filter').then(mod => ({ default: mod.MeteoraStrategyFilter })),
  { 
    ssr: false,
    loading: () => (
      <div className="lg:px-[70px] px-4 mx-auto space-y-12">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading top LP opportunities...</p>
        </div>
      </div>
    )
  }
)

export default function MeteoraFeature() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="min-h-screen">
      <AppHero
        title="Alpha call DLMM"
        subtitle="Discover and provide liquidity for high-performing DLMM pairs"
      />

      <div className="relative z-10">
        {isMounted ? (
          <MeteoraStrategyFilter />
        ) : (
          <div className="lg:px-[70px] px-4 mx-auto space-y-12">
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading DLMM opportunities...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}