// src/components/damm-v2/damm-v2-token-card.tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'

export interface TokenData {
  mint: string
  delta_other: number
  delta_jup: number
  total: number
  total_jupiter: number
  jupiter_pct: number
  is_new_entry: boolean
  since_tge: number
  timestamp: number
}

// Meteora API response types
interface MeteoraPool {
  pool_address: string
  pool_name: string
  token_a_mint: string
  token_b_mint: string
  token_a_symbol: string
  token_b_symbol: string
  tvl: number
  apr: number
  volume24h: number
  fee24h: number
  base_fee: number
  dynamic_fee: number
  fee_scheduler_mode: number
  [key: string]: unknown
}

interface MeteoraGroup {
  group_name: string
  updated_at: number
  total_tvl: number
  max_fee_tvl_ratio: number
  max_apr: number
  total_volume24h: number
  total_fee24h: number
  pools: MeteoraPool[]
}

interface MeteoraApiResponse {
  status: number
  total: number
  pages: number
  current_page: number
  data: MeteoraGroup[]
}

interface TokenCardProps {
  token: TokenData
}

export function TokenCard({ token }: TokenCardProps) {
  const lastNotificationRef = useRef<number>(0)
  const [poolExists, setPoolExists] = useState<boolean | null>(null)
  const [isCheckingPool, setIsCheckingPool] = useState(false)
  const [showPoolList, setShowPoolList] = useState(false)
  const [availablePools, setAvailablePools] = useState<MeteoraPool[]>([])
  const [isLoadingPools, setIsLoadingPools] = useState(false)
  const [tokenName, setTokenName] = useState<string | null>(null)
  const [isLoadingTokenName, setIsLoadingTokenName] = useState(false)

  // Utility functions
  const formatTVL = (tvl: number) => {
    if (tvl >= 1000000) {
      return `$${(tvl / 1000000).toFixed(2)}M`
    } else if (tvl >= 1000) {
      return `$${(tvl / 1000).toFixed(2)}K`
    } else {
      return `$${tvl.toFixed(2)}`
    }
  }

  const formatFeePercentage = (baseFee: number, dynamicFee: number) => {
    const totalFee = baseFee + dynamicFee
    return `${totalFee.toFixed(3)}%`
  }

  const getFeeScheduleText = (feeSchedulerMode: number) => {
    return feeSchedulerMode === 1 ? 'Scheduled' : 'Fixed'
  }

  const formatTime = (ageInSeconds: number) => {
    // Handle invalid/corrupted timestamps
    // If the value is too large (more than 2 years = 63,072,000 seconds), it's likely a Unix timestamp
    if (ageInSeconds > 63072000) {
      // Try to convert from Unix timestamp to age
      const currentTime = Math.floor(Date.now() / 1000) // Current Unix timestamp
      const actualAge = currentTime - ageInSeconds
      
      // If the result is still invalid or negative, show "Unknown"
      if (actualAge <= 0 || actualAge > 63072000) {
        return "Unknown"
      }
      
      // Use the corrected age
      ageInSeconds = actualAge
    }
    
    // If still invalid (negative or too large), show "Unknown"
    if (ageInSeconds <= 0 || ageInSeconds > 63072000) {
      return "Unknown"
    }
    
    if (ageInSeconds < 60) {
      return `${ageInSeconds}s`
    } else if (ageInSeconds < 3600) {
      return `${Math.floor(ageInSeconds / 60)}m`
    } else if (ageInSeconds < 86400) {
      const hours = Math.floor(ageInSeconds / 3600)
      const minutes = Math.floor((ageInSeconds % 3600) / 60)
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    } else {
      const days = Math.floor(ageInSeconds / 86400)
      const hours = Math.floor((ageInSeconds % 86400) / 3600)
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`
    }
  }

  // Get ticker name from Jupiter API
  const fetchTokenName = async (tokenMint: string): Promise<string | null> => {
    try {
      setIsLoadingTokenName(true)
      const response = await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${tokenMint}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch token data from Jupiter')
      }
      
      const data = await response.json()
      
      // Jupiter API returns an array of tokens, find exact match
      if (Array.isArray(data) && data.length > 0) {
        // Look for exact mint match first
        const exactMatch = data.find((token: { address: string; symbol?: string }) => token.address === tokenMint)
        if (exactMatch && exactMatch.symbol) {
          return exactMatch.symbol
        }
        
        // If no exact match, use the first result with a symbol
        const firstWithSymbol = data.find((token: { symbol?: string }) => token.symbol)
        if (firstWithSymbol && firstWithSymbol.symbol) {
          return firstWithSymbol.symbol
        }
      }
      
      return null
    } catch (error) {
      console.error('Error fetching token name from Jupiter:', error)
      return null
    } finally {
      setIsLoadingTokenName(false)
    }
  }

  const getTickerName = () => {
    // Priority order:
    // 1. Jupiter API result
    if (tokenName) {
      return tokenName
    }
    
    // 2. Pool data (fallback)
    if (availablePools.length > 0) {
      const pool = availablePools[0]
      if (pool.token_a_symbol !== 'SOL') {
        return pool.token_a_symbol
      } else if (pool.token_b_symbol !== 'SOL') {
        return pool.token_b_symbol
      }
    }
    
    // 3. Shortened mint address (final fallback)
    return `${token.mint.slice(0, 4)}...${token.mint.slice(-4)}`
  }

  // Notification setup
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }, [])

  const playNotificationSound = () => {
    const audio = new Audio('/sound/noti.mp3')
    audio.play().catch((err) => console.error('Failed to play sound:', err))
  }

  const showBrowserNotification = (title: string, body: string) => {
    const isUserDisabled = localStorage.getItem('notifications-disabled') === 'true'
    
    if ('Notification' in window && 
        Notification.permission === 'granted' && 
        !isUserDisabled) {
      new Notification(title, { 
        body,
        icon: '/favicon.ico'
      })
    }
  }

  const triggerAlert = (title: string) => {
    const now = Date.now()
    if (now - lastNotificationRef.current > 3000) {
      playNotificationSound()
      showBrowserNotification(
        title,
        `${token.mint} — Jup: ${token.delta_jup}, Total: ${token.total + token.total_jupiter}`,
      )
      lastNotificationRef.current = now
    }
  }

  // Pool checking functions
  const checkPoolExists = async (tokenMint: string): Promise<boolean> => {
    try {
      setIsCheckingPool(true)
      const response = await fetch(`https://dammv2-api.meteora.ag/pools/grouped?token_a_mint=${tokenMint}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch pool data')
      }
      
      const data: MeteoraApiResponse = await response.json()
      
      const hasPoolAsTokenA = data.data.length > 0 && data.data.some(group => 
        group.pools.some(pool => pool.token_a_mint === tokenMint)
      )
      
      if (hasPoolAsTokenA) {
        return true
      }
      
      try {
        const responseB = await fetch(`https://dammv2-api.meteora.ag/pools/grouped`)
        if (responseB.ok) {
          const dataB: MeteoraApiResponse = await responseB.json()
          const hasPoolAsTokenB = dataB.data.some(group => 
            group.pools.some(pool => pool.token_b_mint === tokenMint)
          )
          return hasPoolAsTokenB
        }
      } catch (err) {
        console.warn('Failed to check token_b_mint:', err)
      }
      
      return false
    } catch (error) {
      console.error('Error checking pool existence:', error)
      return false
    } finally {
      setIsCheckingPool(false)
    }
  }

  const getAllPoolsForToken = async (tokenMint: string): Promise<MeteoraPool[]> => {
    const pools: MeteoraPool[] = []
    
    try {
      // Check pools where token is token_a_mint
      const response = await fetch(`https://dammv2-api.meteora.ag/pools/grouped?token_a_mint=${tokenMint}`)
      if (response.ok) {
        const data: MeteoraApiResponse = await response.json()
        for (const group of data.data) {
          for (const pool of group.pools) {
            if (pool.token_a_mint === tokenMint) {
              pools.push(pool)
            }
          }
        }
      }
      
      // Check all pools to find where token is token_b_mint
      const responseAll = await fetch(`https://dammv2-api.meteora.ag/pools/grouped`)
      if (responseAll.ok) {
        const dataAll: MeteoraApiResponse = await responseAll.json()
        for (const group of dataAll.data) {
          for (const pool of group.pools) {
            if (pool.token_b_mint === tokenMint) {
              const exists = pools.some(p => p.pool_address === pool.pool_address)
              if (!exists) {
                pools.push(pool)
              }
            }
          }
        }
      }
      
      return pools.sort((a, b) => b.tvl - a.tvl)
      
    } catch (error) {
      console.error('Error fetching all pools:', error)
      return []
    }
  }

  // Fetch token name and check pool existence on mount
  useEffect(() => {
    const initializeTokenData = async () => {
      // Start both operations in parallel
      const [name, exists] = await Promise.all([
        fetchTokenName(token.mint),
        checkPoolExists(token.mint)
      ])
      
      setTokenName(name)
      setPoolExists(exists)
      
      // If pools exist, also fetch the pool list for later use
      if (exists) {
        const pools = await getAllPoolsForToken(token.mint)
        setAvailablePools(pools)
      }
    }
    
    initializeTokenData()
  }, [token.mint])

  // Event handlers
  const handleOpenGMGN = () => {
    window.open(`https://gmgn.ai/sol/token/${token.mint}`, '_blank')
  }

  const handlePumpSwap = () => {
    window.open(
      `https://swap.pump.fun/?input=So11111111111111111111111111111111111111112&output=${token.mint}`,
      '_blank',
    )
  }

  const handleCreatePool = () => {
    window.open('https://www.meteora.ag/pools/create', '_blank')
  }

  const handleViewPool = async () => {
    if (poolExists === null || isCheckingPool || !poolExists) {
      return
    }

    if (showPoolList) {
      setShowPoolList(false)
      return
    }

    if (availablePools.length === 0) {
      setIsLoadingPools(true)
      const pools = await getAllPoolsForToken(token.mint)
      setAvailablePools(pools)
      setIsLoadingPools(false)
    }
    
    setShowPoolList(true)
  }

  const handlePoolSelect = (pool: MeteoraPool) => {
    window.open(`https://meteora.ag/dammv2/${pool.pool_address}`, '_blank')
    setShowPoolList(false)
  }

  // Button text and styles
  const getViewPoolButtonText = () => {
    if (isCheckingPool || poolExists === null) {
      return 'Checking...'
    }
    if (isLoadingPools) {
      return 'Loading Pools...'
    }
    return showPoolList ? 'Hide Pools' : 'View Pools'
  }

  const getViewPoolButtonStyle = () => {
    if (isCheckingPool || poolExists === null) {
      return 'bg-gray-500 hover:bg-gray-600'
    }
    return 'bg-green-600 hover:bg-green-700'
  }

  // Alert logic
  const totalDelta = token.delta_jup + token.delta_other
  let bgColorClass = 'bg-[#2a2a3e]/50 text-white'

  if (token.delta_jup > 20 && totalDelta > 200) {
    bgColorClass = 'bg-red-400/25 text-white'
    triggerAlert('🚨 High Jupiter Activity!')
  } else if (token.delta_jup > 10 && totalDelta > 100) {
    bgColorClass = 'bg-yellow-400/25 text-white'
    triggerAlert('⚠️ Medium Jupiter Activity')
  }

  const formattedTime = formatTime(token.since_tge)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <Card className={`${bgColorClass} border-0`}>
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold truncate flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-primary">
                    {isLoadingTokenName ? (
                      <span className="inline-flex items-center gap-1">
                        <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        Loading...
                      </span>
                    ) : (
                      getTickerName()
                    )}
                  </span>
                  <span className="text-gray-400 text-xs">•</span>
                  <span className="text-xs text-gray-400 truncate">{token.mint}</span>
                </div>
              </CardTitle>
              <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                {formattedTime}
              </span>
            </div>
            {poolExists !== null && (
              <div className="flex justify-start">
                <span className={`px-2 py-1 text-xs rounded-full inline-block ${
                  poolExists 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}>
                  {poolExists ? 'Pool Exists' : 'No Pool'}
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Changes Jupiter</div>
            <div className="text-lg text-green-500">+{token.delta_jup}</div>
          </div>
          <div>
            <div className="text-gray-400">Changes Non-Jupiter</div>
            <div className="text-lg">+{token.delta_other}</div>
          </div>
          <div>
            <div className="text-gray-400">Jupiter Txs Pct</div>
            <div className="text-lg text-green-500">{token.jupiter_pct.toFixed(2)}%</div>
          </div>
          <div></div>
          <div>
            <div className="text-gray-400">Total Jupiter Txs</div>
            <div>{token.total_jupiter}</div>
          </div>
          <div>
            <div className="text-gray-400">Total Non-Jupiter Txs</div>
            <div>{token.total}</div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button className="flex-1 bg-[#4a4a6e] hover:bg-[#5a5a7e]" onClick={handleOpenGMGN}>
              GMGN
            </Button>
            <Button className="flex-1 bg-[#4a4a6e] hover:bg-[#5a5a7e]" onClick={handlePumpSwap}>
              SWAP
            </Button>
          </div>
          
          <Button 
            className="w-full bg-primary hover:bg-secondary" 
            onClick={handleCreatePool}
          >
            Create Pool
          </Button>
          
          {poolExists && (
            <Button 
              className={`w-full ${getViewPoolButtonStyle()}`} 
              onClick={handleViewPool}
              disabled={isCheckingPool || poolExists === null}
            >
              {getViewPoolButtonText()}
            </Button>
          )}
          
          {poolExists === null && isCheckingPool && (
            <Button className="w-full bg-gray-500 hover:bg-gray-600" disabled>
              Checking Pool...
            </Button>
          )}

          {/* Pool List Dropdown */}
          {showPoolList && availablePools.length > 0 && (
            <div className="w-full bg-[#1a1a2e] border border-gray-600 rounded-lg max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
              <div className="p-2">
                <div className="text-xs text-gray-400 mb-2 font-medium">Available Pools (sorted by TVL)</div>
                {availablePools.map((pool) => (
                  <div
                    key={pool.pool_address}
                    onClick={() => handlePoolSelect(pool)}
                    className="p-3 hover:bg-[#2a2a3e] rounded cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white mb-1">
                          {pool.token_a_symbol}/{pool.token_b_symbol}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {pool.pool_address.slice(0, 8)}...{pool.pool_address.slice(-8)}
                        </div>
                      </div>
                      <div className="text-right ml-3 space-y-1">
                        <div className="text-sm font-medium text-green-400">
                          {formatTVL(pool.tvl)}
                        </div>
                        <div className="text-xs text-blue-400">
                          Fee: {formatFeePercentage(pool.base_fee || 0, pool.dynamic_fee || 0)}
                        </div>
                        <div className="text-xs text-yellow-400">
                          {getFeeScheduleText(pool.fee_scheduler_mode || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Custom scrollbar styles */}
              <style jsx>{`
                .scrollbar-thin::-webkit-scrollbar {
                  width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                  background: #374151;
                  border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                  background: #6b7280;
                  border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                  background: #9ca3af;
                }
                .scrollbar-thin {
                  scrollbar-width: thin;
                  scrollbar-color: #6b7280 #374151;
                }
              `}</style>
            </div>
          )}

          {showPoolList && isLoadingPools && (
            <div className="w-full bg-[#1a1a2e] border border-gray-600 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-400">Loading available pools...</div>
            </div>
          )}

          {showPoolList && !isLoadingPools && availablePools.length === 0 && (
            <div className="w-full bg-[#1a1a2e] border border-gray-600 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-400">No pools found for this token</div>
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}