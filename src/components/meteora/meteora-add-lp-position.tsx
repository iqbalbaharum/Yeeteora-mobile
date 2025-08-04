'use client'

import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, AlertCircle, TrendingUp, Coins, Settings, Info, ExternalLink, CheckCircle, ChevronDown, ChevronUp, Percent } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useGetBalance } from '../account/account-data-access'

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
  const [showStrategyInfo, setShowStrategyInfo] = useState(false)
  const [showNotesInfo, setShowNotesInfo] = useState(false)

  // Get wallet balance
  const balanceQuery = useGetBalance({ address: publicKey || new PublicKey('11111111111111111111111111111111') })
  const walletBalanceSOL = balanceQuery.data && publicKey ? balanceQuery.data / LAMPORTS_PER_SOL : 0

  // Function to set percentage of wallet balance
  const setPercentageAmount = (percentage: number) => {
    if (walletBalanceSOL > 0) {
      const amount = (walletBalanceSOL * percentage / 100)
      // Keep some SOL for transaction fees (at least 0.01 SOL)
      const maxUsable = Math.max(0, walletBalanceSOL - 0.01)
      const finalAmount = Math.min(amount, maxUsable)
      setSolAmount(Math.max(0, finalAmount).toFixed(3))
    }
  }

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

      // FIXED: Calculate range for one-sided BidAsk position - exactly 69 bins
      const NUM_BINS = 69
      let minBinId: number
      let maxBinId: number

      if (isTokenXSOL) {
        // SOL is Token X - place bins ABOVE current price for one-sided position
        // This creates a "bid" side where SOL is only used when price goes up
        minBinId = activeBin.binId + 1  // Start 1 bin above current price
        maxBinId = minBinId + (NUM_BINS - 1)  // Exactly 69 bins total
      } else {
        // SOL is Token Y - place bins BELOW current price for one-sided position
        // This creates an "ask" side where SOL is only used when price goes down
        maxBinId = activeBin.binId - 1  // End 1 bin below current price
        minBinId = maxBinId - (NUM_BINS - 1)  // Exactly 69 bins total
      }

      console.log('One-sided BidAsk position range:', { 
        minBinId, 
        maxBinId, 
        activeBinId: activeBin.binId,
        totalBins: maxBinId - minBinId + 1 
      })

      // Convert SOL amount to lamports
      const solInLamports = new BN(parseFloat(solAmount) * LAMPORTS_PER_SOL)

      // Set amounts for one-sided position (SOL only)
      let totalXAmount: BN
      let totalYAmount: BN

      if (isTokenXSOL) {
        totalXAmount = solInLamports  // All SOL goes to X
        totalYAmount = new BN(0)      // No Y token
      } else {
        totalXAmount = new BN(0)      // No X token
        totalYAmount = solInLamports  // All SOL goes to Y
      }

      console.log('Position amounts:', {
        totalXAmount: totalXAmount.toString(),
        totalYAmount: totalYAmount.toString(),
        isTokenXSOL,
        strategy: 'BidAsk one-sided'
      })

      // Generate new position keypair
      const newPosition = new Keypair()
      console.log('New position address:', newPosition.publicKey.toString())

      // Create one-sided liquidity position with BidAsk strategy and FIXED bin range
      console.log('Creating BidAsk position transaction...')
      const createPositionTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
        positionPubKey: newPosition.publicKey,
        user: publicKey,
        totalXAmount,
        totalYAmount,
        strategy: {
          maxBinId,
          minBinId,
          strategyType: StrategyType.BidAsk, // Keep BidAsk for asymmetric one-sided distribution
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
      alert(`One-Sided BidAsk LP Position Created Successfully!\n\nTransaction: ${signature}\nPosition: ${newPosition.publicKey.toString()}\nBins: ${maxBinId - minBinId + 1} (${minBinId}-${maxBinId})`)

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
        <Button size="sm" className="gap-2 gradient-primary border-0 text-white hover:opacity-90 font-medium">
          <Plus className="h-4 w-4" />
          Add LP
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] gradient-card max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-6 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            Add One-Sided LP Position
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a one-sided liquidity position using BidAsk strategy for directional exposure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-1 overflow-y-auto flex-1 min-h-0">
          {/* Strategy Section */}
          <div className="gradient-accent/10 border border-primary/20 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-primary">One-Sided BidAsk</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStrategyInfo(!showStrategyInfo)}
                className="h-auto p-1 text-muted-foreground hover:text-primary"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
            {showStrategyInfo && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Places your SOL liquidity strategically above or below current price for directional trading. 
                Your SOL will only be active when the market moves in your favor.
              </p>
            )}
          </div>

          {/* Position Form */}
          <div className="space-y-4">
            {/* Selected Pair */}
            <div className="gradient-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Selected Pair</span>
              </div>
              <p className="font-mono text-base font-medium">{pairName}</p>
            </div>

            {/* SOL Amount */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="solAmount" className="text-sm font-medium flex items-center gap-2">
                  <Coins className="w-4 h-4 text-primary" />
                  SOL Amount
                </Label>
                {publicKey && balanceQuery.data && (
                  <span className="text-xs text-muted-foreground">
                    Balance: {walletBalanceSOL.toFixed(3)} SOL
                  </span>
                )}
              </div>

              <Input
                id="solAmount"
                type="number"
                placeholder=""
                value={solAmount}
                onChange={(e) => setSolAmount(e.target.value)}
                min="0.02"
                step="0.01"
                className="text-sm py-3 px-4"
              />

              {/* Percentage Buttons */}
              {publicKey && walletBalanceSOL > 0.02 && (
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((percentage) => {
                    const amount = (walletBalanceSOL * percentage / 100)
                    const maxUsable = Math.max(0, walletBalanceSOL - 0.01)
                    const finalAmount = Math.min(amount, maxUsable)

                    return (
                      <Button
                        key={percentage}
                        variant="outline"
                        size="sm"
                        onClick={() => setPercentageAmount(percentage)}
                        disabled={finalAmount < 0.02}
                        className="text-xs h-8 glass-effect border-border/20 hover:border-primary/30"
                      >
                        <Percent className="w-3 h-3 mr-1" />
                        {percentage}%
                      </Button>
                    )
                  })}
                </div>
              )}

            </div>

            {/* Price Range */}
            <div className="gradient-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Strategy</span>
              </div>
              <p className="font-medium">69 bins (one-sided BidAsk)</p>
              <p className="text-xs text-muted-foreground mt-1">
                Positioned for directional exposure
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive" className="border-red-500/20 bg-red-500/10 mx-1">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          {txSignature && (
            <div className="gradient-accent/10 border border-primary/20 rounded-xl p-5 mx-1">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="font-semibold text-green-400">Transaction Sent</h4>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-xs"
                onClick={() => window.open(`https://explorer.solana.com/tx/${txSignature}`, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                View Transaction
              </Button>
            </div>
          )}

          {/* Important Notes - Collapsible */}
          <div className="gradient-accent/5 border border-primary/10 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Notes</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotesInfo(!showNotesInfo)}
                className="h-auto p-1 text-muted-foreground hover:text-primary"
              >
                {showNotesInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            {showNotesInfo && (
              <div className="mt-4 space-y-3 text-xs text-muted-foreground">
                <p>- Position rent (~0.057 SOL) is fully refundable when closed</p>
                <p>- 69 bins positioned strategically for one-sided exposure</p>
                <p>- BidAsk strategy places liquidity above/below current price</p>
                <p>- Your SOL will only trade when market moves in your direction</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-6 border-t border-border/20 px-1 flex-shrink-0 mt-auto">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="flex-1 py-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPosition}
              disabled={isLoading || !publicKey}
              className="flex-1 gradient-primary border-0 text-white hover:opacity-90 py-3"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Position
                </div>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}