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
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
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
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          HeHo is optimized for desktop. For the best experience, please use a desktop or tablet.
        </AlertDescription>
      </Alert>
    </div>
  )
}
