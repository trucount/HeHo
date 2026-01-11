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
import { HeHoLogo } from './heho-logo'

/* ---------------- types ---------------- */

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

/* ---------------- constants ---------------- */

const MESSAGE_LIMIT = 100
const TOKEN_LIMIT = 250000

const THEMES = [
  { value: 'twilight', color: 'bg-gradient-to-r from-slate-900 to-slate-700', textColor: 'text-white' },
  { value: 'sunrise', color: 'bg-gradient-to-r from-amber-400 to-orange-500', textColor: 'text-white' },
  { value: 'ocean', color: 'bg-gradient-to-r from-cyan-500 to-blue-500', textColor: 'text-white' },
  { value: 'forest', color: 'bg-gradient-to-r from-emerald-500 to-lime-600', textColor: 'text-white' },
  { value: 'grape', color: 'bg-gradient-to-r from-violet-500 to-purple-500', textColor: 'text-white' },
  { value: 'rose', color: 'bg-gradient-to-r from-pink-500 to-rose-500', textColor: 'text-white' },
  { value: 'sky', color: 'bg-gradient-to-r from-sky-400 to-cyan-300', textColor: 'text-black' },
  { value: 'candy', color: 'bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400', textColor: 'text-black' },
]

/* ---------------- helpers ---------------- */

const cleanText = (t: string) =>
  t.replace(/[*#_`>-]/g, '').trim()

/* ---------------- component ---------------- */

export default function SharedChatbotPage() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const supabase = createClient()
  const shareToken = params.id as string

  /* ---------------- data load ---------------- */

  useEffect(() => {
    const load = async () => {
      try {
        const { data: share } = await supabase
          .from('chatbot_shares')
          .select('chatbot_id, expires_at')
          .eq('share_token', shareToken)
          .single()

        if (!share) throw new Error('Invalid share link')

        if (share.expires_at && new Date(share.expires_at) < new Date()) {
          throw new Error('Link expired')
        }

        const { data: bot } = await supabase
          .from('chatbots')
          .select('id, name, model, theme, user_id')
          .eq('id', share.chatbot_id)
          .single()

        if (!bot) throw new Error('Chatbot not found')

        setChatbot(bot)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [shareToken, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* ---------------- send ---------------- */

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending || limitReached) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId: chatbot!.id,
          shareToken,
          message: userMsg.content,
          history: messages,
          isPublic: true,
        }),
      })

      const { reply } = await res.json()

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: cleanText(reply),
        },
      ])
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: e.message },
      ])
    } finally {
      setSending(false)
    }
  }

  const themeStyle =
    THEMES.find(t => t.value === chatbot?.theme) || THEMES[0]

  /* ---------------- UI ---------------- */

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
          <p className="text-red-500">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'bg-neutral-900 text-white' : 'bg-neutral-50 text-black'}`}>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b px-4 py-3 flex items-center justify-between backdrop-blur bg-background/80">
        <div className="flex items-center gap-2">
          <HeHoLogo className="h-6 w-6" />
          <span className="font-semibold">{chatbot?.name}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>
      </header>

      {/* CHAT */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map(m => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                  m.role === 'user'
                    ? `${themeStyle.color} ${themeStyle.textColor}`
                    : isDark
                      ? 'bg-neutral-800 text-white'
                      : 'bg-white border'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* INPUT */}
      <footer className="sticky bottom-0 border-t bg-background">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Message ${chatbot?.name}…`}
              className="flex-1 rounded-full px-4 py-3"
            />
            <Button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-full px-4"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send />}
            </Button>
          </form>

          <p className="text-xs text-center text-neutral-400 mt-2">
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
      </footer>
    </div>
  )
}
