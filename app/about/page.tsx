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
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">About HeHo</h1>
            <p className="text-xl text-muted-foreground mb-8">
              HeHo is an open-source AI chatbot builder that empowers teams to create intelligent, context-aware
              chatbots without writing code.
            </p>
          </div>

          {/* Mission Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto mb-20">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                We believe that AI should be accessible to everyone. Developers, product teams, and business users
                should be able to build intelligent chatbots without deep machine learning expertise.
              </p>
              <p className="text-muted-foreground">
                HeHo makes it simple to connect AI models to your data, creating chatbots that truly understand your
                business context.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Why HeHo?</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">→</span>
                  <span className="text-muted-foreground">
                    <strong>Free & Open:</strong> Built on free OpenRouter models with no vendor lock-in
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">→</span>
                  <span className="text-muted-foreground">
                    <strong>Data First:</strong> Your data stays in your Supabase database
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">→</span>
                  <span className="text-muted-foreground">
                    <strong>No Code:</strong> Create chatbots with a simple form, no programming required
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Built by Section */}
          <Card className="max-w-2xl mx-auto p-8 border-primary/30 bg-primary/5 mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-4">Built with</h2>
            <div className="flex flex-wrap gap-4">
              <div className="bg-background/50 px-4 py-2 rounded-lg">
                <p className="font-semibold text-foreground">Sparrow</p>
                <p className="text-sm text-muted-foreground">Design & Vision</p>
              </div>
              <div className="bg-background/50 px-4 py-2 rounded-lg">
                <p className="font-semibold text-foreground">OpenRouter</p>
                <p className="text-sm text-muted-foreground">AI Models</p>
              </div>
              <div className="bg-background/50 px-4 py-2 rounded-lg">
                <p className="font-semibold text-foreground">Supabase</p>
                <p className="text-sm text-muted-foreground">Database & Auth</p>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-foreground mb-6">Ready to build your first chatbot?</h2>
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground group">
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
