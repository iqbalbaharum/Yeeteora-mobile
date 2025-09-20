import { AppHero } from '@/components/app-hero'
import { MeteoraStrategyFilter } from '@/components/meteora/meteora-strategy-filter'

export default function MeteoraFeature() {
  return (
    <div className="min-h-screen">
      <AppHero
        title="Alpha call DLMM"
        subtitle="Discover and provide liquidity for high-performing DLMM pairs"
      />

      <div className="relative z-10">
        <MeteoraStrategyFilter />
      </div>
    </div>
  )
}