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
import { AlertCircle, Loader2, ArrowRight, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

const POPULAR_MODELS = [
    { id: "allenai/olmo-3.1-32b-think:free", name: "AllenAI: Olmo 3.1 32B Think" },
    { id: "xiaomi/mimo-v2-flash:free", name: "Xiaomi: MiMo-V2-Flash" },
    { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "NVIDIA: Nemotron 3 Nano 30B A3B" },
    { id: "mistralai/devstral-2512:free", name: "Mistral: Devstral 2 2512" },
    { id: "nex-agi/deepseek-v3.1-nex-n1:free", name: "Nex AGI: DeepSeek V3.1 Nex N1" },
    { id: "arcee-ai/trinity-mini:free", name: "Arcee AI: Trinity Mini" },
    { id: "tngtech/tng-r1t-chimera:free", name: "TNG: R1T Chimera" },
    { id: "kwaipilot/kat-coder-pro:free", name: "Kwaipilot: KAT-Coder-Pro V1" },
    { id: "nvidia/nemotron-nano-12b-v2-vl:free", name: "NVIDIA: Nemotron Nano 12B 2 VL" },
    { id: "alibaba/tongyi-deepresearch-30b-a3b:free", name: "Tongyi DeepResearch 30B A3B" },
    { id: "nvidia/nemotron-nano-9b-v2:free", name: "NVIDIA: Nemotron Nano 9B V2" },
    { id: "openai/gpt-oss-120b:free", name: "OpenAI: gpt-oss-120b" },
    { id: "openai/gpt-oss-20b:free", name: "OpenAI: gpt-oss-20b" },
    { id: "z-ai/glm-4.5-air:free", name: "Z.AI: GLM 4.5 Air" },
    { id: "qwen/qwen3-coder:free", name: "Qwen: Qwen3 Coder 480B A35B" },
    { id: "moonshotai/kimi-k2:free", name: "MoonshotAI: Kimi K2 0711" },
    { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", name: "Venice: Uncensored" },
    { id: "google/gemma-3n-e2b-it:free", name: "Google: Gemma 3n 2B" },
    { id: "tngtech/deepseek-r1t2-chimera:free", name: "TNG: DeepSeek R1T2 Chimera" },
    { id: "deepseek/deepseek-r1-0528:free", name: "DeepSeek: R1 0528" },
    { id: "google/gemma-3n-e4b-it:free", name: "Google: Gemma 3n 4B" },
    { id: "qwen/qwen3-4b:free", name: "Qwen: Qwen3 4B" },
    { id: "tngtech/deepseek-r1t-chimera:free", name: "TNG: DeepSeek R1T Chimera" },
    { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral: Mistral Small 3.1 24B" },
    { id: "google/gemma-3-4b-it:free", name: "Google: Gemma 3 4B" },
    { id: "google/gemma-3-12b-it:free", name: "Google: Gemma 3 12B" },
    { id: "google/gemma-3-27b-it:free", name: "Google: Gemma 3 27B" },
    { id: "google/gemini-2.0-flash-exp:free", name: "Google: Gemini 2.0 Flash Experimental" },
    { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Meta: Llama 3.3 70B Instruct" },
    { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Meta: Llama 3.2 3B Instruct" },
    { id: "qwen/qwen-2.5-vl-7b-instruct:free", name: "Qwen: Qwen2.5-VL 7B Instruct" },
    { id: "nousresearch/hermes-3-llama-3.1-405b:free", name: "Nous: Hermes 3 405B Instruct" },
    { id: "meta-llama/llama-3.1-405b-instruct:free", name: "Meta: Llama 3.1 405B Instruct" },
    { id: "mistralai/mistral-7b-instruct:free", name: "Mistral: Mistral 7B Instruct" }
];

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

const THEMES = [
  { value: "dark", label: "Dark", color: "bg-black" },
  { value: "light", label: "Light", color: "bg-white" },
  { value: "blue", label: "Blue", color: "bg-blue-600" },
  { value: "green", label: "Green", color: "bg-green-600" },
  { value: "purple", label: "Purple", color: "bg-purple-600" },
]

export default function CreateChatbotPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [generatingPrompt, setGeneratingPrompt] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    description: "",
    tone: "professional",
    models: [] as string[],
    theme: "light",
  })
  const [error, setError] = useState<string | null>(null)
  const [chatbotCount, setChatbotCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUserAndPlan = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)

      const { data, count } = await supabase
        .from("chatbots")
        .select("*", { count: "exact" })
        .eq("user_id", currentUser.id)

      setChatbotCount(count || 0)
      setLoading(false)
    }

    checkUserAndPlan()
  }, [])

  const generatePromptFromGoal = async () => {
    if (!formData.name || !formData.goal) {
      setError("Please enter chatbot name and select a goal first")
      return
    }

    setGeneratingPrompt(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          goal: formData.goal,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate prompt")

      const { prompt } = await response.json()
      setFormData((prev) => ({
        ...prev,
        description: prompt,
      }))
    } catch (err) {
      setError("Failed to generate prompt. Please write your own.")
      console.error(err)
    } finally {
      setGeneratingPrompt(false)
    }
  }

  const handleCreateChatbot = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      if (chatbotCount > 0) {
        throw new Error("You can only create one chatbot on the free plan.")
      }

      if (!formData.name || !formData.goal || !formData.description || formData.models.length === 0) {
        throw new Error("Please fill in all required fields and select at least one model")
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
          model: formData.models[0],
          theme: formData.theme,
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

  const handleModelSelection = (modelId: string) => {
    setFormData(prev => {
        const newModels = prev.models.includes(modelId) 
            ? prev.models.filter(id => id !== modelId)
            : [...prev.models, modelId].slice(0, 3);
        return {...prev, models: newModels};
    });
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
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/app/dashboard" className="text-primary hover:underline mb-8 block">
          ← Back to Dashboard
        </Link>

        {chatbotCount > 0 ? (
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-2xl">Free Plan Limit Reached</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You have reached the maximum of 1 chatbot for the free plan. Please upgrade to a paid plan to create
                more chatbots.
              </p>
              <Button disabled>Create Chatbot</Button>
            </CardContent>
          </Card>
        ) : (
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
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-foreground">Project Description *</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generatePromptFromGoal}
                      disabled={generatingPrompt || !formData.name || !formData.goal}
                      className="border-border/50 text-foreground hover:bg-white/10 bg-transparent h-8 text-xs"
                    >
                      {generatingPrompt ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-1 h-3 w-3" />
                          AI Generate
                        </>
                      )}
                    </Button>
                  </div>
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
                    <label className="block text-sm font-medium text-foreground mb-2">AI Models (select up to 3) *</label>
                    <div className="grid grid-cols-2 gap-2">
                        {POPULAR_MODELS.map(model => (
                            <Button 
                                type="button"
                                key={model.id} 
                                variant={formData.models.includes(model.id) ? "secondary" : "outline"}
                                onClick={() => handleModelSelection(model.id)}
                            >
                                {model.name}
                            </Button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Selected {formData.models.length}/3 models. The first model will be the primary.
                    </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Theme (Optional)</label>
                  <div className="grid grid-cols-5 gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, theme: t.value })}
                        className={`aspect-square rounded-lg border-2 transition-all ${
                          formData.theme === t.value ? "border-white" : "border-border/50"
                        } ${t.color}`}
                        title={t.label}
                      >
                        <span className="sr-only">{t.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: {THEMES.find((t) => t.value === formData.theme)?.label}
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Use AI Generate to automatically create a detailed prompt based on your chatbot's goal
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
        )}
      </div>
    </div>
  )
}
