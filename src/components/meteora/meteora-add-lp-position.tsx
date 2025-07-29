'use client'

import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Import Meteora DLMM SDK
import DLMM, { StrategyType } from '@meteora-ag/dlmm'
import { BN } from '@coral-xyz/anchor'

interface AddLPPositionProps {
  pairAddress: string
  pairName: string
  isSOLPair: boolean
}

export function AddLPPosition({ pairAddress, pairName, isSOLPair }: AddLPPositionProps) {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [solAmount, setSolAmount] = useState('')
  const [error, setError] = useState('')
  const [txSignature, setTxSignature] = useState('')

  // Check if this is a SOL pair (SOL as one of the tokens)
  if (!isSOLPair) {
    return null // Only show for SOL pairs
  }

  // Polling-based confirmation method
  const confirmTransactionWithPolling = async (signature: string, maxRetries = 30): Promise<boolean> => {
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

  const handleAddPosition = async () => {
    if (!publicKey || !sendTransaction) {
      setError('Please connect your wallet')
      return
    }

    if (!solAmount || parseFloat(solAmount) < 0.02) {
      setError('Minimum SOL amount is 0.02 SOL')
      return
    }

    setIsLoading(true)
    setError('')
    setTxSignature('')

    try {
      console.log('Creating DLMM pool instance...')
      
      // Create DLMM pool instance
      const dlmmPool = await DLMM.create(connection, new PublicKey(pairAddress))
      
      console.log('Getting active bin...')
      // Get active bin information
      const activeBin = await dlmmPool.getActiveBin()
      
      console.log('Active bin:', activeBin)
      
      // Check which token is SOL
      const SOL_MINT = 'So11111111111111111111111111111111111111112'
      const isTokenXSOL = dlmmPool.tokenX.publicKey.toString() === SOL_MINT
      const isTokenYSOL = dlmmPool.tokenY.publicKey.toString() === SOL_MINT
      
      if (!isTokenXSOL && !isTokenYSOL) {
        throw new Error('This pair does not contain SOL')
      }
      
      console.log('SOL token detected:', isTokenXSOL ? 'Token X' : 'Token Y')
      
      // Calculate range for one-sided position - always use 69 bins
      const NUM_BINS = 69
      const minBinId = activeBin.binId
      const maxBinId = activeBin.binId + NUM_BINS
      
      console.log('Position range: 69 bins from', { minBinId, maxBinId })
      
      // Convert SOL amount to lamports
      const solInLamports = new BN(parseFloat(solAmount) * LAMPORTS_PER_SOL)
      
      // Set amounts for one-sided position (SOL only)
      let totalXAmount: BN
      let totalYAmount: BN
      
      if (isTokenXSOL) {
        totalXAmount = solInLamports
        totalYAmount = new BN(0) // No other token
      } else {
        totalXAmount = new BN(0) // No other token  
        totalYAmount = solInLamports
      }
      
      console.log('Position amounts:', {
        totalXAmount: totalXAmount.toString(),
        totalYAmount: totalYAmount.toString()
      })
      
      // Generate new position keypair
      const newPosition = new Keypair()
      console.log('New position address:', newPosition.publicKey.toString())
      
      // Create one-sided liquidity position with BidAsk strategy
      console.log('Creating position transaction...')
      const createPositionTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
        positionPubKey: newPosition.publicKey,
        user: publicKey,
        totalXAmount,
        totalYAmount,
        strategy: {
          maxBinId,
          minBinId,
          strategyType: StrategyType.BidAsk, // Use BidAsk for better one-sided concentration
        },
      })
      
      console.log('Sending transaction...')
      
      // Send transaction
      const signature = await sendTransaction(createPositionTx, connection, {
        signers: [newPosition]
      })
      
      console.log('Transaction sent:', signature)
      setTxSignature(signature)
      
      // Use polling-based confirmation instead of WebSocket subscription
      console.log('Confirming transaction with polling method...')
      await confirmTransactionWithPolling(signature)
      
      console.log('Position address:', newPosition.publicKey.toString())
      
      // Close modal on success
      setIsOpen(false)
      setSolAmount('')
      
      // Show success message
      alert(`LP Position Created Successfully!\n\nTransaction: ${signature}\nPosition: ${newPosition.publicKey.toString()}`)
      
    } catch (err: any) {
      console.error('Error creating LP position:', err)
      setError(err.message || 'Failed to create LP position')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add LP
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add BidAsk LP Position</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>BidAsk Strategy:</strong> Concentrates your SOL liquidity more efficiently around the current price for higher fee capture when traders swap.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pair">Selected Pair</Label>
            <div className="p-2 bg-muted rounded-md text-sm font-mono">
              {pairName}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="solAmount">SOL Amount</Label>
            <Input
              id="solAmount"
              type="number"
              placeholder="0.02"
              value={solAmount}
              onChange={(e) => setSolAmount(e.target.value)}
              min="0.02"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">
              Minimum required: 0.02 SOL
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="range">Price Range</Label>
            <div className="p-2 bg-muted rounded-md text-sm">
              Fixed at 69 bins for optimal liquidity concentration
            </div>
            <p className="text-xs text-muted-foreground">
              Using 69 bins provides the perfect balance between concentration and range coverage.
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {txSignature && (
            <Alert>
              <AlertDescription>
                <strong>Transaction Sent:</strong>
                <br />
                <a 
                  href={`https://explorer.solana.com/tx/${txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-mono text-xs"
                >
                  {txSignature.slice(0, 8)}...{txSignature.slice(-8)}
                </a>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>69 Bins Strategy:</strong> Using exactly 69 bins provides optimal liquidity concentration for BidAsk positions, balancing fee capture efficiency with adequate price range coverage.
            </p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> This will create a new liquidity position. Position rent (~0.057 SOL) is refundable when you close the position.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddPosition} 
            disabled={isLoading || !publicKey}
          >
            {isLoading ? 'Creating Position...' : 'Add LP Position'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}