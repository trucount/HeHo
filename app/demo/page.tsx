"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap } from "lucide-react"
import Link from "next/link"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-20 px-4 relative overflow-hidden">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">Try HeHo Premium</h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Experience the full power of HeHo with unlimited chatbots, advanced analytics, and priority support.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <Card className="border-border/50 bg-card/50 p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Premium Features</h2>
                  <ul className="space-y-3 text-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-white" />
                      <span>Unlimited Chatbots</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-white" />
                      <span>Unlimited Messages</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-white" />
                      <span>Priority Support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-white" />
                      <span>Custom Branding</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-white" />
                      <span>Advanced Analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-white" />
                      <span>Team Collaboration</span>
                    </li>
                  </ul>
                  <Link href="/signup">
                    <Button className="w-full bg-black hover:bg-gray-900 text-white border border-white">
                      Start Premium Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </Card>

                <Card className="border-border/50 bg-card/50 p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Coming Soon</h2>
                  <p className="text-muted-foreground mb-6">
                    Premium access is launching soon. Join the waitlist to get early access and special benefits.
                  </p>
                  <div className="space-y-4">
                    <div className="bg-black/20 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Premium will include:</p>
                      <p className="text-foreground font-semibold mt-2">
                        Enhanced capabilities, white-label solutions, and dedicated support
                      </p>
                    </div>
                    <Link href="/beta">
                      <Button
                        variant="outline"
                        className="w-full border-white text-foreground hover:bg-white/10 bg-transparent"
                      >
                        Join Waitlist
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>

              <Card className="border-border/50 bg-card/50 p-8 text-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">Live Demo</h2>
                <p className="text-muted-foreground mb-6">
                  Create a free account and try HeHo right now. No credit card required.
                </p>
                <Link href="/signup">
                  <Button className="bg-black hover:bg-gray-900 text-white border border-white">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
