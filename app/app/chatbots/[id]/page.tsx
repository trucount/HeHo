'use client'

import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useRouter, useParams } from 'next/navigation'
import { Send, Loader2, ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Chatbot {
  id: string
  name: string
  goal: string
  description: string
  model: string
}

interface Usage {
  messages: number
  tokens: number
}

const MESSAGE_LIMIT = 100
const TOKEN_LIMIT = 10000

export default function ChatbotPage() {
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [usage, setUsage] = useState<Usage>({ messages: 0, tokens: 0 })
  const [limitReached, setLimitReached] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const chatbotId = params.id as string

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: chatbotData } = await supabase
          .from('chatbots')
          .select('*')
          .eq('id', chatbotId)
          .eq('user_id', user.id)
          .single()

        if (!chatbotData) {
          router.push('/app/dashboard')
          return
        }

        setChatbot(chatbotData)

        const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
        const { data: usageData, error: usageError } = await supabase
          .from('usage')
          .select('messages, tokens')
          .eq('user_id', user.id)
          .eq('date', today)

        if (usageError) throw usageError

        if (usageData && usageData.length > 0) {
          const totalMessages = usageData.reduce((acc, item) => acc + item.messages, 0)
          const totalTokens = usageData.reduce((acc, item) => acc + item.tokens, 0)
          setUsage({ messages: totalMessages, tokens: totalTokens })

          if (totalMessages >= MESSAGE_LIMIT || totalTokens >= TOKEN_LIMIT) {
            setLimitReached(true)
          }
        }
      } catch (err) {
        console.error(err)
        router.push('/app/dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [chatbotId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || limitReached) return

    setSending(true)
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInput('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId,
          message: input,
          history: messages,
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const { reply, tokens } = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Update usage locally
      const updatedUsage = { messages: usage.messages + 1, tokens: usage.tokens + tokens }
      setUsage(updatedUsage)

      if (updatedUsage.messages >= MESSAGE_LIMIT || updatedUsage.tokens >= TOKEN_LIMIT) {
        setLimitReached(true)
      }
    } catch (error) {
      console.error(error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-white' />
      </div>
    )
  }

  if (!chatbot) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <Card className='p-6'>
          <p className='text-foreground'>Chatbot not found</p>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      {/* Header */}
      <div className='border-b border-border/50 bg-card/30 sticky top-0 z-40'>
        <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
          <div className='flex items-center gap-4'>
            <Link href='/app/dashboard'>
              <Button variant='ghost' size='sm' className='text-foreground hover:bg-white/10'>
                <ArrowLeft className='h-4 w-4' />
              </Button>
            </Link>
            <div>
              <h1 className='text-lg font-bold text-foreground'>{chatbot.name}</h1>
              <p className='text-xs text-muted-foreground'>{chatbot.model}</p>
            </div>
          </div>
          <Link href={`/app/chatbots/${chatbot.id}/settings`}>
            <Button
              variant='outline'
              size='sm'
              className='border-border/50 bg-transparent text-foreground hover:bg-white/10'
            >
              <Settings className='h-4 w-4' />
            </Button>
          </Link>
        </div>
      </div>

      {/* Chat Area */}
      <div className='flex-1 overflow-y-auto'>
        <div className='container mx-auto px-4 py-8 max-w-2xl'>
          {messages.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full py-12'>
              <h2 className='text-2xl font-bold text-foreground mb-2'>Start Chatting</h2>
              <p className='text-muted-foreground text-center mb-8'>
                Ask me anything about your project. I have access to your database and project context.
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-black text-white rounded-br-none border border-white/20'
                        : 'bg-card/50 border border-border/50 text-foreground rounded-bl-none'
                    }`}
                  >
                    <p className='text-sm'>{message.content}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className='flex gap-4 justify-start'>
                  <div className='bg-card/50 border border-border/50 text-foreground rounded-lg rounded-bl-none px-4 py-3'>
                    <Loader2 className='h-4 w-4 animate-spin text-white' />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className='border-t border-border/50 bg-background sticky bottom-0'>
        <div className='container mx-auto px-4 py-4 max-w-2xl'>
          {limitReached ? (
            <div className='text-center text-red-500'>
              <p>You have reached your daily limit. Please upgrade for more usage.</p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className='flex gap-3'>
              <Input
                placeholder='Ask your chatbot...'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
                className='bg-card/50 border-border/50 text-foreground placeholder-muted-foreground'
              />
              <Button
                type='submit'
                disabled={sending || !input.trim()}
                className='bg-black hover:bg-gray-900 text-white px-6 border border-white/20'
              >
                {sending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
