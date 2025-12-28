"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useParams } from "next/navigation"
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

const MODELS = [
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B" },
  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash" },
  { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1" },
  { id: "google/gemma-3-12b-it:free", name: "Gemma 3 12B" },
]

const TONES = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "strict", label: "Strict" },
]

export default function ChatbotSettingsPage() {
  const [chatbot, setChatbot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    description: "",
    tone: "professional",
    model: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const chatbotId = params.id as string

  useEffect(() => {
    const loadChatbot = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        const { data } = await supabase.from("chatbots").select("*").eq("id", chatbotId).eq("user_id", user.id).single()

        if (!data) {
          router.push("/app/dashboard")
          return
        }

        setChatbot(data)
        setFormData({
          name: data.name,
          goal: data.goal,
          description: data.description,
          tone: data.tone,
          model: data.model,
        })
      } catch (err) {
        console.error(err)
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }

    loadChatbot()
  }, [chatbotId])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from("chatbots")
        .update({
          name: formData.name,
          goal: formData.goal,
          description: formData.description,
          tone: formData.tone,
          model: formData.model,
        })
        .eq("id", chatbotId)

      if (updateError) throw updateError

      setSuccess("Settings saved successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSaving(false)
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
        <Link href={`/app/chatbots/${chatbotId}`} className="text-primary hover:underline mb-8 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-8">Chatbot Settings</h1>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Edit Chatbot</CardTitle>
            <CardDescription>Update your chatbot configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background/50 border-border/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Goal</label>
              <Input
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="bg-background/50 border-border/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-background/50 border-border/50 min-h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tone</label>
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">AI Model</label>
              <Select value={formData.model} onValueChange={(value) => setFormData({ ...formData, model: value })}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert className="border-destructive/50 bg-destructive/5">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-primary/50 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary">{success}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/90" size="lg">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
