import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Mail, MessageSquare } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-5xl font-bold text-foreground mb-6 text-center">Get in Touch</h1>
          <p className="text-lg text-muted-foreground text-center mb-16">Have questions? We'd love to hear from you.</p>

          <Card className="p-8 border-border/50 bg-card/50">
            <h2 className="text-2xl font-bold text-foreground mb-6">Send us a Message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                  <Input placeholder="Your name" className="bg-background/50 border-border/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <Input type="email" placeholder="your@email.com" className="bg-background/50 border-border/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                <Input placeholder="How can we help?" className="bg-background/50 border-border/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                <Textarea placeholder="Tell us more..." className="bg-background/50 border-border/50 min-h-[120px]" />
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Send Message</Button>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
