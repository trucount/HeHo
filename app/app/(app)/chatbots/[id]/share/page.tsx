"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useParams } from "next/navigation"
import { Copy, Check, Loader2, ArrowLeft, Share2 } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ShareChatbotPage() {
  const [chatbot, setChatbot] = useState<any>(null)
  const [shareLink, setShareLink] = useState("")
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
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

        // Generate share token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
        setShareLink(`${baseUrl}/chat/${chatbotId}/${token}`)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadChatbot()
  }, [chatbotId])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-card/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/app/chatbots/${chatbotId}`} className="text-white hover:underline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-3xl text-foreground flex items-center gap-2">
              <Share2 className="h-8 w-8" />
              Share {chatbot?.name}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Create a public link to share your chatbot with others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription className="text-foreground">
                Anyone with this link can chat with your bot. The chatbot will have read access to your Supabase
                database based on your configured permissions.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Public Share Link</label>
              <div className="flex gap-2">
                <Input value={shareLink} readOnly className="bg-background/50 border-border/50 text-foreground" />
                <Button
                  onClick={copyToClipboard}
                  className="bg-white hover:bg-gray-200 text-black px-4 flex items-center gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Click to copy the link to clipboard</p>
            </div>

            <div className="p-4 bg-white/5 border border-white/20 rounded-lg space-y-2">
              <h3 className="font-semibold text-foreground">Security & Privacy</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Shared chatbots are public and anyone with the link can access them</li>
                <li>• Do not share sensitive data or database credentials in chatbot context</li>
                <li>• The AI will only access data based on your database permissions</li>
                <li>• Messages from public chatbots are tracked in your usage analytics</li>
              </ul>
            </div>

            <div className="p-4 bg-white/5 border border-white/20 rounded-lg space-y-2">
              <h3 className="font-semibold text-foreground">How It Works</h3>
              <p className="text-sm text-muted-foreground">
                Users visit the link you share and can chat directly with your AI chatbot. The chatbot uses the same
                OpenRouter API key and Supabase configuration you set up during setup. Each conversation is independent
                and stored in your Supabase database.
              </p>
            </div>

            <Link href={`/app/chatbots/${chatbotId}`}>
              <Button className="w-full bg-white hover:bg-gray-200 text-black">Back to Chat</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
