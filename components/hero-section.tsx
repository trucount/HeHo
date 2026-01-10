'use client'

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const videoSrc = resolvedTheme === "dark" ? "/setupbg.mp4" : "/4990317-hd_1920_1080_30fps-negate.mp4";

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4">
      {mounted && (
        <video
          key={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
          src={videoSrc}
        />
      )}

      <div className="relative z-20 container mx-auto">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm md:text-base dark:text-gray-300 text-gray-800 mb-4 font-semibold tracking-widest uppercase">
            Build AI Chatbots in Minutes
          </p>

          <h1 className="text-4xl md:text-6xl font-bold dark:text-white text-black mb-6 text-balance">
            Create AI Chatbots That Understand Your Project
          </h1>

          <p className="text-lg md:text-xl dark:text-gray-300 text-gray-800 mb-8 text-balance max-w-2xl mx-auto">
            Build AI Chatbots That Understand Your Project
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="dark:bg-white dark:hover:bg-gray-200 dark:text-black bg-black hover:bg-gray-800 text-white group">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="dark:border-white dark:text-white dark:hover:bg-white/10 border-black text-black hover:bg-black/10"
              >
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
