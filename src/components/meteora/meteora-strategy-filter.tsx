'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, Activity, ChevronDown, ChevronUp, ExternalLink, Award, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { AddLPPosition } from './meteora-add-lp-position'

// Types based on actual Meteora DLMM API response structure
interface DLMMPair {
  address: string
  name: string
  mint_x: string
  mint_y: string
  reserve_x: string
  reserve_y: string
  reserve_x_amount: number
  reserve_y_amount: number
  bin_step: number
  base_fee_percentage: string
  max_fee_percentage: string
  protocol_fee_percentage: string
  liquidity: string
  reward_mint_x: string
  reward_mint_y: string
  fees_24h: number
  today_fees: number
  trade_volume_24h: number
  cumulative_trade_volume: string
  cumulative_fee_volume: string
  current_price: number
  apr: number
  apy: number
  farm_apr: number
  farm_apy: number
  hide: boolean
  is_blacklisted: boolean
  launchpad?: string | null
  fees: {
    min_30: number
    hour_1: number
    hour_2: number
    hour_4: number
    hour_12: number
    hour_24: number
  }
  fee_tvl_ratio: {
    min_30: number
    hour_1: number
    hour_2: number
    hour_4: number
    hour_12: number
    hour_24: number
  }
  volume: {
    min_30: number
    hour_1: number
    hour_2: number
    hour_4: number
    hour_12: number
    hour_24: number
  }
  tags: string[]
}

interface DLMMGroup {
  name: string
  pairs: DLMMPair[]
}

interface DLMMResponse {
  groups: DLMMGroup[]
  total: number
}

// Hook for fetching Meteora data
function useMeteoraData() {
  return useQuery({
    queryKey: ['meteora-dlmm-pairs'],
    queryFn: async (): Promise<DLMMResponse> => {
      const response = await fetch('https://dlmm-api.meteora.ag/pair/all_by_groups')
      if (!response.ok) {
        throw new Error('Failed to fetch Meteora data')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

// Filter functions - specific strategies with their own criteria
const filterStrategies = {
  oneSided: (pairs: DLMMPair[]): DLMMPair[] => {
    const SOL_MINT = 'So11111111111111111111111111111111111111112'

    return pairs.filter(pair => {
      // Must be a SOL pair
      const isSOLPair = pair.mint_x === SOL_MINT || pair.mint_y === SOL_MINT
      if (!isSOLPair) return false

      // Skip pairs with missing essential data or blacklisted pairs
      if (!pair.liquidity || !pair.trade_volume_24h || pair.is_blacklisted || pair.hide) return false

      // Convert liquidity string to number (TVL)
      const tvl = parseFloat(pair.liquidity)

      // Estimate market cap from TVL (rough estimation)
      const estimatedMarketCap = tvl * 2

      // Get 6h volume from the volume object
      const volume6h = pair.volume?.hour_1 * 6 || pair.volume?.hour_2 * 3 || pair.volume?.hour_4 * 1.5 || pair.trade_volume_24h / 4

      return (
        estimatedMarketCap > 1_000_000 && // > $1M market cap
        pair.trade_volume_24h > 2_000_000 && // > $2M 24h volume
        volume6h > 400_000 // > $400k 6h volume
      )
    })
  },

  // Add future strategies here...
  // futureStrategy: (pairs: DLMMPair[]): DLMMPair[] => { ... }
}

// Get all pairs that match ANY strategy
const getAllStrategyPairs = (pairs: DLMMPair[]): DLMMPair[] => {
  const allStrategyPairs = new Set<DLMMPair>()

  // Collect pairs from all individual strategies
  Object.values(filterStrategies).forEach(strategyFilter => {
    const strategyPairs = strategyFilter(pairs)
    strategyPairs.forEach(pair => allStrategyPairs.add(pair))
  })

  return Array.from(allStrategyPairs)
}

type FilterStrategy = keyof typeof filterStrategies | 'all'

// LP Pair Card Component
function LPPairCard({ pair, rank }: { pair: DLMMPair; rank: number }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isSOLPair = (pair: DLMMPair): boolean => {
    const SOL_MINT = 'So11111111111111111111111111111111111111112'
    return pair.mint_x === SOL_MINT || pair.mint_y === SOL_MINT
  }

  const formatNumber = (num?: number) => {
    if (!num || num === 0) return 'N/A'
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const formatPercentage = (num?: number) => {
    if (num === undefined || num === null) return 'N/A'
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400'
    if (rank <= 3) return 'text-orange-400'
    if (rank <= 10) return 'text-primary'
    return 'text-muted-foreground'
  }

  return (
    <div className="gradient-card rounded-2xl p-4 hover:scale-[1.02] transition-all duration-200 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold ${getRankColor(rank)}`}>
            {rank <= 3 ? <Award className="w-5 h-5" /> : rank}
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg leading-tight">{pair.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">
              {pair.address.slice(0, 8)}...{pair.address.slice(-8)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {rank <= 10 && <Zap className="w-4 h-4 text-primary" />}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-primary"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-center p-3 rounded-lg bg-background/50">
          <p className="text-xs text-muted-foreground mb-1">24h APR</p>
          <p className="text-lg font-bold text-green-400">
            {pair.apr ? `${pair.apr.toFixed(2)}%` : 'N/A'}
          </p>
        </div>
        <div className="text-center p-3 rounded-lg bg-background/50">
          <p className="text-xs text-muted-foreground mb-1">TVL</p>
          <p className="text-lg font-bold text-primary">
            {formatNumber(parseFloat(pair.liquidity || '0'))}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border/30 pt-3 mt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">24h Volume</p>
              <p className="text-sm font-medium">{formatNumber(pair.trade_volume_24h)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">24h Fees</p>
              <p className="text-sm font-medium">{formatNumber(pair.fees_24h)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Current Price</p>
              <p className="text-sm font-medium font-mono">
                {pair.current_price ? `$${pair.current_price.toFixed(6)}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Bin Step</p>
              <p className="text-sm font-medium">{pair.bin_step || 'N/A'}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(`https://solscan.io/account/${pair.address}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Solscan
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border/30">
        <AddLPPosition
          pairAddress={pair.address}
          pairName={pair.name}
          isSOLPair={isSOLPair(pair)}
        />
      </div>
    </div>
  )
}

export function MeteoraStrategyFilter() {
  const [activeFilter, setActiveFilter] = useState<FilterStrategy>('all')
  const { data: meteoraData, isLoading, isError, refetch } = useMeteoraData()

  // Get all pairs from all groups
  const allPairs = meteoraData?.groups.flatMap(group => group.pairs) || []

  // Apply selected filter and sort by APR
  const filteredPairs = (activeFilter === 'all'
    ? getAllStrategyPairs(allPairs)
    : filterStrategies[activeFilter](allPairs)
  ).sort((a, b) => (b.apr || 0) - (a.apr || 0))

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Failed to load Meteora data</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Filter Controls */}
      <div className="glass-effect rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              onClick={() => {
                console.log('Clicking All Strategies, current filter:', activeFilter)
                setActiveFilter('all')
              }}
              className={`gap-2 rounded-full ${activeFilter === 'all' ? 'gradient-primary text-white border-0' : ''}`}
            >
              <Activity className="h-4 w-4" />
              All Strategies
            </Button>

            <Button
              variant={activeFilter === 'oneSided' ? 'default' : 'outline'}
              onClick={() => {
                console.log('Clicking One Sided, current filter:', activeFilter)
                setActiveFilter('oneSided')
              }}
              className={`gap-2 rounded-full ${activeFilter === 'oneSided' ? 'gradient-primary text-white border-0' : ''}`}
            >
              <TrendingUp className="h-4 w-4" />
              One Sided
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {filteredPairs.length} pairs found
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2 rounded-full"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Strategy Info Panel */}
        {activeFilter === 'all' && (
          <div className="mt-4 p-4 rounded-xl gradient-accent/10 border border-primary/20">
            <h3 className="font-semibold text-primary mb-2 text-sm">
              All Strategies Combined
            </h3>
            <p className="text-xs text-muted-foreground">
              Showing all pairs that meet any strategy requirements. One-sided strategy includes SOL pairs with strong fundamentals.
            </p>
          </div>
        )}

        {activeFilter === 'oneSided' && (
          <div className="mt-4 p-4 rounded-xl gradient-accent/10 border border-primary/20">
            <h3 className="font-semibold text-primary mb-2 text-sm">
              One Sided Strategy
            </h3>
            <p className="text-xs text-muted-foreground">
              SOL pairs with market cap &gt; $1M, 24h volume &gt; $2M, and strong 6h volume.
            </p>
          </div>
        )}
      </div>

      {/* LP Pairs List */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading top LP opportunities...</p>
        </div>
      ) : filteredPairs.length === 0 ? (
        <div className="text-center py-12 glass-effect rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary/20 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Opportunities Found</h3>
          <p className="text-muted-foreground text-sm">
            {activeFilter === 'all'
              ? 'No pairs meet any strategy requirements at the moment.'
              : 'No pairs meet the selected strategy requirements.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPairs.slice(0, 20).map((pair, index) => (
            <LPPairCard key={pair.address} pair={pair} rank={index + 1} />
          ))}

          {filteredPairs.length > 20 && (
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Showing top 20 opportunities. {filteredPairs.length - 20} more available.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}