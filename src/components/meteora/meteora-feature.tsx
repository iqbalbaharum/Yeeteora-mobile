import { AppHero } from '@/components/app-hero'
import { MeteoraStrategyFilter } from '@/components/meteora/meteora-strategy-filter'

export default function MeteoraFeature() {
  return (
    <div>
      <AppHero
        title="Meteora DLMM Strategies"
        subtitle="Discover and filter Meteora DLMM pairs by strategy requirements"
      />
      
      <div className="max-w-7xl mx-auto">
        <MeteoraStrategyFilter />
      </div>
    </div>
  )
}