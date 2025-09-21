// src/components/damm-v2/damm-v2-feature.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { AppHero } from '@/components/app-hero'
import { TokenCard, TokenData } from './damm-v2-token-card'
import { NewTokenPopup } from './damm-v2-new-token-popup'
import { Button } from '../ui/button'

const EXPIRY_MS = 2 * 60 * 1000

export default function DammV2Feature() {
  const [tokens, setTokens] = useState<Record<string, TokenData>>({})
  const [newToken, setNewToken] = useState<TokenData | null>(null)
  const [isPopupOpen, setPopupOpen] = useState(false)

  const expiryTimers = useRef<Record<string, NodeJS.Timeout>>({})

  const addOrUpdateToken = (data: TokenData) => {
    setTokens((prevTokens) => ({
      ...prevTokens,
      [data.mint]: data,
    }))

    // Reset expiry timer for this token
    if (expiryTimers.current[data.mint]) {
      clearTimeout(expiryTimers.current[data.mint])
    }

    expiryTimers.current[data.mint] = setTimeout(() => {
      setTokens((prevTokens) => {
        const updated = { ...prevTokens }
        delete updated[data.mint]
        return updated
      })
      delete expiryTimers.current[data.mint]
    }, EXPIRY_MS)
  }

  useEffect(() => {
    const ws = new WebSocket('wss://comet.lyt.wtf/ws')

    ws.onopen = () => {
      console.log('connected to websocket')
    }

    ws.onmessage = (event) => {
      const data: TokenData = JSON.parse(event.data)
      addOrUpdateToken(data)

      if (data.is_new_entry) {
        setNewToken(data)
        setPopupOpen(true)
      }
    }

    ws.onclose = () => {
      console.log('disconnected from websocket')
    }

    ws.onerror = (error) => {
      console.error('websocket error:', error)
    }

    return () => {
      ws.close()
      Object.values(expiryTimers.current).forEach(clearTimeout)
    }
  }, [])

  const handleNewDAMMv2Pool = () => {
    window.open('https://www.meteora.ag/pools#dammv2', '_blank')
  }

  return (
    <div className="min-h-screen">
      <AppHero title="Alpha call Damm v2" subtitle="Next-generation Dynamic Automated Market Making strategies" />
      <div className="px-4 flex justify-end">
        <Button className="px-6 py-3 text-lg" onClick={handleNewDAMMv2Pool}>
          New Pool
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {Object.values(tokens).map((token) => (
          <TokenCard key={token.mint} token={token} />
        ))}
      </div>
      <NewTokenPopup token={newToken} open={isPopupOpen} onOpenChange={setPopupOpen} />
    </div>
  )
}
