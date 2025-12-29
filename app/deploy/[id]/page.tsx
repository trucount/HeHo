"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useParams, useRouter } from "next/navigation"
import { Send, Loader2, MessageSquare, AlertCircle } from "lucide-react"

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

const THEMES: Record<string, { bg: string; text: string; card: string; button: string; input: string }> = {
  dark: {
    bg: "bg-black",
    text: "text-white",
    card: "bg-slate-900",
    button: "bg-white hover:bg-gray-200 text-black",
    input: "bg-slate-800 border-slate-700 text-white placeholder-slate-400",
  },
  light: {
    bg: "bg-gray-50",
    text: "text-slate-900",
    card: "bg-white",
    button: "bg-slate-900 hover:bg-slate-800 text-white",
    input: "bg-white border-slate-300 text-slate-900 placeholder-slate-500",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-900",
    card: "bg-white border-blue-200",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    input: "bg-white border-blue-300 text-blue-900 placeholder-blue-400",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-900",
    card: "bg-white border-green-200",
    button: "bg-green-600 hover:bg-green-700 text-white",
    input: "bg-white border-green-300 text-green-900 placeholder-green-400",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-900",
    card: "bg-white border-purple-200",
    button: "bg-purple-600 hover:bg-purple-700 text-white",
    input: "bg-white border-purple-300 text-purple-900 placeholder-purple-400",
  },
}

export default function PublicChatbotPage() {
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const chatbotId = params.id as string

  useEffect(() => {
    const loadChatbot = async () => {
      try {
        const { data } = await supabase.from("chatbots").select("*").eq("id", chatbotId).eq("deployed", true).single()

        if (!data) {
          setError("Chatbot not found or not deployed")
          setLoading(false)
          return
        }

        setChatbot(data)
      } catch (err) {
        console.error(err)
        setError("Failed to load chatbot")
      } finally {
        setLoading(false)
      }
    }

    loadChatbot()
  }, [chatbotId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !chatbot) return

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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId,
          message: input,
          isPublic: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error(err)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (!chatbot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-black p-4">
        <Card className="border-border/50 bg-card/50 p-8 max-w-md">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">Chatbot Not Found</h1>
          <p className="text-muted-foreground text-center">{error}</p>
        </Card>
      </div>
    )
  }

  const theme = THEMES[chatbot.theme] || THEMES.dark

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col`}>
      {/* Header */}
      <div
        className={`border-b ${theme.card} ${theme.card === "bg-slate-900" ? "border-slate-700" : "border-slate-200"}`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">{chatbot.name}</h1>
              <p className={`text-sm ${theme.text === "text-white" ? "text-slate-400" : "text-slate-600"}`}>
                {chatbot.goal}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <MessageSquare
                className={`h-16 w-16 mb-4 ${theme.text === "text-white" ? "text-slate-600" : "text-slate-300"}`}
              />
              <h2 className="text-2xl font-bold mb-2">Start Chatting</h2>
              <p className={theme.text === "text-white" ? "text-slate-400" : "text-slate-600"}>
                Ask me anything about {chatbot.name}
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
                        ? theme.button
                        : `${theme.card} border ${theme.card === "bg-slate-900" ? "border-slate-700" : "border-slate-200"}`
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-4 justify-start">
                  <div
                    className={`${theme.card} rounded-lg px-4 py-3 border ${theme.card === "bg-slate-900" ? "border-slate-700" : "border-slate-200"}`}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className={`border-t ${theme.card === "bg-slate-900" ? "border-slate-700" : "border-slate-200"}`}>
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              className={`${theme.input} border rounded-lg px-4 py-2`}
            />
            <Button type="submit" disabled={sending || !input.trim()} className={`${theme.button} px-6 rounded-lg`}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
