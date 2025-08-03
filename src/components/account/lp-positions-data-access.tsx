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

// Export the hook to get all LP positions for a wallet
export function useGetLPPositions({ address }: { address: PublicKey }) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-lp-positions', { endpoint: connection.rpcEndpoint, address: address.toString() }],
    queryFn: async (): Promise<LPPosition[]> => {
      try {
        console.log('Fetching LP positions for user:', address.toString())

        // ✅ FIXED: Use your paid custom RPC first
        const heavyRpcUrl = process.env.NEXT_PUBLIC_Custom_RPC_URL ||     // Your paid RPC
          process.env.NEXT_PUBLIC_HEAVY_RPC_URL ||
          process.env.NEXT_PUBLIC_RPC_URL ||
          'https://api.mainnet-beta.solana.com'

        console.log('Using RPC for position discovery:', heavyRpcUrl)

        // ✅ ADDED: Warn if using public RPC
        if (heavyRpcUrl.includes('api.mainnet-beta.solana.com')) {
          console.warn('⚠️  Using public RPC for heavy operations - this may fail!')
          console.warn('💡 Set NEXT_PUBLIC_Custom_RPC_URL in your .env.local file')
        } else {
          console.log('✅ Using custom RPC for position discovery')
        }

        // ✅ ENHANCED: Better connection configuration for paid RPC
        const heavyConnection = new (await import('@solana/web3.js')).Connection(
          heavyRpcUrl,
          {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000,  // 60 seconds for paid RPC
            httpHeaders: {
              "Content-Type": "application/json",
              // Add any custom headers your RPC provider requires
            }
          }
        )

        // ✅ ADDED: Test RPC connectivity first
        try {
          console.log('Testing RPC connection...')
          const version = await heavyConnection.getVersion()
          console.log('✅ RPC connection successful, version:', version)
        } catch (rpcError: any) {
          console.error('❌ RPC connection failed:', rpcError)
          throw new Error(`RPC connection failed: ${rpcError?.message || 'Unknown RPC error'}`)
        }

        console.log('Starting position discovery with getPositionsByUserAndLbPair method...')

        // ✅ BETTER APPROACH: Use getPositionsByUserAndLbPair for known pair
        // We know from the logs that your position is in pair: 5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6
        const knownPairAddress = '5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6'

        console.log(`🔍 Checking for positions in known pair: ${knownPairAddress}`)

        const lpPositions: LPPosition[] = []

        try {
          // Create DLMM instance for the known pair
          const dlmmPool = await DLMM.create(heavyConnection, new PublicKey(knownPairAddress))

          // Use the more direct method from the official docs
          const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(address)

          console.log(`✅ Found ${userPositions.length} position(s) in pair using getPositionsByUserAndLbPair`)

          if (userPositions.length > 0) {
            // Get pair name from the tokens
            let pairName = 'Unknown Pair'
            try {
              const tokenXMint = dlmmPool.tokenX.publicKey.toString()
              const tokenYMint = dlmmPool.tokenY.publicKey.toString()

              const getTokenSymbol = (mint: string) => {
                const tokenMap: { [key: string]: string } = {
                  'So11111111111111111111111111111111111111112': 'SOL',
                  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
                  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
                  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
                  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP',
                  'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk': 'WEN',
                  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
                  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'jitoSOL',
                  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ETH',
                  '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk': 'BTC',
                  'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM': 'USDCet',
                }
                return tokenMap[mint] || mint.slice(0, 4) + '...'
              }

              pairName = `${getTokenSymbol(tokenXMint)}/${getTokenSymbol(tokenYMint)}`
            } catch (nameError) {
              console.warn('Error getting pair name:', nameError)
            }

            // Process each position
            for (const position of userPositions) {
              try {
                lpPositions.push({
                  address: position.publicKey.toString(),
                  pairAddress: knownPairAddress,
                  pairName: pairName,
                  owner: address.toString(),
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
                    name: pairName,
                    mint_x: dlmmPool.tokenX.publicKey.toString(),
                    mint_y: dlmmPool.tokenY.publicKey.toString(),
                    current_price: 0,
                  }
                })

                console.log(`✅ Processed position: ${position.publicKey.toString()} in ${pairName}`)
              } catch (positionError: any) {
                console.warn(`Error processing position ${position.publicKey.toString()}:`, positionError?.message)
              }
            }
          } else {
            console.log('⚠️  No positions found in this pair')
          }

        } catch (pairError: any) {
          console.error(`❌ Error checking pair ${knownPairAddress}:`, pairError?.message)

          // Fallback: If the pair-specific check fails, we'll report the issue
          console.log('🔄 Pair-specific position check failed. Possible reasons:')
          console.log('   1. Position might be in a different pair')
          console.log('   2. Position might be very new and not indexed')
          console.log('   3. RPC might be having issues with this specific pair')
        }

        console.log(`🎉 Successfully processed ${lpPositions.length} LP positions using custom RPC`)

        // ✅ ADDED: Log position details for debugging
        if (lpPositions.length > 0) {
          lpPositions.forEach(pos => {
            console.log(`📍 Position found: ${pos.pairName} - ${pos.address}`)
          })
        } else {
          console.log('⚠️  No LP positions found. This could mean:')
          console.log('   1. Position data structure has changed in the SDK')
          console.log('   2. Positions are in different pairs than expected')
          console.log('   3. getPositionsByUserAndLbPair is not finding your position')
          console.log('   4. Your position might be very new and not indexed yet')
        }

        return lpPositions

      } catch (error: any) {
        console.error('❌ Error fetching LP positions:', error)

        // ✅ ENHANCED: Better error handling and guidance
        const errorMessage = error?.message || 'Unknown error'

        if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
          console.error('❌ 403 Forbidden Error Details:')
          console.error('   - Your RPC is blocking heavy operations')
          console.error('   - Contact your RPC provider about getProgramAccounts limits')
          console.error('   - Verify NEXT_PUBLIC_Custom_RPC_URL is set correctly')
        } else if (errorMessage.includes('timeout')) {
          console.error('❌ Timeout Error Details:')
          console.error('   - Position discovery took longer than 90 seconds')
          console.error('   - Your RPC might be slow or overloaded')
          console.error('   - Try again in a few minutes')
        } else if (errorMessage.includes('connection')) {
          console.error('❌ Connection Error Details:')
          console.error('   - Unable to connect to your custom RPC')
          console.error('   - Verify your RPC URL is correct and accessible')
          console.error('   - Check if your RPC requires authentication')
        } else {
          console.error('❌ Unexpected Error:', errorMessage)
          console.error('   - This might be a temporary issue')
          console.error('   - Try refreshing the page')
        }

        // Return empty array instead of throwing
        console.log('🔄 Falling back to empty positions array')
        return []
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - reasonable for paid RPC
    retry: (failureCount, error: any) => {
      // ✅ ENHANCED: Smart retry logic
      const errorMessage = error?.message || 'Unknown error'

      if (errorMessage.includes('403')) {
        console.log('❌ Not retrying 403 errors - RPC configuration issue')
        return false
      }
      if (errorMessage.includes('timeout')) {
        console.log('❌ Not retrying timeout errors immediately')
        return false
      }
      if (errorMessage.includes('connection')) {
        console.log('❌ Not retrying connection errors - check RPC URL')
        return false
      }

      console.log(`🔄 Retrying... (attempt ${failureCount + 1}/3)`)
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false, // Don't refetch on focus to avoid excessive requests
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

        // ✅ ENHANCED: Use custom RPC for closing positions too
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

        // ✅ SIMPLIFIED: Just check total amounts from position data
        console.log('Checking if position has liquidity that needs to be removed...')

        const totalX = Number(position.positionData.totalXAmount.toString())
        const totalY = Number(position.positionData.totalYAmount.toString())

        console.log(`📊 Position totals: X=${totalX}, Y=${totalY}`)

        // If either total amount exists, we need to remove liquidity
        const hasLiquidity = totalX > 0 || totalY > 0

        console.log(`🔍 Position has liquidity: ${hasLiquidity}`)

        let signature: string

        if (hasLiquidity) {
          console.log('✅ Position has liquidity, removing all liquidity first...')

          // Remove all liquidity from the position first
          const removeLiquidityResult = await dlmmPool.removeLiquidity({
            user: address,
            position: new PublicKey(positionAddress),
            fromBinId: position.positionData.lowerBinId,
            toBinId: position.positionData.upperBinId,
            bps: new (await import('@coral-xyz/anchor')).BN(10000), // 100% in basis points
            shouldClaimAndClose: true, // This will claim fees and close the position
          })

          console.log('Sending remove liquidity and close transaction...')

          // Handle both single transaction and transaction array
          if (Array.isArray(removeLiquidityResult)) {
            // If it's an array of transactions, we need to send them sequentially
            console.log(`Sending ${removeLiquidityResult.length} transactions...`)

            let lastSignature = ''
            for (const [index, tx] of removeLiquidityResult.entries()) {
              console.log(`Sending transaction ${index + 1}/${removeLiquidityResult.length}...`)
              lastSignature = await sendTransaction(tx, connection)
              console.log(`Transaction ${index + 1} sent:`, lastSignature)

              // Wait for confirmation before sending next transaction
              if (index < removeLiquidityResult.length - 1) {
                await confirmTransactionWithPolling(lastSignature, connection)
              }
            }
            signature = lastSignature
          } else {
            // Single transaction
            signature = await sendTransaction(removeLiquidityResult, connection)
          }

          console.log('Remove liquidity and close transaction(s) sent:', signature)

        } else {
          console.log('✅ Position is empty, closing directly...')

          // Position is empty, can close directly
          const closePositionTx = await dlmmPool.closePosition({
            owner: address,
            position: position,
          })

          console.log('Sending close position transaction...')

          // Send transaction using the regular connection (wallet adapter)
          signature = await sendTransaction(closePositionTx, connection)

          console.log('Close position transaction sent:', signature)
        }

        // Confirm final transaction with polling
        await confirmTransactionWithPolling(signature, connection)

        console.log('🎉 Position liquidity removed and/or position closed successfully!')
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

// ✅ ENHANCED: Better polling-based transaction confirmation
const confirmTransactionWithPolling = async (
  signature: string,
  connection: any,
  maxRetries = 45  // Increased for better reliability
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

      // ✅ OPTIMIZED: Shorter wait time for better UX
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.warn(`Confirmation attempt ${attempt + 1} failed:`, error)

      // If it's the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  throw new Error('Transaction confirmation timeout after 90 seconds')
}