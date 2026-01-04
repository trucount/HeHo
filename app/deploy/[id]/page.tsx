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

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <Card className="p-6 m-4 text-center">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="text-gray-700 mt-2">{error}</p>
        </Card>
      </div>
    )
  }

  if (!chatbot) {
    return null // Should not happen if loading and error states are handled
  }

  return (
    <div className={`h-screen w-full flex flex-col ${selectedTheme.color}`}>
      <div className="p-4 border-b border-white/20 bg-black/30 flex justify-between items-center">
        <h1 className={`font-bold text-base sm:text-lg ${selectedTheme.textColor}`}>{chatbot.name}</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-2xl">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <h2 className={`text-xl sm:text-2xl font-bold ${selectedTheme.textColor} mb-2`}>Start Chatting</h2>
              <p className={`${selectedTheme.textColor}/80`}>
                This is a shared chatbot. Your conversation is temporary.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg shadow-md ${ 
                      message.role === 'user'
                        ? `${selectedTheme.color} ${selectedTheme.textColor} rounded-br-none border border-white/30`
                        : 'bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-bl-none'
                    }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-4 justify-start">
                  <div className="bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg rounded-bl-none px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/20 bg-black/20">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-2xl">
        {limitReached ? (
            <div className="text-center text-red-400 py-4">
              <p>This chatbot has reached its daily usage limit. Please try again later.</p>
            </div>
          ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
            <Input
              placeholder={`Message ${chatbot.name}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              className={`flex-1 bg-white/10 ${selectedTheme.textColor} placeholder-white/60 border-white/30 rounded-full focus:ring-2 focus:ring-white/50`}
            />
            <Button
              type="submit"
              disabled={sending || !input.trim()}
              className={`p-3 rounded-full ${selectedTheme.color} ${selectedTheme.textColor} hover:opacity-90 disabled:opacity-50 transition-opacity`}
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
          )}
          <p className="text-xs text-center text-white/50 pt-2">
  Powered by <a href="https://heho.vercel.app" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">HeHo</a>.
</p>
        </div>
      </div>
    </div>
  )
}
