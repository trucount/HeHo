"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Loader2, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function BetaPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [reason, setReason] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error: insertError } = await supabase.from("beta_requests").insert({
        email,
        user_id: user?.id,
        company,
        role,
        reason,
        status: "pending",
      })

      if (insertError) throw insertError

      setSubmitted(true)
      setEmail("")
      setName("")
      setCompany("")
      setRole("")
      setReason("")

      setTimeout(() => {
        setSubmitted(false)
      }, 5000)
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-2xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Join Our Beta Program</h1>
              <p className="text-lg text-muted-foreground">
                Be among the first to try HeHo Premium and help shape the future of AI chatbot building.
              </p>
            </div>

            <Card className="border-border/50 bg-card/50 p-8">
              {submitted && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground font-semibold">Thank you!</p>
                    <p className="text-muted-foreground text-sm">We'll contact you soon about your beta access.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">Full Name</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="bg-background/50 border-border/50 text-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-background/50 border-border/50 text-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">Company</label>
                  <Input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Your company name"
                    className="bg-background/50 border-border/50 text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">Role</label>
                  <Input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Your role"
                    className="bg-background/50 border-border/50 text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">Why are you interested?</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell us about your use case..."
                    rows={4}
                    className="w-full bg-background/50 border border-border/50 rounded-md text-foreground p-3 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black hover:bg-gray-900 text-white border border-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Join Beta Program"
                  )}
                </Button>
              </form>

              <p className="text-center text-muted-foreground text-sm mt-6">
                We'll review your request and contact you within 48 hours.
              </p>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
