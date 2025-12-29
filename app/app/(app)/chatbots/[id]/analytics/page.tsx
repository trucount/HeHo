"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ChatbotAnalyticsPage() {
  const [chatbot, setChatbot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const chatbotId = params.id as string

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

        const { data: chatbotData } = await supabase
          .from("chatbots")
          .select("*")
          .eq("id", chatbotId)
          .eq("user_id", user.id)
          .single()

        if (!chatbotData) {
          router.push("/app/chatbots")
          return
        }

        setChatbot(chatbotData)
      } catch (err) {
        console.error(err)
        router.push("/app/chatbots")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [chatbotId])

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
        <Card className="p-6">
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
          <div>
            <h1 className="text-2xl font-bold text-foreground">{chatbot.name} - Analytics</h1>
            <p className="text-sm text-muted-foreground">{chatbot.model}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Chatbot Analytics</CardTitle>
            <CardDescription>Performance metrics for this chatbot</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-border/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Total Conversations</p>
              <p className="text-3xl font-bold text-foreground">0</p>
            </div>
            <div className="p-4 border border-border/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Total Messages</p>
              <p className="text-3xl font-bold text-foreground">0</p>
            </div>
            <div className="p-4 border border-border/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Avg Response Time</p>
              <p className="text-3xl font-bold text-foreground">-</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 mt-6">
          <CardHeader>
            <CardTitle>Chatbot Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-foreground font-semibold">{chatbot.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="text-foreground font-semibold">{chatbot.model}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Goal</p>
                <p className="text-foreground font-semibold">{chatbot.goal}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-foreground font-semibold">{new Date(chatbot.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
