"use client"

import { useState, useEffect } from "react"
import { HeHoLogo } from "./heho-logo"
import { Button } from "./ui/button"
import Link from "next/link"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

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

  return (
    <header
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out
        ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
      `}
    >
      <div
        className={`
          flex items-center justify-center gap-6 px-6 py-3 rounded-2xl border transition-all duration-300
          ${
            isScrolled
              ? "bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl"
              : "bg-background/60 backdrop-blur-lg border-border/30 shadow-lg"
          }
        `}
      >
        <Link href="/" className="transform transition-transform duration-200 hover:scale-105">
          <HeHoLogo />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#features"
            className="relative text-foreground/80 hover:text-foreground transition-all duration-300 group px-3 py-1 rounded-lg hover:bg-foreground/5"
          >
            Features
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-black transition-all duration-200 group-hover:w-4"></span>
          </a>
          <a
            href="#pricing"
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

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition-all duration-200 rounded-xl"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              className="bg-black hover:bg-gray-900 text-white border border-white transform transition-all duration-200 hover:scale-105 hover:shadow-lg rounded-xl"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
