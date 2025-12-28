"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Plus, Settings, MessageSquare, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Chatbot {
  id: string
  name: string
  goal: string
  model: string
  created_at: string
  status: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        setUser(currentUser)

        // Load user data
        const { data: userData } = await supabase.from("users").select("*").eq("id", currentUser.id).single()

        if (userData && !userData.setup_completed) {
          router.push("/app/setup")
          return
        }

        setUserData(userData)

        // Load chatbots
        const { data: chatbotsData } = await supabase
          .from("chatbots")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })

        setChatbots(chatbotsData || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Manage your AI chatbots</p>
          </div>
          <Link href="/app/settings">
            <Button variant="outline" className="border-border/50 bg-transparent text-foreground hover:bg-white/10">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Plan Badge */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your Plan</h2>
            <p className="text-sm text-muted-foreground">Free tier - 1 chatbot, 10K messages/month</p>
          </div>
          <Badge className="bg-black text-white border border-white/20">Free Plan</Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Chatbots</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{chatbots.length}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Messages Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">0</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tokens Used</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">0 / 10K</p>
            </CardContent>
          </Card>
        </div>

        {/* Chatbots Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Your Chatbots</h2>
            <Link href="/app/chatbots/create">
              <Button className="bg-black hover:bg-gray-900 text-white border border-white/20">
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
                <p className="text-muted-foreground mb-6 text-center">Create your first AI chatbot to get started</p>
                <Link href="/app/chatbots/create">
                  <Button className="bg-black hover:bg-gray-900 text-white border border-white/20">
                    Create Your First Chatbot
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {chatbots.map((chatbot) => (
                <Card
                  key={chatbot.id}
                  className="border-border/50 bg-card/50 hover:border-white/30 hover:bg-card/80 transition-all cursor-pointer"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-foreground">{chatbot.name}</CardTitle>
                        <CardDescription className="text-muted-foreground">{chatbot.goal}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-card text-foreground">
                        {chatbot.model}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/app/chatbots/${chatbot.id}`}>
                      <Button className="w-full bg-black hover:bg-gray-900 text-white border border-white/20">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Open Chat
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
