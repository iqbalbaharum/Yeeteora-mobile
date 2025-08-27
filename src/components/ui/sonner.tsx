'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast !bg-popover !text-popover-foreground !border-border shadow-lg font-serif',
          success: '!bg-tertiary-foreground !text-tertiary !border-tertiary',
          error: '!bg-red-900 !text-red-400 !border-destructive',
          info: '!bg-secondary-foreground !text-secondary !border-secondary',
          description: '!text-white',
          actionButton: '!bg-primary !text-primary-foreground hover:!bg-primary/90',
          cancelButton: '!bg-muted !text-muted-foreground hover:!bg-muted/80',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
