"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useParams } from "next/navigation"
import { Copy, Check, Loader2, ArrowLeft, Share2, Globe } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DeployChatbotPage() {
  const [chatbot, setChatbot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deployed, setDeployed] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deployUrl, setDeployUrl] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
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
        if (data.deployed) {
          setDeployed(true)
          const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
          setDeployUrl(`${baseUrl}/deploy/${chatbotId}`)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadChatbot()
  }, [chatbotId])

  const handleDeploy = async () => {
    try {
      setDeploying(true)
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
      const url = `${baseUrl}/deploy/${chatbotId}`

      const { error } = await supabase.from("chatbots").update({ deployed: true, deploy_url: url }).eq("id", chatbotId)

      if (error) throw error
      setDeployed(true)
      setDeployUrl(url)
    } catch (err) {
      console.error("Deployment error:", err)
    } finally {
      setDeploying(false)
    }
  }

  const handleUndeploy = async () => {
    try {
      setDeploying(true)
      const { error } = await supabase
        .from("chatbots")
        .update({ deployed: false, deploy_url: null })
        .eq("id", chatbotId)

      if (error) throw error
      setDeployed(false)
      setDeployUrl("")
    } catch (err) {
      console.error("Undeploy error:", err)
    } finally {
      setDeploying(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const embedCode = `<!-- HeHo Chatbot Widget -->
<div id="heho-chatbot-${chatbotId}" style="height: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"></div>
<script src="${typeof window !== "undefined" ? window.location.origin : ""}/embed.js"></script>
<script>
  HeHoChatbot.embed('${deployUrl}', 'heho-chatbot-${chatbotId}');
</script>`

  const iframeCode = `<iframe 
  src="${deployUrl}" 
  style="width: 100%; height: 600px; border: none; border-radius: 8px;"
  allow="microphone; camera">
</iframe>`

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (!chatbot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 border-border/50 bg-card/50">
          <p className="text-foreground">Chatbot not found</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/app/chatbots/${chatbot.id}`}>
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{chatbot.name} - Deploy</h1>
            {deployed && <Badge className="bg-green-600 text-white mt-2">Deployed</Badge>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {!deployed ? (
          <Card className="border-border/50 bg-card/50 mb-8">
            <CardHeader>
              <CardTitle>Deploy Your Chatbot</CardTitle>
              <CardDescription>Make your chatbot publicly accessible</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription className="text-foreground">
                  Deploying will make your chatbot accessible to anyone with the public link. No authentication
                  required.
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleDeploy}
                disabled={deploying}
                className="bg-black hover:bg-gray-900 text-white border border-white/20"
              >
                {deploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Deploy Chatbot
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="border-green-600/50 bg-green-600/10">
                <CardHeader>
                  <CardTitle className="text-green-400">Deployment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="bg-green-600 text-white mb-4">Active</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your chatbot is live and accessible to anyone with the link.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleUndeploy}
                    disabled={deploying}
                    className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
                  >
                    {deploying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Undeploying...
                      </>
                    ) : (
                      "Undeploy Chatbot"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle>Public URL</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={deployUrl}
                      readOnly
                      className="bg-background/50 border-border/50 text-foreground text-sm"
                    />
                    <Button
                      onClick={() => copyToClipboard(deployUrl, "url")}
                      className="bg-white hover:bg-gray-200 text-black px-3"
                    >
                      {copied === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Link href={deployUrl} target="_blank">
                    <Button className="w-full border-border/50 text-foreground hover:bg-white/10 bg-transparent">
                      <Share2 className="mr-2 h-4 w-4" />
                      Open Public Link
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="embed" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-card/50 border border-border/50">
                <TabsTrigger value="embed">Embed Code</TabsTrigger>
                <TabsTrigger value="iframe">iframe</TabsTrigger>
              </TabsList>

              <TabsContent value="embed" className="space-y-4">
                <Card className="border-border/50 bg-card/50">
                  <CardHeader>
                    <CardTitle>Embed Widget</CardTitle>
                    <CardDescription>Add this code to your website to embed the chatbot widget</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-background/50 border border-border/50 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words">
                        {embedCode}
                      </pre>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(embedCode, "embed")}
                      className="w-full bg-white hover:bg-gray-200 text-black"
                    >
                      {copied === "embed" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      Copy Embed Code
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="iframe" className="space-y-4">
                <Card className="border-border/50 bg-card/50">
                  <CardHeader>
                    <CardTitle>iframe Embed</CardTitle>
                    <CardDescription>Embed your chatbot using an iframe tag</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-background/50 border border-border/50 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words">
                        {iframeCode}
                      </pre>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(iframeCode, "iframe")}
                      className="w-full bg-white hover:bg-gray-200 text-black"
                    >
                      {copied === "iframe" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      Copy iframe Code
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="border-border/50 bg-card/50 mt-8">
              <CardHeader>
                <CardTitle>Integration Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Next.js / React</h3>
                  <p>Use the iframe method and wrap it in a Next.js dynamic import for lazy loading.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">HTML / Static Sites</h3>
                  <p>Copy either the embed code or iframe code and paste it anywhere in your HTML.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Styling</h3>
                  <p>Customize the width and height in the embed code to match your website design.</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
