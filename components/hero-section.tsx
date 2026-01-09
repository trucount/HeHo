"use client"

import { Button } from "./ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { ParticleTextEffect } from "./particle-text-effect"

export function HeroSection() {
  return (
    <section className="py-20 px-4 relative overflow-hidden min-h-screen flex flex-col justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background pointer-events-none" />

      <div className="flex-1 flex items-start justify-center pt-20">
        <ParticleTextEffect words={["HeHo", "AI", "PLATFORM", "CHATBOT"]} />
      </div>

      <div className="container mx-auto text-center relative z-10">
        <div className="max-w-4xl mx-auto mb-8">
          <p className="text-sm md:text-base text-muted-foreground mb-4 font-semibold tracking-widest uppercase">
            Build AI Chatbots in Minutes
          </p>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Create AI Chatbots That Understand Your Project
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 text-balance max-w-2xl mx-auto">
            Build AI Chatbots That Understand Your Project
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/signup">
              <Button size="lg" className="bg-foreground hover:bg-muted text-background border border-foreground group">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-foreground text-foreground hover:bg-muted/10 bg-transparent"
              >
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Animated wave background */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/10 to-transparent pointer-events-none" />
    </section>
  )
}
