// src/components/damm-v2/damm-v2-token-card.tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'

export interface TokenData {
  mint: string
  delta_other: number
  delta_jup: number
  total: number
  total_jupiter: number
  jupiter_pct: number
  is_new_entry: boolean
  total_trade_size: number
  delta_total_trade_size: number
  delta_jupiter_trade_size: number
  jupiter_trade_size: number
  since_tge: number
  timestamp: number
}

interface TokenCardProps {
  token: TokenData
}

export function TokenCard({ token }: TokenCardProps) {
  const lastNotificationRef = useRef<number>(0)

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }, [])

  const handleOpenGMGN = () => {
    window.open(`https://gmgn.ai/sol/token/${token.mint}`, '_blank')
  }

  const handleOpenMeteora = () => {
    window.open(`https://meteora.ag/dammv2/${token.mint}`, '_blank')
  }

  const playNotificationSound = () => {
    const audio = new Audio('/sound/noti.mp3')
    audio.play().catch((err) => console.error('Failed to play sound:', err))
  }

  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  }

  const triggerAlert = (title: string) => {
    const now = Date.now()
    if (now - lastNotificationRef.current > 3000) {
      playNotificationSound()
      showBrowserNotification(
        title,
        `${token.mint} — Jup: ${token.delta_jup}, Total: ${token.total + token.total_jupiter}`,
      )
      lastNotificationRef.current = now
    }
  }

  const handlePumpSwap = () => {
    window.open(
      `https://swap.pump.fun/?input=So11111111111111111111111111111111111111112&output=${token.mint}`,
      '_blank',
    )
  }

  const totalDelta = token.delta_jup + token.delta_other
  let bgColorClass = 'bg-[#2a2a3e]/50 text-white' // default

  if (token.delta_jup > 20 && totalDelta > 200) {
    bgColorClass = 'bg-red-400/25 text-white' // 🔥 intense red
    triggerAlert('🚨 High Jupiter Activity!')
  } else if (token.delta_jup > 10 && totalDelta > 100) {
    bgColorClass = 'bg-yellow-400/25 text-white' // ⚠️ yellow, better contrast with black text
    triggerAlert('⚠️ Medium Jupiter Activity')
  }

  const ageInSeconds = token.since_tge
  const formattedTime = ageInSeconds < 60 ? `${ageInSeconds}s` : `${Math.floor(ageInSeconds / 60)}m`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <Card className={`${bgColorClass} border-0`}>
        <CardHeader className="flex flex-row items-center">
          <div className="flex-1">
            <CardTitle className="text-sm font-bold truncate">
              {token.mint} <span className="text-xs text-gray-400">{formattedTime}</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Changes Jupiter</div>
            <div className="text-lg text-green-500">
              +{token.delta_jup} ({(token.delta_jupiter_trade_size / 1_000_000_000).toFixed(2)} SOL)
            </div>
          </div>
          <div>
            <div className="text-gray-400">Changes Non-Jupiter</div>
            <div className="text-lg">
              +{token.delta_other} ({(token.delta_total_trade_size / 1_000_000_000).toFixed(2)} SOL)
            </div>
          </div>
          <div>
            <div className="text-gray-400">Jupiter Txs Pct</div>
            <div className="text-lg text-green-500">{token.jupiter_pct.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-gray-400">Jupiter Size Pct</div>
            <div className="text-lg text-green-500">
              {((token.delta_jupiter_trade_size / token.delta_total_trade_size) * 100).toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-gray-400">Total Jupiter Txs</div>
            <div>{token.total_jupiter}</div>
          </div>
          <div>
            <div className="text-gray-400">Total Non-Jupiter Txs</div>
            <div>{token.total}</div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button className="flex-1 bg-[#4a4a6e] hover:bg-[#5a5a7e]" onClick={handleOpenGMGN}>
              GMGN
            </Button>
            <Button className="flex-1 bg-[#4a4a6e] hover:bg-[#5a5a7e]" onClick={handlePumpSwap}>
              SWAP
            </Button>
          </div>
          <Button className="w-full bg-primary hover:bg-secondary" onClick={handleOpenMeteora}>
            Meteora DAMM V2
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
