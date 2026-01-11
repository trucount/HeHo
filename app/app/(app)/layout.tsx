'use client'

import React, { useEffect, useState } from "react"
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Header } from '@/components/header'
import { useAuth, AuthProvider } from '@/lib/auth/provider'

const AppLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [addonLoaded, setAddonLoaded] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const handleAddonReady = () => {
      setAddonLoaded(true);
    }

    document.addEventListener('addonReady', handleAddonReady);

    if (!document.querySelector('script[src="/addon.js"]')) {
      const script = document.createElement('script')
      script.src = '/addon.js'
      script.async = true
      document.body.appendChild(script)
    }

    return () => {
      document.removeEventListener('addonReady', handleAddonReady);
    }
  }, [])

  if (loading || !user) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  const isChatbotPage = pathname.includes('/chatbots/') && pathname.split('/').length > 3

  return (
    <div className={`h-screen flex flex-col ${isChatbotPage ? '' : 'min-h-screen'}`}>
      {!isChatbotPage && <Header withSettings id="main-header" hideNav={addonLoaded} />}
      <main id="main-content" className={`w-full ${!isChatbotPage ? 'flex-1 pt-24' : 'h-full'}`}>{children}</main>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </AuthProvider>
  )
}
