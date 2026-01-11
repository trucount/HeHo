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
  { value: 'twilight', label: 'Twilight', color: 'bg-gradient-to-r from-slate-900 to-slate-700', textColor: 'text-white' },
  { value: 'sunrise', label: 'Sunrise', color: 'bg-gradient-to-r from-amber-300 to-orange-500', textColor: 'text-white' },
  { value: 'ocean', label: 'Ocean', color: 'bg-gradient-to-r from-cyan-500 to-blue-500', textColor: 'text-white' },
  { value: 'forest', label: 'Forest', color: 'bg-gradient-to-r from-emerald-500 to-lime-600', textColor: 'text-white' },
  { value: 'grape', label: 'Grape', color: 'bg-gradient-to-r from-violet-500 to-purple-500', textColor: 'text-white' },
  { value: 'rose', label: 'Rose', color: 'bg-gradient-to-r from-pink-500 to-rose-500', textColor: 'text-white' },
  { value: 'sky', label: 'Sky', color: 'bg-gradient-to-r from-sky-400 to-cyan-300', textColor: 'text-black' },
  { value: 'candy', label: 'Candy', color: 'bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400', textColor: 'text-black' },
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
    const fetchChatbotInfo = async () => {
      if (!shareToken) {
        setError('Share token not found.')
        setLoading(false)
        return
      }

      try {
        const { data: shareData, error: shareError } = await supabase
          .from('chatbot_shares')
          .select('chatbot_id, expires_at')
          .eq('share_token', shareToken)
          .single()

        if (shareError || !shareData) {
          setError('Invalid or expired share link.')
          setLoading(false)
          return
        }
        
        if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
            setError('This share link has expired.')
            setLoading(false)
            return
        }

        const { data: chatbotData, error: chatbotError } = await supabase
          .from('chatbots')
          .select('id, name, model, theme, user_id')
          .eq('id', shareData.chatbot_id)
          .single()

        if (chatbotError || !chatbotData) {
          setError('Chatbot not found.')
          setLoading(false)
          return
        }

        setChatbot(chatbotData)

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayString = today.toISOString()

        const { data: usageData, error: usageError } = await supabase
          .from("usage")
          .select("messages, tokens")
          .eq("user_id", chatbotData.user_id)
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
        console.error('Error loading shared chatbot:', err)
        setError('An unexpected error occurred.')
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

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId: chatbot!.id,
          shareToken,
          message: input,
          history: newMessages.slice(0, -1),
          isPublic: true,
        }),
      })

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get response from the server.')
      }

      const { reply, tokens } = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
      }

      setMessages(prev => [...prev, assistantMessage])

      const updatedUsage = { messages: usage.messages + 1, tokens: usage.tokens + (tokens || 0) }
      setUsage(updatedUsage)

      if (updatedUsage.messages >= MESSAGE_LIMIT || updatedUsage.tokens >= TOKEN_LIMIT) {
        setLimitReached(true)
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Sorry, an error occurred: ${error.message}`,
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }

  const selectedTheme = THEMES.find((t) => t.value === chatbot?.theme) || THEMES[0];

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-black">
      <Loader2 className="h-8 w-8 animate-spin text-gray-700 dark:text-gray-300" />
    </div>
  )

  if (error) return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-black">
      <Card className="p-6 m-4 text-center">
        <h2 className="text-xl font-semibold text-red-600">Error</h2>
        <p className="text-gray-700 dark:text-gray-300 mt-2">{error}</p>
      </Card>
    </div>
  )

  if (!chatbot) return null

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100 dark:bg-black">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-black">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="font-bold text-lg text-gray-900 dark:text-white">{chatbot.name}</h1>
        </div>
      </header>

      {/* CHAT AREA */}
      <main className="flex-1 overflow-y-auto px-4 py-4 sm:py-6 max-w-2xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 text-gray-700 dark:text-gray-300">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Start Chatting</h2>
            <p className="opacity-80">This is a shared chatbot. Your conversation is temporary.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`px-4 py-3 rounded-lg max-w-[75%] whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? `${selectedTheme.color} ${selectedTheme.textColor} rounded-br-none border border-white/30` // user messages themed
                      : 'bg-white dark:bg-black text-black dark:text-white rounded-bl-none border border-gray-300 dark:border-gray-700' // assistant always white/black manually
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-300 dark:bg-gray-700 text-black dark:text-white px-4 py-3 rounded-lg rounded-bl-none">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* INPUT */}
      <footer className="sticky bottom-0 border-t border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-black">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
          <Input
            placeholder={`Message ${chatbot.name}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending || limitReached}
            className="flex-1 rounded-full bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
          />
          <Button
            type="submit"
            onClick={handleSendMessage}
            disabled={sending || !input.trim() || limitReached}
            className="p-3 rounded-full bg-gray-800 text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
          Powered by <a href="https://heho.vercel.app" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-200">HeHo</a>.
        </p>
      </footer>
    </div>
  )
}
