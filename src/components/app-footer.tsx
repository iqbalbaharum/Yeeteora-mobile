import React from 'react'

export function AppFooter() {
  return (
    <footer className="lg:px-[70px] px-4 lg:text-left text-center p-2 bg-background font-serif text-xs">
      {new Date().getFullYear()} © Leyeetora. All rights reserved.
    </footer>
  )
}
