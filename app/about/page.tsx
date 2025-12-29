import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">

          {/* Hero */}
          <div className="max-w-4xl mx-auto mb-20">
            <h1 className="text-4xl font-bold text-foreground mb-6 text-center">
              About HeHo
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
              HeHo is an open-source AI chatbot builder designed to help teams create
              intelligent, reliable, and deeply context-aware chatbots — all without
              writing a single line of code. We believe artificial intelligence should
              empower people, not overwhelm them. That’s why HeHo focuses on simplicity,
              transparency, and control, enabling developers, product teams, and
              businesses of all sizes to transform their ideas into real, production-ready
              AI experiences.
              <br /><br />
              Our mission is to democratize AI by removing technical barriers and
              unlocking powerful language models for everyday use. Whether you’re
              building customer-facing support bots, internal knowledge assistants,
              or workflow automation tools, HeHo provides the foundation to build
              scalable, secure, and meaningful chatbot experiences that truly
              understand your data and your business context.
            </p>
          </div>

          {/* Mission Section */}
          <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-4xl font-bold text-foreground mb-6 text-center">
              Our Mission
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
              We believe AI should be accessible, understandable, and adaptable to
              real-world business needs. Too often, powerful AI tools are locked behind
              complexity, expensive infrastructure, or vendor lock-in. HeHo was created
              to change that — giving teams the freedom to build intelligent systems
              without sacrificing ownership, security, or flexibility.
            </p>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              By connecting modern language models directly to your data, HeHo enables
              chatbots that don’t just respond — they reason, adapt, and evolve with
              your product. From startups to enterprises, HeHo helps teams deploy AI
              with confidence, speed, and clarity.
            </p>
          </div>

          {/* Why HeHo Section */}
          <div className="max-w-4xl mx-auto mb-24">
            <h2 className="text-4xl font-bold text-foreground mb-6 text-center">
              Why HeHo?
            </h2>

            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <span className="text-primary font-bold text-xl mt-1">→</span>
                <p className="text-lg md:text-xl text-muted-foreground">
                  <strong>Open & Flexible:</strong> Built on an open-source foundation
                  using free OpenRouter models, HeHo ensures you are never locked into
                  a single provider. You maintain full freedom to customize, extend,
                  and evolve your AI stack.
                </p>
              </li>

              <li className="flex items-start gap-4">
                <span className="text-primary font-bold text-xl mt-1">→</span>
                <p className="text-lg md:text-xl text-muted-foreground">
                  <strong>Data-First & Secure:</strong> Your data remains in your own
                  database, under your control. HeHo provides fine-grained permissions
                  so you decide exactly what the AI can read, write, or generate —
                  ensuring trust and compliance at every step.
                </p>
              </li>

              <li className="flex items-start gap-4">
                <span className="text-primary font-bold text-xl mt-1">→</span>
                <p className="text-lg md:text-xl text-muted-foreground">
                  <strong>No Code, Real Power:</strong> Define your chatbot’s purpose,
                  connect it to your data, and deploy it in minutes. HeHo removes the
                  complexity of AI infrastructure so you can focus on building
                  meaningful experiences.
                </p>
              </li>
            </ul>
          </div>

          {/* Built With Section */}
          <Card className="max-w-2xl mx-auto p-8 border-primary/30 bg-primary/5 mb-20">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Built with the Best
            </h2>

            <p className="text-muted-foreground mb-6">
              HeHo is built using modern, battle-tested technologies trusted by
              developers worldwide.
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="bg-background/50 px-4 py-2 rounded-lg">
                <p className="font-semibold text-foreground">Sparrow</p>
                <p className="text-sm text-muted-foreground">Design & Vision</p>
              </div>

              <div className="bg-background/50 px-4 py-2 rounded-lg">
                <p className="font-semibold text-foreground">OpenRouter</p>
                <p className="text-sm text-muted-foreground">35+ AI Models</p>
              </div>

              <div className="bg-background/50 px-4 py-2 rounded-lg">
                <p className="font-semibold text-foreground">Supabase</p>
                <p className="text-sm text-muted-foreground">Database & Auth</p>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Ready to build your first AI chatbot?
            </h2>

            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join a growing community of builders and innovators. Start for free and
              experience how simple building AI can be.
            </p>

            <Link href="/signup">
              <Button size="lg" className="group">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
