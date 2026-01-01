
'use client'

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/header"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setIsAuthenticated(true)
    }

    checkAuth()
  }, [router, supabase])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isChatbotPage = pathname.includes('/chatbots/') && pathname.split('/').length > 3

  return (
    <div className={`h-screen flex flex-col ${isChatbotPage ? '' : 'min-h-screen'}`}>
      {!isChatbotPage && <Header withSettings />}
      <main className={`w-full ${!isChatbotPage ? 'flex-1 pt-24' : 'h-full'}`}>{children}</main>
    </div>
  )
}
