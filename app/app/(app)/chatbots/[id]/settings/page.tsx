'use client'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

const THEMES = [
  { value: 'twilight', label: 'Twilight', color: 'bg-gradient-to-r from-slate-900 to-slate-700', textColor: 'text-white' },
  { value: 'sunrise', label: 'Sunrise', color: 'bg-gradient-to-r from-amber-300 to-orange-500', textColor: 'text-white' },
  { value: 'ocean', label: 'Ocean', color: 'bg-gradient-to-r from-cyan-500 to-blue-500', textColor: 'text-white' },
  { value: 'forest', label: 'Forest', color: 'bg-gradient-to-r from-emerald-500 to-lime-600', textColor: 'text-white' },
  { value: 'grape', label: 'Grape', color: 'bg-gradient-to-r from-violet-500 to-purple-500', textColor: 'text-white' },
  { value: 'rose', label: 'Rose', color: 'bg-gradient-to-r from-pink-500 to-rose-500', textColor: 'text-white' },
  { value: 'sky', label: 'Sky', color: 'bg-gradient-to-r from-sky-400 to-cyan-300', textColor: 'text-black' },
  { value: 'candy', label: 'Candy', color: 'bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400', textColor: 'text-black' },
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
    theme: "sky",
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
          theme: data.theme || "sky",
        })
      } catch (err) {
        console.error(err)
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }

    loadChatbot()
  }, [chatbotId, router, supabase])

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
          theme: formData.theme,
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
  
  const selectedTheme = THEMES.find((t) => t.value === formData.theme) || THEMES[0];


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href={`/app/chatbots/${chatbotId}`} className="text-primary hover:underline mb-8 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-8">Chatbot Settings</h1>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-border/50">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="deploy">Deploy</TabsTrigger>
          </TabsList>

          <TabsContent value="config">
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

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
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
          </TabsContent>

          <TabsContent value="theme">
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle>Chatbot Theme</CardTitle>
                <CardDescription>Customize the appearance of your chatbot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-4">Select Theme</label>
                  <div className="grid grid-cols-4 gap-3">
                    {THEMES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, theme: t.value })}
                        className={`aspect-square rounded-lg border-2 transition-all transform hover:scale-105 ${
                          formData.theme === t.value ? "border-white ring-2 ring-white" : "border-border/50"
                        } ${t.color}`}
                        title={t.label}
                      >
                        <span className="sr-only">{t.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Selected: {THEMES.find((t) => t.value === formData.theme)?.label}
                  </p>
                </div>

                <div className="bg-background/50 border border-border/50 rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-3">Preview</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3 justify-end">
                      <div
                        className={`max-w-xs px-4 py-3 rounded-lg rounded-br-none border border-white/20 ${selectedTheme.color} ${selectedTheme.textColor}`}>
                        <p className="text-sm">This is a user message</p>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-start">
                      <div className="max-w-xs bg-card/50 border border-border/50 text-foreground rounded-lg rounded-bl-none px-4 py-3">
                        <p className="text-sm">This is a bot response</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Theme"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deploy">
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle>Deployment</CardTitle>
                <CardDescription>Manage your chatbot deployment</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/app/chatbots/${chatbotId}/deploy`}>
                  <Button className="w-full bg-primary hover:bg-primary/90">Go to Deploy Settings</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
