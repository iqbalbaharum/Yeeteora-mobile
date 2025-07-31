'use client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, Home, User } from 'lucide-react'
import { ThemeSelect } from '@/components/theme-select'
import { ClusterUiSelect } from './cluster/cluster-ui'
import { WalletButton } from '@/components/solana/solana-provider'

export function AppHeader({ links = [] }: { links: { label: string; path: string }[] }) {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)

  function isActive(path: string) {
    return path === '/' ? pathname === '/' : pathname.startsWith(path)
  }

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

            <nav className="hidden md:flex">
              <ul className="flex gap-6 items-center">
                {links.map(({ label, path }) => (
                  <li key={path}>
                    <Link
                      className={`text-sm font-medium transition-colors hover:text-primary ${isActive(path)
                        ? 'text-primary'
                        : 'text-muted-foreground'
                        }`}
                      href={path}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
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
                {/* Navigation Section */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                    Navigation
                  </h3>
                  <nav className="space-y-1">
                    {links.map(({ label, path }) => {
                      const getIcon = (label: string) => {
                        if (label === 'Home') return <Home className="w-5 h-5" />
                        if (label === 'Account') return <User className="w-5 h-5" />
                        return null
                      }

                      return (
                        <Link
                          key={path}
                          className={`flex items-center gap-3 text-base py-3 px-4 font-medium transition-all duration-200 rounded-xl ${isActive(path)
                            ? 'text-primary bg-primary/15 border border-primary/20'
                            : 'text-foreground hover:text-primary hover:bg-primary/8 border border-transparent hover:border-primary/10'
                            }`}
                          href={path}
                          onClick={() => setShowMenu(false)}
                        >
                          {getIcon(label)}
                          <span>{label}</span>
                        </Link>
                      )
                    })}
                  </nav>
                </div>

                {/* Wallet & Settings Section */}
                <div className="space-y-4 pt-4 border-t border-border/30">
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
