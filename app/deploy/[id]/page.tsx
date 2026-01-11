'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useParams } from 'next/navigation'
import { Send, User, Loader2 } from 'lucide-react'
import { HeHoLogo } from '@/components/heho-logo'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  typing?: boolean
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

function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setDisplayed(prev => prev + text.charAt(i))
      i++
      if (i >= text.length) clearInterval(interval)
    }, 12)
    return () => clearInterval(interval)
  }, [text])
  return <>{displayed}</>
}

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

  const selectedTheme = THEMES.find(t => t.value === chatbot?.theme) || THEMES[0]

  useEffect(() => {
    const fetchChatbot = async () => {
      try {
        const { data: share } = await supabase
          .from('chatbot_shares')
          .select('chatbot_id, expires_at')
          .eq('share_token', shareToken)
          .single()
        if (!share) throw new Error('Invalid share link')

        if (share.expires_at && new Date(share.expires_at) < new Date())
          throw new Error('Share expired')

        const { data: bot } = await supabase
          .from('chatbots')
          .select('id, name, model, theme, user_id')
          .eq('id', share.chatbot_id)
          .single()

        if (!bot) throw new Error('Chatbot not found')
        setChatbot(bot)
      } catch (err: any) {
        setError(err.message || 'Error loading chatbot')
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
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
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
      const aiMessage: Message = { id: Date.now().toString(), role: 'assistant', content: reply, typing: true }
      setMessages(prev => [...prev, aiMessage])
      setTimeout(() => {
        setMessages(prev =>
          prev.map(m => (m.id === aiMessage.id ? { ...m, typing: false } : m))
        )
      }, reply.length * 12 + 50)
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: 'Something went wrong.' },
      ])
    } finally {
      setSending(false)
    }
  }

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-gray-700" />
      </div>
    )
  if (error)
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-red-600 font-semibold">Error</h2>
          <p>{error}</p>
        </Card>
      </div>
    )

  return (
    <div className={`h-screen flex flex-col ${selectedTheme.color}`}>
      {/* HEADER */}
      <header className="bg-black/30 border-b border-white/20 px-4 py-3">
        <h1 className={`${selectedTheme.textColor} font-semibold`}>{chatbot.name}</h1>
      </header>

      {/* CHAT */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="flex items-start gap-3 max-w-[85%]">
                <HeHoLogo />
                <div className="bg-white/20 border border-white/30 rounded-2xl px-4 py-3 text-white text-sm">
                  {m.typing ? <TypingText text={m.content} /> : m.content}
                </div>
              </div>
            )}
            {m.role === 'user' && (
              <div className="flex items-start gap-3 max-w-[85%]">
                <div className="rounded-full p-2 bg-black/30 text-white">
                  <User size={14} />
                </div>
                <div className={`px-4 py-3 rounded-2xl ${selectedTheme.color} ${selectedTheme.textColor}`}>
                  {m.content}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* INPUT */}
      <footer className="bg-black/30 border-t border-white/20 p-3">
        <form onSubmit={handleSendMessage} className="flex gap-2 max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message ${chatbot.name}...`}
            className="flex-1 rounded-full bg-white/10 text-white border-white/30"
          />
          <Button type="submit" className="rounded-full">
            <Send size={16} />
          </Button>
        </form>
      </footer>
    </div>
  )
}
