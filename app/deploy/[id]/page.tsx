'use client'

import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useParams } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Chatbot {
  id: string
  name: string
  model: string
  theme: string
  user_id: string
}

interface Usage {
  messages: number
  tokens: number
}

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

export default function SharedChatbotPage() {
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<Usage>({ messages: 0, tokens: 0 })
  const [limitReached, setLimitReached] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const supabase = createClient()
  const shareToken = params.id as string

  useEffect(() => {
    const fetchChatbot = async () => {
      try {
        const { data: share } = await supabase
          .from('chatbot_shares')
          .select('chatbot_id, expires_at')
          .eq('share_token', shareToken)
          .single()

        if (!share) throw new Error('Invalid share link')

        if (share.expires_at && new Date(share.expires_at) < new Date()) {
          throw new Error('This share link has expired')
        }

        const { data: bot } = await supabase
          .from('chatbots')
          .select('id, name, model, theme, user_id')
          .eq('id', share.chatbot_id)
          .single()

        if (!bot) throw new Error('Chatbot not found')

        setChatbot(bot)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchChatbot()
  }, [shareToken, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending || limitReached) return

    setSending(true)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId: chatbot!.id,
          shareToken,
          message: userMessage.content,
          history: messages,
          isPublic: true,
        }),
      })

      const { reply, tokens } = await res.json()

      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: reply },
      ])

      const newUsage = {
        messages: usage.messages + 1,
        tokens: usage.tokens + (tokens || 0),
      }

      setUsage(newUsage)

      if (newUsage.messages >= MESSAGE_LIMIT || newUsage.tokens >= TOKEN_LIMIT) {
        setLimitReached(true)
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: err.message },
      ])
    } finally {
      setSending(false)
    }
  }

  const theme = THEMES.find(t => t.value === chatbot?.theme) || THEMES[0]

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-red-600 font-semibold">Error</h2>
          <p className="mt-2">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 font-semibold">
          {chatbot?.name}
        </div>
      </header>

      {/* CHAT */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-neutral-500 mt-24">
              <h2 className="text-xl font-semibold">How can I help you?</h2>
              <p className="text-sm">This is a shared chatbot.</p>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? `${theme.color} ${theme.textColor} rounded-br-sm`
                    : 'bg-white border rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border px-4 py-3 rounded-2xl">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* INPUT */}
      <footer className="sticky bottom-0 border-t bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Message ${chatbot?.name}…`}
              className="rounded-full"
            />
            <Button type="submit" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>

          <p className="text-[11px] text-center text-neutral-400 mt-2">
            Powered by <a href="https://heho.vercel.app" className="underline">HeHo</a>
          </p>
        </div>
      </footer>
    </div>
  )
}

