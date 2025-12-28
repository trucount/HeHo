"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function MobileDetector() {
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      setIsMobile(isMobileDevice)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Only show on app pages (not landing or public pages)
  if (!pathname.startsWith("/app")) {
    return null
  }

  if (!isMobile) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm md:hidden">
      <Alert className="max-w-md border-amber-500/50 bg-amber-500/10">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          HeHo app does not run on mobile size screens. Please use a desktop
          computer to access the app.
        </AlertDescription>
      </Alert>
    </div>
  )
}
