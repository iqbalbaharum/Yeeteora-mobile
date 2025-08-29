'use client'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Trophy, Wallet} from 'lucide-react'
import { useEffect, useState } from 'react'

interface NavbarProps {
    links: { label: string; path: string }[]
}

export function AppNavbar({ links }: NavbarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    function isActive(path: string) {
        if (!mounted) return false
        return path === '/' ? pathname === '/' : pathname.startsWith(path)
    }

    const getIcon = (label: string) => {
        switch (label) {
            case 'Home':
                return <Home className="w-5 h-5" />
            // case 'Meteora':
            //     return <TrendingUp className="w-5 h-5" />
            case 'Account':
                return <Wallet className="w-5 h-5" />
            case 'Ranking':
                return <Trophy className="w-5 h-5" />
            case 'Portfolio':
                return <Wallet className="w-5 h-5" />
            default:
                return null
        }
    }

    const handleNavigation = (path: string) => {
        router.push(path)
    }

    if (!mounted) {
        return (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                <nav className="relative">
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1a1b1e]/90 rounded-full border border-white/5">
                        {links.map(({ label, path }) => (
                            <button
                                key={path}
                                className="relative p-2.5 rounded-full transition-all duration-300 text-white/50"
                            >
                                <div className="relative z-10">
                                    {getIcon(label)}
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="absolute -inset-[0.5px] bg-gradient-to-t from-white/10 to-transparent rounded-full pointer-events-none" />
                </nav>
            </div>
        )
    }

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <nav className="relative">
                <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1a1b1e]/90 rounded-full border border-white/5">
                    {links.map(({ label, path }) => {
                        const active = isActive(path)
                        return (
                            <button
                                key={path}
                                onClick={() => handleNavigation(path)}
                                className={`relative p-2.5 rounded-full transition-all duration-300 ${active
                                    ? 'bg-primary text-white'
                                    : 'text-white/50 hover:text-white/80'
                                    }`}
                            >
                                <div className="relative z-10">
                                    {getIcon(label)}
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className="absolute -inset-[0.5px] bg-gradient-to-t from-white/10 to-transparent rounded-full pointer-events-none" />
            </nav>
        </div>
    )
}