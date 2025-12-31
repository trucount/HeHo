"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Plus, MessageSquare, Loader2, BarChart3, Settings, LinkIcon, Trash2 } from "lucide-react"
import Link from "next/link"

interface Chatbot {
  id: string
  name: string
  goal: string
  model: string
  created_at: string
  status: string
  messages_count?: number
  tokens_used?: number
  deployed?: boolean
  deploy_url?: string
}

export default function ChatbotsPage() {
  const [user, setUser] = useState<any>(null)
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadChatbots = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        setUser(currentUser)

        const { data: chatbotsData, error: chatbotsError } = await supabase
          .from("chatbots")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })

        if (chatbotsError) {
          console.error("Error loading chatbots:", chatbotsError)
          setChatbots([])
        } else {
          setChatbots(chatbotsData || [])
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    loadChatbots()
  }, [])

  const handleDeleteChatbot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this chatbot?")) return

    try {
      const { error } = await supabase.from("chatbots").delete().eq("id", id).eq("user_id", user.id)

      if (error) throw error
      setChatbots(chatbots.filter((c) => c.id !== id))
    } catch (err) {
      console.error("Error deleting chatbot:", err)
      alert("Failed to delete chatbot")
    }
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
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div class="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-foreground">Chatbots</h1>
            <p className="text-muted-foreground">Manage all your AI chatbots</p>
          </div>
          <Link href="/app/chatbots/create">
            <Button className="bg-black hover:bg-gray-900 text-white border border-white/20 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Chatbot
            </Button>
          </Link>
        </div>

        {chatbots.length === 0 ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No chatbots yet</h3>
              <p className="text-muted-foreground mb-6 text-center">Create your first chatbot to get started</p>
              <Link href="/app/chatbots/create">
                <Button className="bg-black hover:bg-gray-900 text-white border border-white/20">
                  Create Your First Chatbot
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chatbots.map((chatbot) => (
              <Card
                key={chatbot.id}
                className="border-border/50 bg-card/50 hover:border-white/30 hover:bg-card/80 transition-all"
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-foreground">{chatbot.name}</CardTitle>
                      <CardDescription className="text-muted-foreground">{chatbot.goal}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-card text-foreground">
                      {chatbot.model}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(chatbot.created_at).toLocaleDateString()}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {chatbot.deployed && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <LinkIcon className="h-3 w-3" />
                        Deployed
                      </div>
                      <input
                        type="text"
                        value={chatbot.deploy_url || ""}
                        readOnly
                        className="w-full bg-background/50 border border-border/50 rounded text-xs text-foreground px-2 py-1"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/app/chatbots/${chatbot.id}`} className="flex-1">
                      <Button className="w-full bg-black hover:bg-gray-900 text-white border border-white/20">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Chat
                      </Button>
                    </Link>
                    <Link href={`/app/chatbots/${chatbot.id}/analytics`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full border-border/50 text-foreground hover:bg-white/10 bg-transparent"
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analytics
                      </Button>
                    </Link>
                    <div className="flex gap-2">
                      <Link href={`/app/chatbots/${chatbot.id}/settings`}>
                        <Button
                          variant="outline"
                          className="border-border/50 text-foreground hover:bg-white/10 bg-transparent px-3"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent px-3"
                        onClick={() => handleDeleteChatbot(chatbot.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
