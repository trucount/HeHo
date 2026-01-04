"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useParams } from "next/navigation"
import { Send, Loader2, Home } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function PublicChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chatbot, setChatbot] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const supabase = createClient()
  const chatbotId = params.chatbotId as string

  useEffect(() => {
    const loadChatbot = async () => {
      try {
        const { data } = await supabase.from("chatbots").select("*").eq("id", chatbotId).single()

        if (!data) {
          setError("Chatbot not found")
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
    setMessages([...messages, { id: Date.now().toString(), role: "user", content: input }])
    setInput("")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId: chatbot.id,
          message: input,
          history: messages,
          isPublic: true,
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const { reply } = await response.json()
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: reply }])
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-foreground text-xl mb-4">{error}</p>
          <Link href="/">
            <Button className="bg-white hover:bg-gray-200 text-black">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{chatbot?.name || "Chat"}</h1>
            <p className="text-xs text-muted-foreground truncate">{chatbot?.goal}</p>
          </div>
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="border-border/50 text-foreground hover:bg-white/10 bg-transparent ml-4"
            >
              <Home className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Home</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Chat with {chatbot?.name}</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Ask me anything about {chatbot?.name}. I have access to relevant data and can help you with your
                questions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-2xl px-4 py-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-black text-white rounded-br-none border border-white/20"
                        : "bg-card/50 border border-border/50 text-foreground rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-3 justify-start">
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
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input
              placeholder="Ask your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              className="bg-card/50 border-border/50 text-foreground placeholder-muted-foreground"
            />
            <Button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-white hover:bg-gray-200 text-black px-5"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
