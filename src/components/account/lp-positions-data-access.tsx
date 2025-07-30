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
        
        // Use environment variable for heavy RPC or fall back to a reliable public RPC
        const heavyRpcUrl = process.env.NEXT_PUBLIC_HEAVY_RPC_URL || 
                           process.env.NEXT_PUBLIC_RPC_URL || 
                           'https://api.mainnet-beta.solana.com'
                           
        const heavyConnection = new (await import('@solana/web3.js')).Connection(
          heavyRpcUrl,
          { 
            commitment: 'confirmed',
            httpHeaders: {
              "Content-Type": "application/json",
            }
          }
        )
        
        console.log('Using RPC for position discovery:', heavyRpcUrl)
        const positionsMap = await DLMM.getAllLbPairPositionsByUser(heavyConnection, address)
        
        console.log('Positions map size:', positionsMap.size)
        
        const lpPositions: LPPosition[] = []
        
        // Process positions with rate limiting
        let processedPairs = 0
        const maxPairs = 10 // Limit to first 10 pairs to avoid overwhelming
        
        // Iterate through each pair that has positions
        for (const [lbPairAddress, positionInfo] of positionsMap.entries()) {
          if (processedPairs >= maxPairs) {
            console.log(`Limiting to first ${maxPairs} pairs to avoid rate limits`)
            break
          }
          
          try {
            console.log('Processing pair:', lbPairAddress, 'Position info type:', typeof positionInfo)
            
            // Create DLMM instance for this pair using regular connection
            const dlmmPool = await DLMM.create(connection, new PublicKey(lbPairAddress))
            
            // The positionInfo might be an array of PublicKeys or a different structure
            let positionPubkeys: PublicKey[] = []
            
            if (Array.isArray(positionInfo)) {
              positionPubkeys = positionInfo
            } else if (positionInfo && typeof positionInfo === 'object') {
              positionPubkeys = (positionInfo as any).positions || []
            } else {
              console.log('Unexpected positionInfo structure:', positionInfo)
              continue
            }
            
            console.log('Found', positionPubkeys.length, 'position(s) in pair:', lbPairAddress)
            
            // Process each position with delay to avoid rate limits
            for (const positionPubkey of positionPubkeys) {
              try {
                // Get position details
                const position = await dlmmPool.getPosition(positionPubkey)
                
                if (position) {
                  // Get pair name from the tokens
                  let pairName = 'Unknown Pair'
                  try {
                    const tokenXMint = dlmmPool.tokenX.publicKey.toString()
                    const tokenYMint = dlmmPool.tokenY.publicKey.toString()
                    
                    // Create readable names based on known mints
                    const getTokenSymbol = (mint: string) => {
                      const tokenMap: { [key: string]: string } = {
                        'So11111111111111111111111111111111111111112': 'SOL',
                        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
                        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
                        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
                        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP',
                        'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk': 'WEN',
                        'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
                        'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'jitoSOL'
                      }
                      return tokenMap[mint] || mint.slice(0, 4) + '...'
                    }
                    
                    pairName = `${getTokenSymbol(tokenXMint)}/${getTokenSymbol(tokenYMint)}`
                  } catch (nameError) {
                    console.warn('Error getting pair name:', nameError)
                  }
                  
                  lpPositions.push({
                    address: positionPubkey.toString(),
                    pairAddress: lbPairAddress,
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
                }
                
                // Small delay between position processing to be nice to RPC
                await new Promise(resolve => setTimeout(resolve, 50))
                
              } catch (positionError) {
                console.warn(`Error processing position ${positionPubkey.toString()}:`, positionError)
              }
            }
            
            processedPairs++
            
            // Delay between pairs to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 200))
            
          } catch (pairError: any) {
            console.warn(`Error processing pair ${lbPairAddress}:`, pairError?.message || 'Unknown error')
          }
        }
        
        console.log('Successfully processed', lpPositions.length, 'LP positions')
        return lpPositions
      } catch (error) {
        console.error('Error fetching LP positions:', error)
        
        // If getAllLbPairPositionsByUser fails, fall back to empty array
        console.log('Falling back to empty positions array')
        return []
      }
    },
    staleTime: 60 * 1000, // 1 minute - longer cache since this is expensive
    retry: 1,
    refetchOnWindowFocus: false, // Don't refetch on focus to avoid rate limits
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
        
        // Create DLMM instance for the pair
        const dlmmPool = await DLMM.create(connection, new PublicKey(pairAddress))
        
        // Get the position details
        const position = await dlmmPool.getPosition(new PublicKey(positionAddress))
        if (!position) {
          throw new Error('Position data not found')
        }

        console.log('Position found, creating close transaction...')
        
        // Create close position transaction using the correct SDK method
        const closePositionTx = await dlmmPool.closePosition({
          owner: address,
          position: position,
        })

        console.log('Sending close position transaction...')
        
        // Send transaction
        const signature = await sendTransaction(closePositionTx, connection)
        
        console.log('Close position transaction sent:', signature)
        
        // Confirm transaction with polling
        await confirmTransactionWithPolling(signature, connection)
        
        console.log('Position closed successfully!')
        return signature
        
      } catch (error: any) {
        console.error('Error closing position:', error)
        throw new Error(error.message || 'Failed to close position')
      }
    },
    onSuccess: async (signature) => {
      console.log('Position closed successfully:', signature)
      
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
      console.error('Close position failed:', error)
    },
  })
}

// Polling-based transaction confirmation
const confirmTransactionWithPolling = async (
  signature: string, 
  connection: any, 
  maxRetries = 30
): Promise<boolean> => {
  console.log('Starting transaction confirmation with polling...')
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true })
      
      console.log(`Attempt ${attempt + 1}: Transaction status:`, status.value)
      
      if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
        if (status.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
        }
        console.log('Transaction confirmed successfully!')
        return true
      }
      
      if (status.value?.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
      }
      
      // Wait 2 seconds before next attempt
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
  
  throw new Error('Transaction confirmation timeout after 60 seconds')
}