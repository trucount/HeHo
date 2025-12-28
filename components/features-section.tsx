"use client"

import { Card } from "./ui/card"
import { Zap, Database, Mail, FileText, Lock, MessageCircle } from "lucide-react"

const features = [
  {
    title: "Free AI Models",
    description: "Access to 35+ free models from OpenRouter including Llama, Mistral, Gemma, and more",
    icon: Zap,
  },
  {
    title: "Supabase Integration",
    description: "Connect your Supabase database and let AI read, write, and create tables autonomously",
    icon: Database,
  },
  {
    title: "Email Verification",
    description: "Secure authentication with email verification before accessing your chatbot",
    icon: Mail,
  },
  {
    title: "Project Context",
    description: "Upload detailed project descriptions so AI understands your full business context",
    icon: FileText,
  },
  {
    title: "Database Permissions",
    description: "Fine-grained control over what AI can read, write, create, and access in your database",
    icon: Lock,
  },
  {
    title: "Real-time Chat",
    description: "Chat directly with your AI chatbot powered by your OpenRouter API key",
    icon: MessageCircle,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Powerful Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build and deploy AI chatbots connected to your data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <Card
                key={idx}
                className="border-border/50 bg-card/50 hover:bg-card/80 hover:border-white/30 transition-all duration-300 p-6"
              >
                <Icon className="h-8 w-8 mb-4 text-white" />
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
