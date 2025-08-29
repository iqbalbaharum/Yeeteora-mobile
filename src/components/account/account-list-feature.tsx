'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'

import { redirect } from 'next/navigation'

export default function AccountListFeature() {
  const { publicKey } = useWallet()

  if (publicKey) {
    return redirect(`/account/${publicKey.toString()}`)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-3">Connect Your Wallet</h1>
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          Connect your Solana wallet to view your account details, token balances, and transaction history.
        </p>
        <WalletButton />
      </div>
    </div>
  )
}
