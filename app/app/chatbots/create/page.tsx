"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, ArrowRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

const POPULAR_MODELS = [
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B (Recommended)",
    description: "Balanced, powerful, best for most use cases",
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash",
    description: "Fast, handles long context well",
  },
  {
    id: "mistralai/mistral-small-3.1-24b-instruct:free",
    name: "Mistral Small 3.1",
    description: "Fast and efficient for quick responses",
  },
  {
    id: "google/gemma-3-12b-it:free",
    name: "Gemma 3 12B",
    description: "Lightweight, good for simple tasks",
  },
]

const GOALS = [
  { value: "support", label: "Customer Support" },
  { value: "sales", label: "Sales Assistant" },
  { value: "knowledge", label: "Knowledge Base Q&A" },
  { value: "lead", label: "Lead Capture" },
  { value: "custom", label: "Custom" },
]

const TONES = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "strict", label: "Strict" },
]

export default function CreateChatbotPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    description: "",
    tone: "professional",
    model: "meta-llama/llama-3.3-70b-instruct:free",
  })
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)
      setLoading(false)
    }

    checkUser()
  }, [])

  const handleCreateChatbot = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      if (!formData.name || !formData.goal || !formData.description) {
        throw new Error("Please fill in all required fields")
      }

      if (formData.description.length < 200) {
        throw new Error("Project description must be at least 200 characters")
      }

      const { data, error: insertError } = await supabase
        .from("chatbots")
        .insert({
          user_id: user.id,
          name: formData.name,
          goal: formData.goal,
          description: formData.description,
          tone: formData.tone,
          model: formData.model,
          status: "active",
        })
        .select()
        .single()

      if (insertError) throw insertError

      router.push(`/app/chatbots/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create chatbot")
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Link href="/app/dashboard" className="text-primary hover:underline mb-8 block">
          ← Back to Dashboard
        </Link>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-3xl">Create New Chatbot</CardTitle>
            <CardDescription>Set up your AI chatbot with just a few details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateChatbot} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Chatbot Name *</label>
                <Input
                  placeholder="e.g., Customer Support Bot"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-background/50 border-border/50"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">{formData.name.length}/50 characters</p>
              </div>

              {/* Goal */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Chatbot Goal *</label>
                <Select value={formData.goal} onValueChange={(value) => setFormData({ ...formData, goal: value })}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue placeholder="Select a goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOALS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Project Description *</label>
                <Textarea
                  placeholder="Describe your project in detail. Include: What your app does, what data exists in your Supabase, what users will ask, what the chatbot should never do, any business rules."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-background/50 border-border/50 min-h-32"
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length}/5000 characters (min 200 required)
                </p>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tone (Optional)</label>
                <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* AI Model */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">AI Model *</label>
                <Select value={formData.model} onValueChange={(value) => setFormData({ ...formData, model: value })}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {POPULAR_MODELS.find((m) => m.id === formData.model)?.description}
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The more detailed your project description, the better your chatbot will understand your business
                </AlertDescription>
              </Alert>

              {error && (
                <Alert className="border-destructive/50 bg-destructive/5">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={creating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Chatbot
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
