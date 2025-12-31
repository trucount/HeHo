'use client'

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useRouter, useParams } from "next/navigation"
import { Send, Loader2, ArrowLeft, Settings, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Chatbot {
  id: string
  name: string
  goal: string
  description: string
  model: string
  theme: string
}

interface Usage {
  messages: number
  tokens: number
}

const MESSAGE_LIMIT = 100
const TOKEN_LIMIT = 1000000

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

export default function ChatbotPage() {
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [usage, setUsage] = useState<Usage>({ messages: 0, tokens: 0 })
  const [limitReached, setLimitReached] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
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

        const { data: chatbotData, error: chatbotError } = await supabase
          .from("chatbots")
          .select("*")
          .eq("id", chatbotId)
          .eq("user_id", user.id)
          .single()

        if (chatbotError || !chatbotData) {
          router.push("/app/dashboard")
          return
        }

        setChatbot(chatbotData)

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayString = today.toISOString()

        const { data: usageData, error: usageError } = await supabase
          .from("usage")
          .select("messages, tokens")
          .eq("user_id", user.id)
          .gte("created_at", todayString)

        if (!usageError && usageData && usageData.length > 0) {
          const totalMessages = usageData.reduce((acc, item) => acc + (item.messages || 0), 0)
          const totalTokens = usageData.reduce((acc, item) => acc + (item.tokens || 0), 0)
          setUsage({ messages: totalMessages, tokens: totalTokens })

          if (totalMessages >= MESSAGE_LIMIT || totalTokens >= TOKEN_LIMIT) {
            setLimitReached(true)
          }
        }
      } catch (err) {
        console.error("Error loading chatbot data:", err)
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [chatbotId, router, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || limitReached) return

    setSending(true)
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInput("")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId,
          message: input,
          history: messages,
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const { reply, tokens } = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      const updatedUsage = { messages: usage.messages + 1, tokens: usage.tokens + (tokens || 0) }
      setUsage(updatedUsage)

      if (updatedUsage.messages >= MESSAGE_LIMIT || updatedUsage.tokens >= TOKEN_LIMIT) {
        setLimitReached(true)
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }

  const handleDeleteChatbot = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase.from("chatbots").delete().eq("id", chatbotId)

      if (error) throw error

      router.push("/app/chatbots")
    } catch (err) {
      console.error("Delete error:", err)
      setDeleting(false)
    }
  }
  
  const selectedTheme = THEMES.find((t) => t.value === chatbot?.theme) || THEMES[0];

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
    <div className={`min-h-screen flex flex-col ${selectedTheme.color}`}>
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/app/chatbots">
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-white/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground">{chatbot.name}</h1>
              <p className="text-xs text-muted-foreground">{chatbot.model}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/app/chatbots/${chatbot.id}/settings`}>
              <Button
                variant="outline"
                size="sm"
                className="border-border/50 bg-transparent text-foreground hover:bg-white/10"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Chatbot</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{chatbot.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex gap-3 justify-end">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteChatbot}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Delete
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <h2 className="text-2xl font-bold text-foreground mb-2">Start Chatting</h2>
              <p className="text-muted-foreground text-center">
                Chat with {chatbot.name}. Messages are processed in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-lg ${
                      message.role === "user"
                        ? `${selectedTheme.color} ${selectedTheme.textColor} rounded-br-none border border-white/20`
                        : "bg-card/50 border border-border/50 text-foreground rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-4 justify-start">
                  <div className="bg-card/50 border border-border/50 text-foreground rounded-lg rounded-bl-none px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-background sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          {limitReached ? (
            <div className="text-center text-red-500">
              <p>You have reached your daily limit. Please upgrade for more usage.</p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                placeholder="Ask your chatbot..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
                className="bg-card/50 border-border/50 text-foreground placeholder-muted-foreground"
              />
              <Button
                type="submit"
                disabled={sending || !input.trim()}
                className={`px-6 border border-white/20 ${selectedTheme.color} ${selectedTheme.textColor}`}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
