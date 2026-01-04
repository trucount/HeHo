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

  /* ---------------- Load chatbot ---------------- */
  useEffect(() => {
    const loadChatbot = async () => {
      try {
        const { data } = await supabase
          .from("chatbots")
          .select("*")
          .eq("id", chatbotId)
          .single()

        if (!data) {
          setError("Chatbot not found")
          return
        }

        setChatbot(data)
      } catch {
        setError("Failed to load chatbot")
      } finally {
        setLoading(false)
      }
    }

    loadChatbot()
  }, [chatbotId])

  /* ---------------- Auto scroll ---------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  /* ---------------- Send message ---------------- */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !chatbot) return

    const userMessage = input
    setInput("")
    setSending(true)

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: userMessage },
    ])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId: chatbot.id,
          message: userMessage,
          history: messages,
          isPublic: true,
        }),
      })

      if (!response.ok) throw new Error()

      const { reply } = await response.json()

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: reply },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ])
    } finally {
      setSending(false)
    }
  }

  /* ---------------- Loading / Error ---------------- */
  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[100dvh] flex items-center justify-center text-center">
        <div>
          <p className="mb-4 text-lg">{error}</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  /* ---------------- Main Layout ---------------- */
  return (
    <div
      className="
        h-[100dvh]
        flex flex-col
        bg-background
        overscroll-none
        pt-[env(safe-area-inset-top)]
        pb-[env(safe-area-inset-bottom)]
      "
    >
      {/* ================= Header ================= */}
      <header className="shrink-0 border-b bg-card/40 backdrop-blur z-50">
        <div className="max-w-2xl mx-auto px-3 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">
              {chatbot?.name || "Chat"}
            </h1>
            <p className="text-[11px] text-muted-foreground truncate">
              {chatbot?.goal}
            </p>
          </div>

          <Link href="/">
            <Button variant="ghost" size="icon">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* ================= Messages ================= */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-2xl mx-auto px-3 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <h2 className="text-lg font-semibold mb-1">
                Chat with {chatbot?.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Ask anything to get started
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`
                  max-w-[88%]
                  px-3 py-2
                  text-sm
                  rounded-xl
                  break-words
                  ${
                    message.role === "user"
                      ? "bg-black text-white rounded-br-md"
                      : "bg-card border rounded-bl-md"
                  }
                `}
              >
                {message.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-xl bg-card">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ================= Input ================= */}
      <footer className="shrink-0 border-t bg-background">
        <form
          onSubmit={handleSendMessage}
          className="max-w-2xl mx-auto px-3 py-2 flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message…"
            disabled={sending}
            className="flex-1 rounded-full px-4"
          />

          <Button
            type="submit"
            size="icon"
            disabled={sending || !input.trim()}
            className="rounded-full"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </footer>
    </div>
  )
}
