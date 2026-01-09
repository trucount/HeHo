"use client"

import { Button } from "./ui/button"
import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started with AI chatbots",
    features: [
      "1 chatbot",
      "10,000 messages/month",
      "Free OpenRouter models",
      "Supabase integration",
      "Email support",
      "Basic analytics",
    ],
    popular: true,
    cta: "Get Started",
    href: "/signup",
  },
  {
    name: "Premium",
    price: "Coming Soon",
    period: "",
    description: "For power users and teams",
    features: [
      "Unlimited chatbots",
      "Unlimited messages",
      "Priority support",
      "Custom branding",
      "Advanced analytics",
      "Team collaboration",
    ],
    popular: false,
    cta: "Join Waitlist",
    href: "/beta",
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free with everything you need. Upgrade as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative border rounded-xl p-8 transition-all duration-300 ${
                plan.popular
                  ? "border-foreground/50 bg-card/5 ring-1 ring-foreground/20 scale-105"
                  : "border-border/50 bg-card/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-foreground text-background px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-foreground/80">
                    <Check className="h-5 w-5 text-foreground mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="w-full block">
                <Button
                  className={`w-full group ${
                    plan.popular ? "bg-foreground hover:bg-muted text-background border border-background" : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            All plans include full access to AI models, Supabase integration, and secure authentication.
          </p>
        </div>
      </div>
    </section>
  )
}
