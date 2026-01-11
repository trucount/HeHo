'use client'

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useRouter, useParams } from "next/navigation"
import { Send, Loader2, ArrowLeft, Settings, Rocket } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Chatbot {
  id: string
  name: string
  model: string
  theme: string
}

interface Usage {
  messages: number
  tokens: number
}

const MESSAGE_LIMIT = 100
const TOKEN_LIMIT = 250000

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const chatbotId = params.id as string

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        const { data: chatbotData, error: chatbotError } = await supabase
          .from("chatbots")
          .select("id, name, model, theme")
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

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get response from the server.")
      }

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
    } catch (error: any) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: `Sorry, an error occurred: ${error.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }

  const selectedTheme = THEMES.find((t) => t.value === chatbot?.theme) || THEMES[0]

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background dark:bg-background-dark">
        <Loader2 className="h-8 w-8 animate-spin text-foreground dark:text-foreground-dark" />
      </div>
    )
  }

  if (!chatbot) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background dark:bg-background-dark">
        <Card className="p-6">
          <p className="text-foreground dark:text-foreground-dark">Chatbot not found</p>
        </Card>
      </div>
    )
  }

  return (
    <div className={`h-screen w-screen flex flex-col bg-gray-100 dark:bg-black`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-black flex justify-between items-center flex-wrap">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/app/chatbots">
            <Button variant="ghost" size="icon" className={`${selectedTheme.textColor} hover:bg-white/10 dark:hover:bg-white/10`}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className={`font-bold text-base sm:text-lg ${selectedTheme.textColor}`}>{chatbot.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/app/chatbots/${chatbot.id}/settings?tab=config`}>
            <Button variant="outline" size="icon" className={`${selectedTheme.textColor} border-white/20 hover:bg-white/10`}>
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <Link href={`/app/chatbots/${chatbot.id}/settings?tab=deploy`}>
            <Button variant="outline" size="icon" className={`${selectedTheme.textColor} border-white/20 hover:bg-white/10`}>
              <Rocket className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto flex flex-col px-2 sm:px-4 py-4 sm:py-8">
        <div className="mx-auto w-full max-w-2xl flex-1 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <h2 className={`text-xl sm:text-2xl font-bold ${selectedTheme.textColor} mb-2`}>Start Chatting</h2>
              <p className={`${selectedTheme.textColor}/80 text-center`}>
                Chat with {chatbot.name}. Messages are processed in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-3 rounded-lg shadow-md ${
                      message.role === "user"
                        ? `${selectedTheme.color} ${selectedTheme.textColor} rounded-br-none border border-white/30`
                        : "bg-white dark:bg-black text-black dark:text-white rounded-bl-none border border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-4 justify-start">
                  <div className="bg-white/20 dark:bg-gray-700 border border-white/30 dark:border-gray-700 text-white dark:text-white rounded-lg rounded-bl-none px-4 py-3">
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
      <div className="border-t border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-black fixed bottom-0 left-0 w-full py-2 sm:py-3">
        <div className="container mx-auto px-2 sm:px-4 max-w-2xl flex">
          {limitReached ? (
            <div className="text-center text-red-400 py-2 w-full">
              <p>You have reached your daily limit. Please upgrade for more usage.</p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3 w-full">
              <Input
                placeholder="Ask your chatbot..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
                className="flex-1 bg-white/90 dark:bg-gray-900 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-700 rounded-full focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
              />
              <Button
                type="submit"
                disabled={sending || !input.trim() || limitReached}
                className="p-3 rounded-full bg-gray-800 text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
