import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-5xl font-bold text-foreground mb-8">Security & Privacy</h1>

          <div className="space-y-12">
            <Card className="p-8 border-border/50 bg-card/50">
              <h2 className="text-2xl font-bold text-foreground mb-4">Data Protection</h2>
              <p className="text-muted-foreground mb-4">
                Your data is your own. HeHo only stores authentication data in our Supabase instance. Your chatbot data,
                memories, and database connections are stored exclusively in your own Supabase project.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• All data encrypted in transit using HTTPS/TLS</li>
                <li>• API keys encrypted at rest using AES-256</li>
                <li>• No data sharing with third parties except OpenRouter (for AI processing)</li>
                <li>• Row Level Security (RLS) enforces data isolation between users</li>
              </ul>
            </Card>

            <Card className="p-8 border-border/50 bg-card/50">
              <h2 className="text-2xl font-bold text-foreground mb-4">API Key Security</h2>
              <p className="text-muted-foreground mb-4">
                Your OpenRouter and Supabase API keys are encrypted and never exposed to the frontend.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Keys encrypted with AES-256 before storage</li>
                <li>• Only used server-side for API requests</li>
                <li>• Automatically rotated on demand</li>
                <li>• Never logged or exposed in error messages</li>
              </ul>
            </Card>

            <Card className="p-8 border-border/50 bg-card/50">
              <h2 className="text-2xl font-bold text-foreground mb-4">Authentication</h2>
              <p className="text-muted-foreground mb-4">Secure account protection powered by Supabase Auth.</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Email verification required for signup</li>
                <li>• Passwords hashed with bcrypt</li>
                <li>• JWT tokens with 7-day expiration</li>
                <li>• CSRF protection on all state-changing requests</li>
              </ul>
            </Card>

            <Card className="p-8 border-border/50 bg-card/50">
              <h2 className="text-2xl font-bold text-foreground mb-4">Compliance</h2>
              <p className="text-muted-foreground mb-4">HeHo follows industry standards for data protection.</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• GDPR compliant data processing</li>
                <li>• User data deletion on account removal</li>
                <li>• No automated decision-making or profiling</li>
                <li>• Regular security audits and updates</li>
              </ul>
            </Card>

            <Card className="p-8 border-border/50 bg-card/50">
              <h2 className="text-2xl font-bold text-foreground mb-4">Database Permissions</h2>
              <p className="text-muted-foreground mb-4">You control what your AI can access and modify.</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Read-only access (disabled by default for write operations)</li>
                <li>• Insert new rows (enabled by default)</li>
                <li>• Create new tables (disabled by default)</li>
                <li>• Delete data (permanently disabled for safety)</li>
              </ul>
            </Card>

            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-8">
              <h3 className="text-lg font-bold text-foreground mb-2">Report Security Issues</h3>
              <p className="text-muted-foreground">
                Found a security vulnerability? Please email security@heho.dev instead of opening a public issue.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
