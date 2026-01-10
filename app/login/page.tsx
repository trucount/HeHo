'use client'

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/app/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const videoSrc = resolvedTheme === 'dark' ? '/setupbg.mp4' : '/4990317-hd_1920_1080_30fps-negate.mp4';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {mounted && (
        <video
          key={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="absolute z-0 w-full h-full object-cover"
          src={videoSrc}
        />
      )}
        <div className="w-full max-w-md z-20">
        <Card className="border-border/50 bg-card/50 backdrop-blur-lg dark:text-white text-black">
          <CardHeader>
            <CardTitle className="text-2xl">Sign In to HeHo</CardTitle>
            <CardDescription className="dark:text-gray-300 text-gray-800">Enter your email and password to access your chatbots</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-transparent dark:text-white text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-transparent dark:text-white text-black"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="w-full dark:bg-white dark:hover:bg-gray-200 dark:text-black bg-black hover:bg-gray-800 text-white"
                disabled={isLoading}
              >
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Sign In"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm dark:text-gray-300 text-gray-800">
              Don't have an account?{" "}
              <Link href="/signup" className="dark:text-white text-black hover:underline font-semibold">
                Sign up here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
