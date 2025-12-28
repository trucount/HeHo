import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"

const integrations = [
  {
    name: "OpenRouter",
    description: "Access to 35+ free AI models including Llama, Mistral, Gemma, and more",
    features: ["Free models", "No API key required for free tier", "Model switching at any time"],
    status: "Active",
  },
  {
    name: "Supabase",
    description: "Connect your Supabase database for secure data storage and management",
    features: ["Email authentication", "Row-level security", "Real-time subscriptions"],
    status: "Active",
  },
  {
    name: "Custom Databases",
    description: "Connect to PostgreSQL, MySQL, or any database via Supabase",
    features: ["Full database access", "Query builder", "Backup support"],
    status: "Beta",
  },
]

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-5xl font-bold text-foreground mb-6 text-center">Integrations</h1>
          <p className="text-lg text-muted-foreground text-center mb-16">
            HeHo integrates with the best tools to power your AI chatbots
          </p>

          <div className="grid grid-cols-1 gap-6">
            {integrations.map((integration) => (
              <Card key={integration.name} className="p-8 border-border/50 bg-card/50">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-foreground">{integration.name}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      integration.status === "Active" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                    }`}
                  >
                    {integration.status}
                  </span>
                </div>
                <p className="text-muted-foreground mb-6">{integration.description}</p>
                <div className="space-y-2">
                  {integration.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
