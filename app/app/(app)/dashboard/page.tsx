"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Plus, Settings, MessageSquare, Loader2, TrendingUp, Zap } from "lucide-react"
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
}

interface Usage {
  messages: number
  tokens: number
}

const TOKEN_LIMIT_PER_DAY = 1000000
const MESSAGE_LIMIT_PER_DAY = 10000

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [usage, setUsage] = useState<Usage>({ messages: 0, tokens: 0 })
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

        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentUser.id)
          .single()

        if (userError && userError.code !== "PGRST116") {
          console.error("User fetch error:", userError)
        }

        if (userData && !userData.setup_completed) {
          router.push("/app/setup")
          return
        }

        setUserData(userData)

        // Fetch chatbots with error handling
        const { data: chatbotsData, error: chatbotsError } = await supabase
          .from("chatbots")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })

        if (chatbotsError) {
          console.error("Chatbots fetch error:", chatbotsError)
          setChatbots([])
        } else {
          setChatbots(chatbotsData || [])
        }

        // Calculate today's date range for filtering usage
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const startOfDay = new Date(today)
        const endOfDay = new Date(today)
        endOfDay.setDate(endOfDay.getDate() + 1)

        const { data: usageData, error: usageError } = await supabase
          .from("usage")
          .select("*")
          .eq("user_id", currentUser.id)
          .gte("created_at", startOfDay.toISOString())
          .lt("created_at", endOfDay.toISOString())

        if (usageError) {
          console.error("Usage fetch error:", usageError)
          setUsage({ messages: 0, tokens: 0 })
        } else if (usageData && usageData.length > 0) {
          const totalMessages = usageData.reduce((acc, item) => acc + (item.messages || 0), 0)
          const totalTokens = usageData.reduce((acc, item) => acc + (item.tokens || 0), 0)
          setUsage({ messages: totalMessages, tokens: totalTokens })
        } else {
          setUsage({ messages: 0, tokens: 0 })
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        setUsage({ messages: 0, tokens: 0 })
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

  const tokenPercentage = (usage.tokens / TOKEN_LIMIT_PER_DAY) * 100
  const messagePercentage = (usage.messages / MESSAGE_LIMIT_PER_DAY) * 100

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Plan Badge and Limits */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your Plan</h2>
            <p className="text-sm text-muted-foreground">
              Free tier - Unlimited chatbots, 10K messages/day, 1M tokens/day
            </p>
          </div>
          <Badge className="bg-black text-white border border-white/20">Free Plan</Badge>
        </div>

        {/* Enhanced Analytics Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Active Chatbots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{chatbots.length}</p>
              <p className="text-xs text-muted-foreground mt-2">Created this month</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Messages Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{usage.messages.toLocaleString()}</p>
              <div className="mt-2 bg-background/50 rounded-full h-1.5">
                <div
                  className="bg-white h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(messagePercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{MESSAGE_LIMIT_PER_DAY.toLocaleString()} limit</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Tokens Used Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{(usage.tokens / 1000).toFixed(1)}K</p>
              <div className="mt-2 bg-background/50 rounded-full h-1.5">
                <div
                  className="bg-white h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(tokenPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{(TOKEN_LIMIT_PER_DAY / 1000).toFixed(0)}K limit</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Usage Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {Math.max(0, 100 - Math.round(tokenPercentage)).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground mt-2">Remaining capacity</p>
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
                <Link key={chatbot.id} href={`/app/chatbots/${chatbot.id}`}>
                  <Card className="border-border/50 bg-card/50 hover:border-white/30 hover:bg-card/80 transition-all cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-foreground">{chatbot.name}</CardTitle>
                          <CardDescription className="text-muted-foreground text-xs mt-2">
                            {chatbot.goal}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-card text-foreground flex-shrink-0 ml-2">
                          {chatbot.model}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
                        <span>Created: {new Date(chatbot.created_at).toLocaleDateString()}</span>
                      </div>
                      <Button
                        className="w-full bg-black hover:bg-gray-900 text-white border border-white/20"
                        variant="default"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Open Chat
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
