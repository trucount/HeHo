"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BarChart3, MessageSquare, Database, Settings, Zap, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/app/dashboard", icon: BarChart3, label: "Dashboard" },
  { href: "/app/chatbots", icon: MessageSquare, label: "Chatbots" },
  { href: "/app/database", icon: Database, label: "Database" },
  { href: "/app/usage", icon: Zap, label: "Usage" },
  { href: "/app/settings", icon: Settings, label: "Settings" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <div className="w-64 border-r border-border/50 bg-card/30 h-screen flex flex-col flex-shrink-0 sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border/50 flex-shrink-0">
        <Link href="/app/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white text-black flex items-center justify-center font-bold">H</div>
          <span className="text-lg font-bold text-foreground">HeHo</span>
        </Link>
      </div>

      {/* Navigation Items - Fixed to prevent overflow */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-foreground hover:bg-white/10",
                  isActive && "bg-white/20 text-white",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Logout - Fixed at bottom */}
      <div className="p-4 border-t border-border/50 flex-shrink-0">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Sign Out</span>
        </Button>
      </div>
    </div>
  )
}
