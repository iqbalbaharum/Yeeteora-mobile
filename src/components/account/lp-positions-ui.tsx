// src/components/account/lp-positions-ui.tsx
'use client'

import { PublicKey } from '@solana/web3.js'
import { RefreshCw, TrendingUp, X, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useGetLPPositions, useCloseLPPosition, type LPPosition } from './lp-positions-data-access'
import { ExplorerLink } from '../cluster/cluster-ui'
import { ellipsify } from '@/lib/utils'

interface LPPositionsProps {
  address: PublicKey
}

export function LPPositions({ address }: LPPositionsProps) {
  const query = useGetLPPositions({ address })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          LP Positions
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          disabled={query.isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${query.isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {query.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading LP positions: {query.error?.message || 'Unknown error'}. Please try refreshing.
          </AlertDescription>
        </Alert>
      )}

      {query.isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading LP positions...</p>
        </div>
      ) : query.data && query.data.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead className="text-right">Bin Range</TableHead>
                <TableHead className="text-right">X Amount</TableHead>
                <TableHead className="text-right">Y Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((position: LPPosition) => (
                <TableRow key={position.address}>
                  <TableCell>
                    <div className="font-mono text-sm">
                      <ExplorerLink
                        path={`account/${position.address}`}
                        label={ellipsify(position.address, 6)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{position.pairName}</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      <ExplorerLink
                        path={`account/${position.pairAddress}`}
                        label={ellipsify(position.pairAddress, 4)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {position.lowerBinId} - {position.upperBinId}
                    <div className="text-xs text-muted-foreground">
                      ({position.upperBinId - position.lowerBinId + 1} bins)
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatTokenAmount(position.totalXAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatTokenAmount(position.totalYAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ClosePositionDialog position={position} userAddress={address} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold text-muted-foreground">No LP Positions</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have any liquidity positions yet. Create one from the Meteora page.
          </p>
        </div>
      )}
    </div>
  )
}

interface ClosePositionDialogProps {
  position: LPPosition
  userAddress: PublicKey
}

function ClosePositionDialog({ position, userAddress }: ClosePositionDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const closeMutation = useCloseLPPosition({ address: userAddress })

  const handleClosePosition = async () => {
    setIsClosing(true)
    try {
      await closeMutation.mutateAsync({ 
        positionAddress: position.address,
        pairAddress: position.pairAddress
      })
      setIsOpen(false)
      // Success feedback will be handled by the mutation's onSuccess
    } catch (error) {
      console.error('Close position failed:', error)
    } finally {
      setIsClosing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <X className="h-4 w-4" />
          Close
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Close LP Position</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Closing this position will remove all liquidity and collect any available fees. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Position</label>
                <div className="font-mono text-sm">
                  {ellipsify(position.address, 8)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Pair</label>
                <div className="font-medium">{position.pairName}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bin Range</label>
                <div className="font-mono text-sm">
                  {position.lowerBinId} - {position.upperBinId}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Bins</label>
                <div className="font-mono text-sm">
                  {position.upperBinId - position.lowerBinId + 1}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">X Token Amount</label>
                <div className="font-mono text-sm">
                  {formatTokenAmount(position.totalXAmount)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Y Token Amount</label>
                <div className="font-mono text-sm">
                  {formatTokenAmount(position.totalYAmount)}
                </div>
              </div>
            </div>
          </div>

          {closeMutation.isError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to close position: {closeMutation.error?.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>After closing:</strong> You will receive all remaining tokens from your position plus any collected fees. The position account rent (~0.057 SOL) will be returned to your wallet.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)} 
            disabled={isClosing}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleClosePosition} 
            disabled={isClosing}
          >
            {isClosing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Closing Position...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Close Position
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to format token amounts
function formatTokenAmount(amount: string): string {
  try {
    const num = parseFloat(amount)
    if (num === 0) return '0'
    if (num < 0.000001) return '< 0.000001'
    if (num < 1) return num.toFixed(6)
    if (num < 1000) return num.toFixed(4)
    if (num < 1000000) return `${(num / 1000).toFixed(2)}K`
    return `${(num / 1000000).toFixed(2)}M`
  } catch {
    return amount || '0'
  }
}