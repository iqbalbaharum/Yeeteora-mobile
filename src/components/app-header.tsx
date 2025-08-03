'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { ThemeSelect } from '@/components/theme-select'
import { ClusterUiSelect } from './cluster/cluster-ui'
import { WalletButton } from '@/components/solana/solana-provider'

export function AppHeader() {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <>
      {showMenu && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-30"
          onClick={() => setShowMenu(false)}
        />
      )}
      <header className="relative z-50 px-4 py-3 glass-effect">
        <div className="mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link className="flex items-center gap-2 text-xl font-bold text-gradient hover:opacity-80 transition-opacity" href="/">
              <span>YEETEORA</span>
            </Link>


          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-8 h-8"
              onClick={() => setShowMenu(!showMenu)}
            >
              {showMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="hidden md:flex items-center gap-3">
              <WalletButton />
              <ClusterUiSelect />
              <ThemeSelect />
            </div>
          </div>

          {showMenu && (
            <div className="md:hidden fixed inset-x-4 top-20 gradient-card rounded-2xl z-50 border border-border shadow-xl">
              <div className="p-6">
                {/* Wallet & Settings Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                    Wallet & Settings
                  </h3>
                  <div className="space-y-3">
                    <div className="px-2">
                      <WalletButton />
                    </div>
                    <div className="grid grid-cols-2 gap-3 px-2">
                      <ClusterUiSelect />
                      <ThemeSelect />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  )
}
