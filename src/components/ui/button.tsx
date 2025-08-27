import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'uppercase bg-gradient-to-b from-[#3385FF] via-[#3385FF] to-[#0066FF] text-white border-[0.5px] border-[#3385FF] rounded-[8px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25),0_2px_4px_rgba(51,133,255,0.3)] hover:shadow-[inset_0_4px_4px_rgba(255,255,255,0.4),0_4px_12px_rgba(51,133,255,0.6),0_0_20px_rgba(51,133,255,0.3)]',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'uppercase border border-white bg-background shadow-xs rounded-[8px] hover:bg-secondary-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'text-primary border border-primary shadow-xs hover:bg-secondary-foreground rounded-[8px]',
        ghost: '',
        link: 'text-white underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[32px] px-3 py-2 has-[>svg]:px-3',
        sm: 'h-8 px-3 py-2 gap-1.5 has-[>svg]:px-2.5',
        lg: 'h-10 px-3 py-2 has-[>svg]:px-4',
        link:'',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
