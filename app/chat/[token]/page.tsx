"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useParams } from "next/navigation"
import { Send, Loader2 } from "lucide-react"

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const supabase = createClient()

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
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const { reply } = await response.json()
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: reply }])
    } catch (error) {
      console.error(error)
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border/50 bg-card/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-foreground">{chatbot?.name || "Chat"}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <h2 className="text-2xl font-bold text-foreground mb-2">Chat with {chatbot?.name}</h2>
              <p className="text-muted-foreground text-center">Start a conversation below</p>
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
                        ? "bg-black text-white rounded-br-none border border-white/20"
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

      <div className="border-t border-border/50 bg-background sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              className="bg-card/50 border-border/50 text-foreground"
            />
            <Button disabled={sending || !input.trim()} className="bg-white hover:bg-gray-200 text-black px-6">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
