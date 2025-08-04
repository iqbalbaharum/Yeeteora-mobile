// src/components/account/lp-positions-data-access.tsx
'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import DLMM from '@meteora-ag/dlmm'

// Export the interface
export interface LPPosition {
  address: string
  pairAddress: string
  pairName: string
  owner: string
  lowerBinId: number
  upperBinId: number
  lastUpdatedAt: string
  totalXAmount: string
  totalYAmount: string
  binData: Array<{
    binId: number
    xAmount: string
    yAmount: string
    supply: string
  }>
  pair?: {
    name: string
    mint_x: string
    mint_y: string
    current_price: number
  }
}

// Interface for Meteora API pair data
interface MeteoraApiPair {
  address: string
  name: string
  mint_x: string
  mint_y: string
  current_price: number
  trade_volume_24h: number
  liquidity: string
  hide: boolean
  is_blacklisted: boolean
}

interface MeteoraApiResponse {
  groups: Array<{
    name: string
    pairs: MeteoraApiPair[]
  }>
}

// Active pairs scan - checks most active pairs for user positions
async function discoverViaActivePairs(
  userAddress: PublicKey, 
  connection: any,
  maxPairsToCheck: number = 100
): Promise<LPPosition[]> {
  console.log('🔍 Starting position discovery via active pairs scan...')
  console.log(`👤 User address: ${userAddress.toString()}`)
  
  try {
    // Get all pairs from Meteora API
    console.log('📡 Fetching pairs from Meteora API...')
    const response = await fetch('https://dlmm-api.meteora.ag/pair/all_by_groups')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch pairs from Meteora API: ${response.status}`)
    }
    
    const meteoraData: MeteoraApiResponse = await response.json()
    const allPairs = meteoraData.groups.flatMap(group => group.pairs)
    
    console.log(`📊 Total pairs from API: ${allPairs.length}`)
    
    // Filter and sort pairs by activity (volume + liquidity)
    const activePairs = allPairs
      .filter(pair => {
        // Filter out hidden, blacklisted, or pairs with no data
        const isValid = !pair.hide && 
                       !pair.is_blacklisted && 
                       pair.liquidity && 
                       parseFloat(pair.liquidity) > 0 &&
                       pair.trade_volume_24h > 0
        
        if (!isValid) {
          console.log(`⏭️  Skipping pair ${pair.name}: hidden=${pair.hide}, blacklisted=${pair.is_blacklisted}, liquidity=${pair.liquidity}, volume=${pair.trade_volume_24h}`)
        }
        
        return isValid
      })
      .sort((a, b) => {
        // Sort by combined score of volume and liquidity for better prioritization
        const scoreA = (a.trade_volume_24h || 0) + (parseFloat(a.liquidity || '0') / 1000) // Normalize liquidity
        const scoreB = (b.trade_volume_24h || 0) + (parseFloat(b.liquidity || '0') / 1000)
        return scoreB - scoreA
      })
      .slice(0, maxPairsToCheck) // Limit to prevent timeout
    
    console.log(`🎯 Will check ${activePairs.length} most active pairs for positions`)
    console.log(`🏆 Top 5 pairs by activity:`)
    activePairs.slice(0, 5).forEach((pair, idx) => {
      console.log(`   ${idx + 1}. ${pair.name} - Volume: $${pair.trade_volume_24h?.toLocaleString()}, TVL: $${parseFloat(pair.liquidity)?.toLocaleString()}`)
    })
    
    const allPositions: LPPosition[] = []
    let checkedCount = 0
    let foundPositionsCount = 0
    
    // Check each pair for user positions
    for (const pair of activePairs) {
      try {
        checkedCount++
        
        if (checkedCount % 10 === 0) {
          console.log(`🔄 Progress: ${checkedCount}/${activePairs.length} pairs checked, ${foundPositionsCount} positions found so far`)
        }
        
        // Create DLMM instance for this pair
        const dlmmPool = await DLMM.create(connection, new PublicKey(pair.address))
        
        // Check for user positions in this pair
        const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(userAddress)
        
        if (userPositions && userPositions.length > 0) {
          foundPositionsCount++
          console.log(`✅ FOUND ${userPositions.length} position(s) in ${pair.name} (${pair.address})`)
          
          // Process each position found
          for (const position of userPositions) {
            try {
              const positionData = {
                address: position.publicKey.toString(),
                pairAddress: pair.address,
                pairName: pair.name,
                owner: userAddress.toString(),
                lowerBinId: position.positionData.lowerBinId,
                upperBinId: position.positionData.upperBinId,
                lastUpdatedAt: position.positionData.lastUpdatedAt.toString(),
                totalXAmount: position.positionData.totalXAmount.toString(),
                totalYAmount: position.positionData.totalYAmount.toString(),
                binData: position.positionData.positionBinData.map((bin: any) => ({
                  binId: bin.binId,
                  xAmount: bin.xAmount?.toString() || '0',
                  yAmount: bin.yAmount?.toString() || '0',
                  supply: bin.binLiquidity?.toString() || '0'
                })),
                pair: {
                  name: pair.name,
                  mint_x: pair.mint_x,
                  mint_y: pair.mint_y,
                  current_price: pair.current_price || 0,
                }
              }
              
              allPositions.push(positionData)
              
              console.log(`📍 Position details:`)
              console.log(`   Address: ${positionData.address}`)
              console.log(`   Bins: ${positionData.lowerBinId} - ${positionData.upperBinId}`)
              console.log(`   X Amount: ${positionData.totalXAmount}`)
              console.log(`   Y Amount: ${positionData.totalYAmount}`)
              
            } catch (positionError: any) {
              console.warn(`⚠️  Error processing position in ${pair.name}:`, positionError?.message)
            }
          }
        }
        
        // Add small delay every 10 pairs to prevent overwhelming the RPC
        if (checkedCount % 10 === 0 && checkedCount < activePairs.length) {
          console.log('⏸️  Brief pause to prevent RPC overload...')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (pairError: any) {
        console.warn(`⚠️  Error checking pair ${pair.name} (${pair.address}):`, pairError?.message)
        // Continue to next pair - don't let one pair failure stop the whole process
      }
    }
    
    console.log(`🎉 DISCOVERY COMPLETE!`)
    console.log(`📊 Final Results:`)
    console.log(`   - Checked: ${checkedCount} pairs`)
    console.log(`   - Found: ${allPositions.length} total positions`)
    console.log(`   - Pairs with positions: ${foundPositionsCount}`)
    
    if (allPositions.length > 0) {
      console.log(`🏆 Position Summary:`)
      allPositions.forEach((pos, idx) => {
        console.log(`   ${idx + 1}. ${pos.pairName} - Position: ${pos.address}`)
      })
    } else {
      console.log(`ℹ️  No positions found. This could mean:`)
      console.log(`   - User has no LP positions`)
      console.log(`   - Positions are in pairs outside top ${maxPairsToCheck} most active`)
      console.log(`   - Positions were recently created and not yet indexed`)
    }
    
    return allPositions
    
  } catch (error: any) {
    console.error('❌ Active pairs discovery failed:', error)
    throw error
  }
}

// Export the hook to get all LP positions for a wallet
export function useGetLPPositions({ address }: { address: PublicKey }) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-lp-positions', { endpoint: connection.rpcEndpoint, address: address.toString() }],
    queryFn: async (): Promise<LPPosition[]> => {
      try {
        console.log('🚀 Starting LP position discovery...')
        console.log(`🌐 RPC Endpoint: ${connection.rpcEndpoint}`)
        
        // Use custom RPC for heavy operations if available
        const customRpcUrl = process.env.NEXT_PUBLIC_Custom_RPC_URL ||
          process.env.NEXT_PUBLIC_HEAVY_RPC_URL ||
          process.env.NEXT_PUBLIC_RPC_URL ||
          connection.rpcEndpoint
        
        console.log(`🔧 Using RPC for discovery: ${customRpcUrl}`)
        
        // Create optimized connection for heavy operations
        const discoveryConnection = customRpcUrl !== connection.rpcEndpoint
          ? new (await import('@solana/web3.js')).Connection(
              customRpcUrl,
              {
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 60000,
                httpHeaders: {
                  "Content-Type": "application/json",
                }
              }
            )
          : connection
        
        // Test connection first
        try {
          console.log('🧪 Testing RPC connection...')
          const version = await discoveryConnection.getVersion()
          console.log('✅ RPC connection successful:', version)
        } catch (rpcError: any) {
          console.error('❌ RPC connection test failed:', rpcError)
          throw new Error(`RPC connection failed: ${rpcError?.message || 'Unknown RPC error'}`)
        }
        
        // Start position discovery
        const positions = await discoverViaActivePairs(address, discoveryConnection, 100)
        
        return positions
        
      } catch (error: any) {
        console.error('❌ LP position discovery failed:', error)
        
        // Enhanced error handling and guidance
        const errorMessage = error?.message || 'Unknown error'
        
        if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
          console.error('💡 RPC Error Solution:')
          console.error('   - Your RPC is blocking heavy operations (getProgramAccounts)')
          console.error('   - Set NEXT_PUBLIC_Custom_RPC_URL in your .env.local file')
          console.error('   - Use a paid RPC provider like Alchemy, QuickNode, or Helius')
        } else if (errorMessage.includes('timeout')) {
          console.error('💡 Timeout Error Solution:')
          console.error('   - Position discovery took longer than expected')
          console.error('   - Try again in a few minutes')
          console.error('   - Consider using a faster RPC provider')
        } else if (errorMessage.includes('connection')) {
          console.error('💡 Connection Error Solution:')
          console.error('   - Check your internet connection')
          console.error('   - Verify your RPC URL is correct')
          console.error('   - Try switching to a different RPC endpoint')
        } else {
          console.error(`💡 Unexpected Error: ${errorMessage}`)
          console.error('   - This might be a temporary issue')
          console.error('   - Try refreshing the page')
        }
        
        // Return empty array instead of throwing to prevent UI crashes
        return []
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - positions don't change frequently
    retry: (failureCount, error: any) => {
      const errorMessage = error?.message || 'Unknown error'
      
      // Don't retry certain errors that won't resolve with retries
      if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        console.log('❌ Not retrying 403 errors - RPC configuration issue')
        return false
      }
      if (errorMessage.includes('connection')) {
        console.log('❌ Not retrying connection errors - check RPC URL')
        return false
      }
      
      console.log(`🔄 Retrying position discovery... (attempt ${failureCount + 1}/3)`)
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 30000)
      console.log(`⏳ Waiting ${delay}ms before retry...`)
      return delay
    },
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid excessive API calls
  })
}

// Export the hook to close an LP position
export function useCloseLPPosition({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const { sendTransaction } = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['close-lp-position', { endpoint: connection.rpcEndpoint, address: address.toString() }],
    mutationFn: async ({ positionAddress, pairAddress }: { positionAddress: string; pairAddress: string }) => {
      if (!sendTransaction) {
        throw new Error('Wallet not connected')
      }

      try {
        console.log('Starting close position for:', positionAddress, 'in pair:', pairAddress)

        // Use custom RPC for closing positions too
        const customRpcUrl = process.env.NEXT_PUBLIC_Custom_RPC_URL || connection.rpcEndpoint
        const closeConnection = customRpcUrl !== connection.rpcEndpoint
          ? new (await import('@solana/web3.js')).Connection(customRpcUrl, { commitment: 'confirmed' })
          : connection

        console.log('Using RPC for position closure:', customRpcUrl)

        // Create DLMM instance for the pair
        const dlmmPool = await DLMM.create(closeConnection, new PublicKey(pairAddress))

        // Get the position details
        const position = await dlmmPool.getPosition(new PublicKey(positionAddress))
        if (!position) {
          throw new Error('Position data not found')
        }

        console.log('Position found, creating close transaction...')

        const totalX = Number(position.positionData.totalXAmount.toString())
        const totalY = Number(position.positionData.totalYAmount.toString())

        console.log(`📊 Position totals: X=${totalX}, Y=${totalY}`)

        const hasLiquidity = totalX > 0 || totalY > 0
        console.log(`🔍 Position has liquidity: ${hasLiquidity}`)

        let signature: string

        if (hasLiquidity) {
          console.log('✅ Position has liquidity, removing all liquidity first...')

          const removeLiquidityResult = await dlmmPool.removeLiquidity({
            user: address,
            position: new PublicKey(positionAddress),
            fromBinId: position.positionData.lowerBinId,
            toBinId: position.positionData.upperBinId,
            bps: new (await import('@coral-xyz/anchor')).BN(10000), // 100% in basis points
            shouldClaimAndClose: true, // This will claim fees and close the position
          })

          console.log('Sending remove liquidity and close transaction...')

          if (Array.isArray(removeLiquidityResult)) {
            let lastSignature = ''
            for (const [index, tx] of removeLiquidityResult.entries()) {
              console.log(`Sending transaction ${index + 1}/${removeLiquidityResult.length}...`)
              lastSignature = await sendTransaction(tx, connection)
              console.log(`Transaction ${index + 1} sent:`, lastSignature)

              if (index < removeLiquidityResult.length - 1) {
                await confirmTransactionWithPolling(lastSignature, connection)
              }
            }
            signature = lastSignature
          } else {
            signature = await sendTransaction(removeLiquidityResult, connection)
          }

          console.log('Remove liquidity and close transaction(s) sent:', signature)

        } else {
          console.log('✅ Position is empty, closing directly...')

          const closePositionTx = await dlmmPool.closePosition({
            owner: address,
            position: position,
          })

          console.log('Sending close position transaction...')
          signature = await sendTransaction(closePositionTx, connection)
          console.log('Close position transaction sent:', signature)
        }

        await confirmTransactionWithPolling(signature, connection)

        console.log('🎉 Position closed successfully!')
        return signature

      } catch (error: any) {
        console.error('❌ Error closing position:', error)
        throw new Error(error.message || 'Failed to close position')
      }
    },
    onSuccess: async (signature) => {
      console.log('✅ Position closed successfully:', signature)

      // Invalidate relevant queries to refresh the UI
      await Promise.all([
        client.invalidateQueries({
          queryKey: ['get-lp-positions', { endpoint: connection.rpcEndpoint, address: address.toString() }],
        }),
        client.invalidateQueries({
          queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-token-accounts', { endpoint: connection.rpcEndpoint, address }],
        }),
      ])
    },
    onError: (error) => {
      console.error('❌ Close position failed:', error)
    },
  })
}

// Helper function for transaction confirmation
const confirmTransactionWithPolling = async (
  signature: string,
  connection: any,
  maxRetries = 45
): Promise<boolean> => {
  console.log('🔄 Starting transaction confirmation with polling...')

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true })

      console.log(`Attempt ${attempt + 1}/${maxRetries}: Transaction status:`, status.value)

      if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
        if (status.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
        }
        console.log('✅ Transaction confirmed successfully!')
        return true
      }

      if (status.value?.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
      }

      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.warn(`Confirmation attempt ${attempt + 1} failed:`, error)

      if (attempt === maxRetries - 1) {
        throw error
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  throw new Error('Transaction confirmation timeout after 90 seconds')
}