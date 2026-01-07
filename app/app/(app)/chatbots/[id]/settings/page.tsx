'use client'

import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Loader2, AlertCircle, ArrowLeft, Database, Copy, Check, Share2, Globe, Clock, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChatbotShare } from '@/hooks/useChatbotShare'
import { Badge } from '@/components/ui/badge'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatDistanceToNow } from 'date-fns'

const MODELS = [
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

interface ConnectedTable {
  id: number
  table_name: string
}

function ChatbotSettingsPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "config")
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
    data_table_name: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [connectedTables, setConnectedTables] = useState<ConnectedTable[]>([])
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const chatbotId = params.id as string

  const { share, loading: shareLoading, createShareLink, deleteShareLink } = useChatbotShare(chatbotId)
  
  const [deploying, setDeploying] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [expires, setExpires] = useState(false)
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined)
  const [countdown, setCountdown] = useState('')

  const deployUrl = share ? `${window.location.origin}/deploy/${share.share_token}` : ''

  useEffect(() => {
    if (share?.expires_at) {
      const updateCountdown = () => {
        const distance = formatDistanceToNow(new Date(share.expires_at!), { addSuffix: true })
        setCountdown(`Expires ${distance}`)
      }
      updateCountdown()
      const interval = setInterval(updateCountdown, 60000) // Update every minute
      return () => clearInterval(interval)
    }
  }, [share])

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        // Fetch chatbot data
        const { data: chatbotData } = await supabase.from("chatbots").select("*").eq("id", chatbotId).eq("user_id", user.id).single()

        if (!chatbotData) {
          router.push("/app/dashboard")
          return
        }

        setChatbot(chatbotData)
        setFormData({
          name: chatbotData.name,
          goal: chatbotData.goal,
          description: chatbotData.description,
          tone: chatbotData.tone,
          model: chatbotData.model,
          theme: chatbotData.theme || "sky",
          data_table_name: chatbotData.data_table_name || "_none_",
        })

        // Fetch connected tables
        const { data: tablesData } = await supabase.from('user_connected_tables').select('id, table_name').eq('user_id', user.id)
        setConnectedTables(tablesData || [])

      } catch (err) {
        console.error(err)
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }

    loadData()
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
          data_table_name: formData.data_table_name === '_none_' ? null : formData.data_table_name,
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

  const handleDeploy = async () => {
    setDeploying(true)
    await createShareLink(expires ? expiryDate! : null)
    setDeploying(false)
  }

  const handleUndeploy = async () => {
    setDeploying(true)
    await deleteShareLink()
    setDeploying(false)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }
  
  const selectedTheme = THEMES.find((t) => t.value === formData.theme) || THEMES[0];
  const embedCode = `<!-- HeHo Chatbot Widget -->
<div id="heho-chatbot-${chatbotId}" style="height: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"></div>
<script src="${window.location.origin}/embed.js"></script>
<script>
  HeHoChatbot.embed('${deployUrl}', 'heho-chatbot-${chatbotId}');
</script>`

  const iframeCode = `<iframe src="${deployUrl}" style="width: 100%; height: 600px; border: none; border-radius: 8px;" allow="microphone; camera"></iframe>`


  if (loading || shareLoading) {
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  <label className="block text-sm font-medium text-foreground mb-2">Data Source</label>
                  <Select value={formData.data_table_name || '_none_'} onValueChange={(value) => setFormData({ ...formData, data_table_name: value })}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none_">None</SelectItem>
                      {connectedTables.map((t) => (
                        <SelectItem key={t.id} value={t.table_name}>
                           <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            {t.table_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {connectedTables.length === 0 && (
                    <p className='text-xs text-muted-foreground mt-2'>No database tables connected. <Link href="/app/database" className="text-primary hover:underline">Connect one here</Link>.</p>
                  )}
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
             {!share ? (
          <Card className='border-border/50 bg-card/50 mb-8'>
            <CardHeader>
              <CardTitle>Deploy Your Chatbot</CardTitle>
              <CardDescription>Make your chatbot publicly accessible.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <Alert>
                <Globe className='h-4 w-4' />
                <AlertDescription className='text-foreground'>
                  Deploying will generate a public link. Anyone with this link can interact with your chatbot.
                </AlertDescription>
              </Alert>
              <div className='flex items-center space-x-2'>
                <Switch id='expires' checked={expires} onCheckedChange={setExpires} />
                <Label htmlFor='expires'>Set an expiration date</Label>
              </div>
              {expires && (
                <DateTimePicker date={expiryDate} setDate={setExpiryDate} />
              )}
              <Button
                onClick={handleDeploy}
                disabled={deploying || (expires && !expiryDate)}
                className='w-full bg-black hover:bg-gray-900 text-white border border-white/20'
              >
                {deploying ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Globe className='mr-2 h-4 w-4' />}
                Deploy Chatbot
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
              <Card className='border-green-600/50 bg-green-600/10'>
                <CardHeader>
                  <CardTitle className='text-green-400'>Deployment Status</CardTitle>
                  {share.expires_at && <p className='text-sm text-green-300 pt-2'>{countdown}</p>}
                </CardHeader>
                <CardContent>
                  <Badge className='bg-green-600 text-white mb-4'>Active</Badge>
                  <p className='text-sm text-muted-foreground mb-4'>
                    Your chatbot is live. Anyone with the link can access it.
                  </p>
                  <Button
                    variant='outline'
                    onClick={handleUndeploy}
                    disabled={deploying}
                    className='w-full border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent'
                  >
                    {deploying ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : 'Undeploy Chatbot'}
                  </Button>
                </CardContent>
              </Card>

              <Card className='border-border/50 bg-card/50'>
                <CardHeader>
                  <CardTitle>Public URL</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex gap-2'>
                    <Input value={deployUrl} readOnly className='bg-background/50 border-border/50 text-foreground text-sm' />
                    <Button onClick={() => copyToClipboard(deployUrl, 'url')} className='bg-white hover:bg-gray-200 text-black px-3'>
                      {copied === 'url' ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
                    </Button>
                  </div>
                  <Link href={deployUrl} target='_blank'>
                    <Button className='w-full border-border/50 text-foreground hover:bg-white/10 bg-transparent'>
                      <Share2 className='mr-2 h-4 w-4' />
                      Open Public Link
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue='embed' className='w-full'>
               <TabsList className="grid w-full grid-cols-2 bg-card/50 border border-border/50">
                <TabsTrigger value="embed">Embed Code</TabsTrigger>
                <TabsTrigger value="iframe">iframe</TabsTrigger>
              </TabsList>
              <TabsContent value='embed'>
                <Card className='border-border/50 bg-card/50'>
                  <CardHeader>
                      <CardTitle>Embed Widget</CardTitle>
                      <CardDescription>Add this code to your website to embed the chatbot widget</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='bg-background/50 border border-border/50 rounded-lg p-4 overflow-x-auto'>
                      <pre className='text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words'>{embedCode}</pre>
                    </div>
                    <Button onClick={() => copyToClipboard(embedCode, 'embed')} className='w-full bg-white hover:bg-gray-200 text-black'>
                      {copied === 'embed' ? <Check className='h-4 w-4 mr-2' /> : <Copy className='h-4 w-4 mr-2' />}Copy Embed Code
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value='iframe'>
                <Card className='border-border/50 bg-card/50'>
                   <CardHeader>
                    <CardTitle>iframe Embed</CardTitle>
                    <CardDescription>Embed your chatbot using an iframe tag</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='bg-background/50 border border-border/50 rounded-lg p-4 overflow-x-auto'>
                      <pre className='text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words'>{iframeCode}</pre>
                    </div>
                    <Button onClick={() => copyToClipboard(iframeCode, 'iframe')} className='w-full bg-white hover:bg-gray-200 text-black'>
                      {copied === 'iframe' ? <Check className='h-4 w-4 mr-2' /> : <Copy className='h-4 w-4 mr-2' />}Copy iframe Code
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function ChatbotSettingsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatbotSettingsPage />
    </Suspense>
  )
}
