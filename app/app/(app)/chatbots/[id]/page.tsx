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

/* ================= TYPES ================= */

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

/* ================= CONSTANTS ================= */

const MESSAGE_LIMIT = 100
const TOKEN_LIMIT = 250000

const THEMES = [
  { value: 'twilight', color: 'bg-gradient-to-r from-slate-900 to-slate-700', textColor: 'text-white' },
  { value: 'sunrise', color: 'bg-gradient-to-r from-amber-300 to-orange-500', textColor: 'text-white' },
  { value: 'ocean', color: 'bg-gradient-to-r from-cyan-500 to-blue-500', textColor: 'text-white' },
  { value: 'forest', color: 'bg-gradient-to-r from-emerald-500 to-lime-600', textColor: 'text-white' },
  { value: 'grape', color: 'bg-gradient-to-r from-violet-500 to-purple-500', textColor: 'text-white' },
  { value: 'rose', color: 'bg-gradient-to-r from-pink-500 to-rose-500', textColor: 'text-white' },
  { value: 'sky', color: 'bg-gradient-to-r from-sky-400 to-cyan-300', textColor: 'text-black' },
  { value: 'candy', color: 'bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400', textColor: 'text-black' },
]

/* ================= PAGE ================= */

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

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return router.push("/login")

        const { data } = await supabase
          .from("chatbots")
          .select("id, name, model, theme")
          .eq("id", chatbotId)
          .eq("user_id", user.id)
          .single()

        if (!data) return router.push("/app/dashboard")
        setChatbot(data)
      } catch {
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

  /* ================= SEND MESSAGE ================= */

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

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotId, message: input, history: messages }),
      })

      const { reply } = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const selectedTheme =
    THEMES.find((t) => t.value === chatbot?.theme) || THEMES[0]

  /* ================= STATES ================= */

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
      </div>
    )
  }

  if (!chatbot) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="p-6 text-black dark:text-white">Chatbot not found</Card>
      </div>
    )
  }

  /* ================= UI ================= */

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-black overflow-hidden">

      {/* HEADER – STICKY */}
      <div className="sticky top-0 z-50 bg-gray-100 dark:bg-black border-b border-gray-300 dark:border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/app/chatbots">
            <Button variant="ghost" size="icon" className="text-black dark:text-white">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="font-bold text-black dark:text-white">
            {chatbot.name}
          </h1>
        </div>

        <div className="flex gap-2">
          <Link href={`/app/chatbots/${chatbot.id}/settings?tab=config`}>
            <Button variant="outline" size="icon" className="text-black dark:text-white">
              <Settings />
            </Button>
          </Link>
          <Link href={`/app/chatbots/${chatbot.id}/settings?tab=deploy`}>
            <Button variant="outline" size="icon" className="text-black dark:text-white">
              <Rocket />
            </Button>
          </Link>
        </div>
      </div>

      {/* CHAT SCROLL AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-28 max-w-2xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold text-black dark:text-white mb-2">
              Start Chatting
            </h2>
            <p className="text-black/70 dark:text-white/70 text-center">
              Chat with {chatbot.name}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-3 rounded-lg max-w-xs shadow ${
                    m.role === "user"
                      ? `${selectedTheme.color} ${selectedTheme.textColor}`
                      : "bg-white dark:bg-black text-black dark:text-white border border-gray-300 dark:border-gray-700"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* INPUT – FIXED BOTTOM */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-gray-100 dark:bg-black border-t border-gray-300 dark:border-gray-700">
        <form
          onSubmit={handleSendMessage}
          className="max-w-2xl mx-auto p-3 flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your chatbot..."
            disabled={sending}
            className="flex-1 bg-white dark:bg-gray-900 text-black dark:text-white"
          />
          <Button type="submit" disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </div>
    </div>
  )
}
