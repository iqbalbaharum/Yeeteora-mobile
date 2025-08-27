'use client'

import { useState } from 'react'

interface ProfileStatsData {
  totalNetWorth: number
  totalProfit: number
  winRate: number
  totalClosed: number
  avgInvested: number
  feeEarned: number
}

const dummyData: ProfileStatsData = {
  totalNetWorth: 0,
  totalProfit: 0,
  winRate: 0,
  totalClosed: 0,
  avgInvested: 0,
  feeEarned: 0,
}

export function ProfileStatsCard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1H' | '1D' | '1W' | '1M' | '1Y' | 'MAX'>('1D')
  const stats = dummyData

  const formatSOL = (amount: number) => {
    if (amount === 0) return '0 SOL'
    if (Math.abs(amount) >= 1000) {
      return `${(amount / 1000).toFixed(2)}k SOL`
    }
    return `${amount.toFixed(2)} SOL`
  }

  const formatPercentage = (rate: number) => {
    if (rate === 0) return '0%'
    return `${rate.toFixed(2)}%`
  }

  return (
    <div className="gradient-card lg:px-[70px] px-4 rounded-2xl space-y-6">
      <div>
        <h2 className="text-3xl md:text-5xl font-bold font-sans tracking-wide">PROFILE</h2>
      </div>

      <div className="flex lg:flex-row flex-col justify-between">
        <div className='grid grid-cols-2 gap-8 flex-1'>
          {/* Left Stats Column */}
          <div className="space-y-6">
            {/* Total Net Worth */}
            <div>
              <p className="text-sm text-sub-text font-sans mb-1">Total Net Worth</p>
              <p className="text-2xl font-bold text-white font-sans">{formatSOL(stats.totalNetWorth)}</p>
            </div>

            {/* Win Rate */}
            <div>
              <p className="text-sm text-sub-text font-sans mb-1">Win Rate</p>
              <p className="text-base font-bold text-tertiary font-sans">{formatPercentage(stats.winRate)}</p>
            </div>

            {/* Avg Invested */}
            <div>
              <p className="text-sm text-sub-text font-sans mb-1">Avg Invested</p>
              <p className="text-base font-bold text-tertiary font-sans">{formatSOL(stats.avgInvested)}</p>
            </div>
          </div>

          {/* Middle Stats Column */}
          <div className="space-y-6">
            {/* Total Profit */}
            <div>
              <p className="text-sm text-sub-text font-sans mb-1">Total Profit</p>
              <p
                className={`text-2xl font-bold font-sans ${stats.totalProfit >= 0 ? 'text-tertiary' : 'text-destructive'}`}
              >
                {stats.totalProfit >= 0 ? '' : '-'}
                {formatSOL(Math.abs(stats.totalProfit))}
              </p>
            </div>

            {/* Total Closed */}
            <div>
              <p className="text-sm text-sub-text font-sans mb-1">Total Closed</p>
              <p className="text-base font-bold font-sans">{stats.totalClosed}</p>
            </div>

            {/* Fee Earned */}
            <div>
              <p className="text-sm text-sub-text font-sans mb-1">Fee Earned</p>
              <p className="text-base font-bold text-white font-sans">{formatSOL(stats.feeEarned)}</p>
            </div>
          </div>
        </div>

        {/* Right Chart Column */}
        <div className="flex-1 lg:mt-0 mt-10">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-4 h-full border border-border/30">
            {/* Chart Placeholder */}
            <div className="h-32 lg:h-48 flex items-center justify-center mb-4">
              <div className="w-full h-full bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-lg flex items-center justify-center">
                <p className="text-sm text-sub-text font-serif">Chart Coming Soon</p>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex gap-2 justify-center">
              {(['1H', '1D', '1W', '1M', '1Y', 'MAX'] as const).map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all duration-200 ${
                    selectedTimeframe === timeframe
                      ? 'bg-blue-600 text-white'
                      : 'text-sub-text hover:text-primary hover:bg-primary/10'
                  }`}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
