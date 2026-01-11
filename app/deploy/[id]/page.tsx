'use client'

import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useParams } from 'next/navigation'
import { Send, Loader2, Sun, Moon } from 'lucide-react'

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
  { value: 'twilight', label: 'Twilight', color: 'bg-gradient-to-r from-slate-900 to-slate-700', textColor: 'text-white' },
  { value: 'sunrise', label: 'Sunrise', color: 'bg-gradient-to-r from-amber-300 to-orange-500', textColor: 'text-white' },
  { value: 'ocean', label: 'Ocean', color: 'bg-gradient-to-r from-cyan-500 to-blue-500', textColor: 'text-white' },
  { value: 'forest', label: 'Forest', color: 'bg-gradient-to-r from-emerald-500 to-lime-600', textColor: 'text-white' },
  { value: 'grape', label: 'Grape', color: 'bg-gradient-to-r from-violet-500 to-purple-500', textColor: 'text-white' },
  { value: 'rose', label: 'Rose', color: 'bg-gradient-to-r from-pink-500 to-rose-500', textColor: 'text-white' },
  { value: 'sky', label: 'Sky', color: 'bg-gradient-to-r from-sky-400 to-cyan-300', textColor: 'text-black' },
  { value: 'candy', label: 'Candy', color: 'bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400', textColor: 'text-black' },
]

/* ---------- helpers ---------- */

// remove markdown symbols
const cleanAIText = (text: string) =>
  text.replace(/[*#_`>-]/g, '').trim()

function TypingText({ text }: { text: string }) {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    let i = 0
    setDisplay('')
    const interval = setInterval(() => {
      i++
      setDisplay(text.slice(0, i))
      if (i >= text.length) clearInterval(interval)
    }, 16)

    return () => clearInterval(interval)
  }, [text])

  return <span>{display}</span>
}

export default function SharedChatbotPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

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

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const fetchChatbotInfo = async () => {
      if (!shareToken) {
        setError('Share token not found.')
        setLoading(false)
        return
      }

      try {
        const { data: shareData } = await supabase
          .from('chatbot_shares')
          .select('chatbot_id, expires_at')
          .eq('share_token', shareToken)
          .single()

        if (!shareData) throw new Error('Invalid share link')

        if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
          throw new Error('This share link has expired.')
        }

        const { data: chatbotData } = await supabase
          .from('chatbots')
          .select('id, name, model, theme, user_id')
          .eq('id', shareData.chatbot_id)
          .single()

        if (!chatbotData) throw new Error('Chatbot not found.')

        setChatbot(chatbotData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchChatbotInfo()
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

    setMessages(prev => [...prev, userMessage])
    setInput('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId: chatbot!.id,
          shareToken,
          message: input,
          history: messages,
          isPublic: true,
        }),
      })

      const { reply, tokens } = await response.json()

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: cleanAIText(reply),
        },
      ])

      const updatedUsage = {
        messages: usage.messages + 1,
        tokens: usage.tokens + (tokens || 0),
      }

      setUsage(updatedUsage)

      if (updatedUsage.messages >= MESSAGE_LIMIT || updatedUsage.tokens >= TOKEN_LIMIT) {
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

  const selectedTheme = THEMES.find(t => t.value === chatbot?.theme) || THEMES[0]
  const isDark = resolvedTheme === 'dark'

  if (!mounted || loading) {
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
    <div className={`h-screen w-full flex flex-col ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>

      {/* HEADER */}
      <div className="p-4 border-b flex justify-between items-center">
        <h1 className={`font-bold ${selectedTheme.textColor}`}>{chatbot?.name}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-2 sm:px-4 py-6 max-w-2xl space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? `${selectedTheme.color} ${selectedTheme.textColor}`
                    : `${isDark ? 'bg-neutral-800 text-white' : 'bg-white border'}`
                }`}
              >
                {msg.role === 'assistant'
                  ? <TypingText text={msg.content} />
                  : msg.content}
              </div>
            </div>
          ))}
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className="border-t">
        <div className="container mx-auto px-2 sm:px-4 py-4 max-w-2xl">
          {limitReached ? (
            <p className="text-center text-red-400">
              This chatbot has reached its daily usage limit.
            </p>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Message ${chatbot?.name}...`}
                className="rounded-full"
              />
              <Button type="submit" disabled={sending || !input.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send />}
              </Button>
            </form>
          )}

          <p className="text-xs text-center text-neutral-400 pt-2">
            Powered by{' '}
            <a
              href="https://heho.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              HeHo
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
