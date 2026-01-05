'use client'

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"

export default function SignupPage() {
  const [step, setStep] = useState<"terms" | "signup">("terms")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/app/dashboard`,
        },
      })
      if (error) throw error
      setEmailSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
        <video autoPlay loop muted playsInline className="absolute z-0 w-full h-full object-cover" src="/setupbg.mp4" />
        <div className="absolute z-10 w-full h-full bg-black/50"></div>
        <div className="w-full max-w-md z-20">
          <Card className="border-border/50 bg-card/50 backdrop-blur-lg text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Verify Your Email</CardTitle>
              <CardDescription className="text-gray-300">Check your inbox for a verification link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                We've sent a verification email to <strong>{email}</strong>. Click the link in the email to complete
                your signup and access your HeHo dashboard.
              </p>
              <p className="text-sm text-gray-400">The link expires in 24 hours.</p>
              <Button asChild className="w-full bg-white text-black hover:bg-gray-200">
                <Link href="/login">Back to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <video autoPlay loop muted playsInline className="absolute z-0 w-full h-full object-cover" src="/setupbg.mp4" />
      <div className="absolute z-10 w-full h-full bg-black/50"></div>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto z-20">
        {step === "terms" ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-lg text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Terms & Conditions</CardTitle>
              <CardDescription className="text-gray-300">Please read and accept our terms before signing up <Link href="/terms" className="text-white hover:underline font-semibold">(HERE LINK TO /TERMS PAGE)</Link></CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-invert text-sm space-y-4 max-h-96 overflow-y-auto text-gray-300">
                  {/* Terms content */}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  className="border-gray-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer">
                  I accept the Terms & Conditions
                </label>
              </div>
              <Button
                onClick={() => setStep("signup")}
                disabled={!acceptedTerms}
                className="w-full bg-white text-black hover:bg-gray-200 disabled:opacity-50"
              >
                I Agree & Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 bg-card/50 backdrop-blur-lg text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Create Your HeHo Account</CardTitle>
              <CardDescription className="text-gray-300">Start building AI chatbots in minutes</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50 border-border/50 text-white"
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
                    className="bg-background/50 border-border/50 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-background/50 border-border/50 text-white"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-white text-black hover:bg-gray-200"
                  disabled={isLoading}
                >
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : "Sign Up"}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
              <div className="mt-6 text-center text-sm text-gray-300">
                Already have an account?{" "}
                <Link href="/login" className="text-white hover:underline font-semibold">
                  Sign in here
                </Link>
              </div>
              <button
                onClick={() => setStep("terms")}
                className="w-full mt-4 text-xs text-gray-400 hover:text-white"
              >
                Back to Terms
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
