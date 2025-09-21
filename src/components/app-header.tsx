'use client'
// import { useState } from 'react'
import Link from 'next/link'
// import { Button } from '@/components/ui/button'
// import { Menu, X } from 'lucide-react'
// import { ThemeSelect } from '@/components/theme-select'
// import { ClusterUiSelect } from './cluster/cluster-ui'
import { WalletButton } from '@/components/solana/solana-provider'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

export function AppHeader() {
  // const [showMenu, setShowMenu] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true)
    }
  }, [])

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported in this browser.')
      return
    }

    console.log(Notification.permission)
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true)
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setNotificationsEnabled(true)
    }
  }

  return (
    <>
      <header className="relative z-50 py-4 lg:px-[70px] px-4">
        <div className="mx-auto flex justify-between items-center">
          <Link className="text-xl font-bold text-primary hover:opacity-80 transition-opacity" href="/">
            <span>YEETEORA</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button variant={'secondary'} className="flex items-center gap-2" onClick={handleEnableNotifications}>
              {notificationsEnabled ? (
                <Bell className="h-4 w-4 text-green-400" />
              ) : (
                <BellOff className="h-4 w-4 text-yellow-400" />
              )}
              {notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}
            </Button>
            <WalletButton />
          </div>
        </div>
      </header>
      {/* {showMenu && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-30"
          onClick={() => setShowMenu(false)}
        />
      )}
      <header className="relative z-50 py-4 lg:px-[70px] px-4">
        <div className="mx-auto flex justify-between items-center">
            <Link className="text-xl font-bold text-primary hover:opacity-80 transition-opacity" href="/">
              <span>YEETEORA</span>
            </Link>

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
      </header> */}
    </>
  )
}
