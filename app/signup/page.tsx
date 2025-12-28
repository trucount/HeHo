"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-2xl">Verify Your Email</CardTitle>
              <CardDescription>Check your inbox for a verification link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We've sent a verification email to <strong>{email}</strong>. Click the link in the email to complete
                your signup and access your HeHo dashboard.
              </p>
              <p className="text-sm text-muted-foreground">The link expires in 24 hours.</p>
              <Button asChild className="w-full bg-black hover:bg-gray-900 text-white border border-white">
                <Link href="/login">Back to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === "terms") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-auto">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-2xl">Terms & Conditions</CardTitle>
              <CardDescription>Please read and accept our terms before signing up</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-invert text-sm space-y-4 max-h-96 overflow-y-auto text-muted-foreground">
                <section>
                  <h3 className="font-semibold text-foreground">1. Acceptance of Terms</h3>
                  <p>By using HeHo, you agree to these terms and conditions.</p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground">2. User Responsibilities</h3>
                  <p>
                    You are responsible for your OpenRouter API key, Supabase credentials, and all activities under your
                    account.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground">3. Data & Privacy</h3>
                  <p>Your data is stored in your own Supabase instance. HeHo only stores authentication data.</p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground">4. Prohibited Use</h3>
                  <p>You may not use HeHo for illegal content, misinformation, harassment, or abuse.</p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground">5. Limitation of Liability</h3>
                  <p>HeHo is provided as-is. We are not responsible for data loss or AI errors.</p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground">6. AI & OpenRouter</h3>
                  <p>
                    HeHo uses OpenRouter to power AI responses. You're responsible for OpenRouter's Terms of Service
                    compliance.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground">7. Service Changes</h3>
                  <p>
                    HeHo reserves the right to modify or discontinue the service. We provide 30 days notice for major
                    changes.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground">8. Termination</h3>
                  <p>
                    We may terminate your account if you violate these terms. You can delete your account anytime from
                    settings.
                  </p>
                </section>

                <p className="text-xs pt-4">
                  For full terms, visit{" "}
                  <Link href="/terms" className="text-black hover:underline font-semibold">
                    /terms
                  </Link>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                  I accept the Terms & Conditions
                </label>
              </div>

              <Button
                onClick={() => setStep("signup")}
                disabled={!acceptedTerms}
                className="w-full bg-black hover:bg-gray-900 text-white border border-white disabled:opacity-50"
              >
                I Agree & Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-2xl">Create Your HeHo Account</CardTitle>
            <CardDescription>Start building AI chatbots in minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background/50 border-border/50"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-900 text-white border border-white"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Sign Up"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-black hover:underline font-semibold">
                Sign in here
              </Link>
            </div>

            <button
              onClick={() => setStep("terms")}
              className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground"
            >
              Back to Terms
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
