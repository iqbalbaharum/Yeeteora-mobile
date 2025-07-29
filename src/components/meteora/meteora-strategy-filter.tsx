'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, TrendingUp, Activity } from 'lucide-react'
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

export function MeteoraStrategyFilter() {
  const [activeFilter, setActiveFilter] = useState<FilterStrategy>('all')
  const { data: meteoraData, isLoading, isError, refetch } = useMeteoraData()

  // Helper functions
  const isSOLPair = (pair: DLMMPair): boolean => {
    const SOL_MINT = 'So11111111111111111111111111111111111111112'
    return pair.mint_x === SOL_MINT || pair.mint_y === SOL_MINT
  }

  // Get all pairs from all groups
  const allPairs = meteoraData?.groups.flatMap(group => group.pairs) || []
  
  // Apply selected filter
  const filteredPairs = activeFilter === 'all' 
    ? getAllStrategyPairs(allPairs)
    : filterStrategies[activeFilter](allPairs)

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

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'N/A'
    return `$${price.toFixed(6)}`
  }

  const formatTVL = (liquidityStr?: string) => {
    if (!liquidityStr) return 'N/A'
    const tvl = parseFloat(liquidityStr)
    if (isNaN(tvl)) return 'N/A'
    return formatNumber(tvl)
  }

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
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('all')}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            All Strategies
          </Button>
          
          <Button
            variant={activeFilter === 'oneSided' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('oneSided')}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            One Sided Strategy
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {filteredPairs.length} pairs found
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Strategy Requirements Info */}
      {activeFilter === 'all' && (
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
            All Strategies Combined:
          </h3>
          <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
            <li>• <strong>One Sided Strategy:</strong> SOL pairs with market cap &gt; $1M, 24h volume &gt; $2M, 6h volume &gt; $400K</li>
            <li>• <strong>Future Strategies:</strong> Additional strategies will be automatically included here</li>
          </ul>
        </div>
      )}

      {activeFilter === 'oneSided' && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            One Sided Strategy Requirements:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Must contain SOL as one of the tokens</li>
            <li>• Market cap: &gt; $1,000,000 USD</li>
            <li>• 24h volume: &gt; $2,000,000 USD</li>
            <li>• 6h volume: &gt; $400,000 USD</li>
          </ul>
        </div>
      )}

      {/* Results Table */}
      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading Meteora pairs...</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pair</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">24h APR</TableHead>
                <TableHead className="text-right">24h Volume</TableHead>
                <TableHead className="text-right">TVL</TableHead>
                <TableHead className="text-right">24h Fees</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPairs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {activeFilter === 'all'
                      ? 'No pairs meet any strategy requirements'
                      : activeFilter === 'oneSided' 
                        ? 'No pairs meet the one-sided strategy requirements'
                        : 'No pairs found for this strategy'
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredPairs.map((pair) => (
                  <TableRow key={pair.address}>
                    <TableCell>
                      <div className="font-medium">{pair.name}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {pair.address.slice(0, 8)}...{pair.address.slice(-8)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPrice(pair.current_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-600">
                        {pair.apr ? `${pair.apr.toFixed(2)}%` : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(pair.trade_volume_24h)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(parseFloat(pair.liquidity || '0'))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(pair.fees_24h)}
                    </TableCell>
                    <TableCell className="text-right">
                      <AddLPPosition
                        pairAddress={pair.address}
                        pairName={pair.name}
                        isSOLPair={isSOLPair(pair)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}