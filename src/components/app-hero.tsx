import React from 'react'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AppHero({
  children,
  subtitle,
  title,
}: {
  children?: React.ReactNode
  subtitle?: React.ReactNode
  title?: React.ReactNode
}) {
  return (
    <div className="relative px-4 py-6 md:py-12">
      <div className="text-center max-w-4xl mx-auto">
        <div className="mb-6">
          {typeof title === 'string' ? (
            <div className="relative">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                {title}
              </h1>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                >
                  How it Works
                  <Info className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            title
          )}

          {typeof subtitle === 'string' ? (
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          ) : (
            subtitle
          )}
        </div>

        {children}
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
      </div>
    </div>
  )
}
