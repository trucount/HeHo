
'use client'

import { useState, useEffect } from "react"
import { HeHoLogo } from "./heho-logo"
import { Button } from "./ui/button"
import Link from "next/link"
import { Menu, X, BarChart3, MessageSquare, Database, Zap, LogOut, Settings } from "lucide-react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/app/dashboard", icon: BarChart3, label: "Dashboard" },
  { href: "/app/chatbots", icon: MessageSquare, label: "Chatbots" },
  { href: "/app/database", icon: Database, label: "Database" },
  { href: "/app/usage", icon: Zap, label: "Usage" },
]

export function Header({ withSettings }: { withSettings?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      setIsScrolled(currentScrollY > 50)

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  const isAppPage = pathname.startsWith('/app')

  return (
    <header
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out w-[95%] max-w-6xl
        ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
      `}
    >
      <div
        className={`
          flex items-center justify-between gap-6 px-6 py-3 rounded-2xl border transition-all duration-300
          ${
            isScrolled
              ? "bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl"
              : "bg-background/60 backdrop-blur-lg border-border/30 shadow-lg"
          }
        `}
      >
        <Link href={isAppPage ? "/app/dashboard" : "/"} className="transform transition-transform duration-200 hover:scale-105">
          <HeHoLogo />
        </Link>

        {isAppPage ? (
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map(item => {
                const Icon = item.icon
                const isActive = pathname.startsWith(item.href)
                return (
                    <Link key={item.href} href={item.href} title={item.label}>
                        <Button variant={isActive ? 'secondary' : 'ghost'} size='sm' className="gap-2">
                           <Icon className='h-4 w-4'/> 
                           {item.label}
                        </Button>
                    </Link>
                )
            })}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="/#features"
              className="relative text-foreground/80 hover:text-foreground transition-all duration-300 group px-3 py-1 rounded-lg hover:bg-foreground/5"
            >
              Features
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-black transition-all duration-200 group-hover:w-4"></span>
            </a>
            <a
              href="/#pricing"
              className="relative text-foreground/80 hover:text-foreground transition-all duration-300 group px-3 py-1 rounded-lg hover:bg-foreground/5"
            >
              Pricing
            </a>
            <a
              href="/security"
              className="relative text-foreground/80 hover:text-foreground transition-all duration-300 group px-3 py-1 rounded-lg hover:bg-foreground/5"
            >
              Security
            </a>
            <a
              href="/integrations"
              className="relative text-foreground/80 hover:text-foreground transition-all duration-300 group px-3 py-1 rounded-lg hover:bg-foreground/5"
            >
              Integrations
            </a>
            <a
              href="/about"
              className="relative text-foreground/80 hover:text-foreground transition-all duration-300 group px-3 py-1 rounded-lg hover:bg-foreground/5"
            >
              About
            </a>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isAppPage ? (
            <>
            {withSettings && 
                <Link href="/app/settings">
                    <Button variant='ghost' size='icon' className="text-foreground/80 hover:text-foreground hover:bg-foreground/10">
                        <Settings className="h-5 w-5"/>
                    </Button>
                </Link>
            }
            <Button
                onClick={handleLogout}
                variant="ghost"
                size='sm'
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/10 hidden md:flex"
            >
                <LogOut className='h-4 w-4 mr-2'/>
                Sign Out
            </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition-all duration-200 rounded-xl hidden md:flex"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="sm"
                  className="bg-black hover:bg-gray-900 text-white border border-white transform transition-all duration-200 hover:scale-105 hover:shadow-lg rounded-xl hidden md:flex"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
           <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden mt-2 bg-background/80 backdrop-blur-xl border-border/50 rounded-2xl p-4">
            {isAppPage ? (
                <div className='flex flex-col gap-2'>
                    {navItems.map(item => {
                        const Icon = item.icon
                        return (
                        <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
                            <Button variant='ghost' size='sm' className="w-full justify-start gap-2">
                                <Icon className='h-4 w-4'/>
                                {item.label}
                            </Button>
                        </Link>
                    )
                    })}
                    <Button onClick={handleLogout} variant='ghost' size='sm' className="w-full justify-start gap-2 text-red-500">
                        <LogOut className='h-4 w-4'/>
                        Sign Out
                    </Button>
                </div>
            ): (
                <div className='flex flex-col gap-2'>
                     <a href="/#features" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 text-foreground/80 hover:text-foreground rounded-lg hover:bg-foreground/5">Features</a>
                     <a href="/#pricing" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 text-foreground/80 hover:text-foreground rounded-lg hover:bg-foreground/5">Pricing</a>
                     <a href="/security" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 text-foreground/80 hover:text-foreground rounded-lg hover:bg-foreground/5">Security</a>
                     <a href="/integrations" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 text-foreground/80 hover:text-foreground rounded-lg hover:bg-foreground/5">Integrations</a>
                     <a href="/about" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 text-foreground/80 hover:text-foreground rounded-lg hover:bg-foreground/5">About</a>
                     <div className='flex gap-2 mt-2'>
                        <Link href='/login' className='flex-1'>
                            <Button variant='outline' className='w-full'>Sign In</Button>
                        </Link>
                        <Link href='/signup' className='flex-1'>
                            <Button className='w-full'>Get Started</Button>
                        </Link>
                     </div>
                </div>
            )}
        </div>
      )}
    </header>
  )
}
