'use client'

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter, useParams } from "next/navigation"
import { Send, Loader2, ArrowLeft, Settings, Rocket, Mic, MessageSquare, PhoneOff } from "lucide-react"
import Link from "next/link"

// Add this to your component file
interface IWindow extends Window {
  webkitSpeechRecognition: any;
}

/* ===================== TYPES ===================== */

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Chatbot {
  id: string
  name: string
  model: string
  theme: string
}

interface Usage {
  messages: number
  tokens: number
}

/* ===================== CONSTANTS ===================== */

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

/* ===================== TYPEWRITER EFFECT ===================== */

const typeWriterEffect = async (
  text: string,
  onUpdate: (partial: string) => void,
  speed = 14
) => {
  let current = ""
  for (let i = 0; i < text.length; i++) {
    current += text[i]
    onUpdate(current)
    await new Promise((r) => setTimeout(r, speed))
  }
}

/* ===================== COMPONENT ===================== */

export default function ChatbotPage() {
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [usage, setUsage] = useState<Usage>({ messages: 0, tokens: 0 })
  const [limitReached, setLimitReached] = useState(false)
  const [mode, setMode] = useState<'chat' | 'talk'>('chat')
  const [isListening, setIsListening] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [userTranscript, setUserTranscript] = useState("")
  const [talkLoopActive, setTalkLoopActive] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef("")
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const chatbotId = params.id as string

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
    }
  }, [isListening])

  const sendAndSpeak = useCallback(async (message: string) => {
    if (!message.trim() || limitReached) {
      if (talkLoopActive) startListening();
      return;
    }

    setSending(true)
    setUserTranscript("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId,
          message,
          history: [],
        }),
      })

      const { reply, tokens } = await res.json()
      
      setSending(false)
      setIsAISpeaking(true)
      speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(reply)
      
      utterance.onend = () => {
        setIsAISpeaking(false)
        if (talkLoopActive) {
          startListening()
        }
      }
      speechSynthesis.speak(utterance)

      const updatedUsage = {
        messages: usage.messages + 1,
        tokens: usage.tokens + (tokens || 0),
      }
      setUsage(updatedUsage)

      if (updatedUsage.messages >= MESSAGE_LIMIT || updatedUsage.tokens >= TOKEN_LIMIT) {
        setLimitReached(true)
        setTalkLoopActive(false)
      }
    } catch (error) {
      console.error("Error in sendAndSpeak:", error)
      setIsAISpeaking(true)
      const utterance = new SpeechSynthesisUtterance("Sorry, something went wrong.")
      utterance.onend = () => {
          setIsAISpeaking(false)
          if (talkLoopActive) startListening()
      }
      speechSynthesis.speak(utterance)
      setSending(false)
    }
  }, [chatbotId, limitReached, talkLoopActive, startListening, usage.messages, usage.tokens])

  /* ===================== SPEECH RECOGNITION ===================== */

  useEffect(() => {
    const SpeechRecognition = (window as IWindow).webkitSpeechRecognition || window.SpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        finalTranscriptRef.current = ""
      }

      recognition.onresult = (event: any) => {
        let interimTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }
        setUserTranscript(finalTranscriptRef.current + interimTranscript)
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        if (talkLoopActive) {
          const messageToSend = finalTranscriptRef.current.trim()
          sendAndSpeak(messageToSend)
        }
      }

      recognitionRef.current = recognition
    }
  }, [talkLoopActive, sendAndSpeak])

  const toggleTalkLoop = () => {
    const nextState = !talkLoopActive;
    setTalkLoopActive(nextState);
    if (nextState) {
       startListening();
    } else {
      recognitionRef.current?.stop()
      speechSynthesis.cancel()
      setIsListening(false)
      setIsAISpeaking(false)
      setSending(false)
    }
  }


  /* ===================== LOAD DATA ===================== */

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        const { data: chatbotData } = await supabase
          .from("chatbots")
          .select("id, name, model, theme")
          .eq("id", chatbotId)
          .eq("user_id", user.id)
          .single()

        if (!chatbotData) {
          router.push("/app/dashboard")
          return
        }

        setChatbot(chatbotData)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: usageData } = await supabase
          .from("usage")
          .select("messages, tokens")
          .eq("user_id", user.id)
          .gte("created_at", today.toISOString())

        if (usageData?.length) {
          const totalMessages = usageData.reduce((a, b) => a + (b.messages || 0), 0)
          const totalTokens = usageData.reduce((a, b) => a + (b.tokens || 0), 0)

          setUsage({ messages: totalMessages, tokens: totalTokens })

          if (totalMessages >= MESSAGE_LIMIT || totalTokens >= TOKEN_LIMIT) {
            setLimitReached(true)
          }
        }
      } catch {
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [chatbotId, router, supabase])

  /* ===================== AUTO SCROLL ===================== */

  useEffect(() => {
    if (mode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
    }
  }, [messages, mode])

  /* ===================== SEND MESSAGE (CHAT MODE) ===================== */

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || limitReached) return

    setSending(true)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId,
          message: userMessage.content,
          history: newMessages.slice(0, -1),
        }),
      })

      const { reply, tokens } = await res.json()

      const assistantId = (Date.now() + 1).toString()

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
      ])

      await typeWriterEffect(reply, (partial) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: partial } : m
          )
        )
      })

      const updatedUsage = {
        messages: usage.messages + 1,
        tokens: usage.tokens + (tokens || 0),
      }

      setUsage(updatedUsage)

      if (
        updatedUsage.messages >= MESSAGE_LIMIT ||
        updatedUsage.tokens >= TOKEN_LIMIT
      ) {
        setLimitReached(true)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "Sorry, something went wrong.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setSending(false)
    }
  }
  
  /* ===================== UI ===================== */

  const selectedTheme =
    THEMES.find((t) => t.value === chatbot?.theme) || THEMES[0]

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!chatbot) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-6">Chatbot not found</Card>
      </div>
    )
  }
  
  const renderTalkMode = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
      <div className="h-24 flex items-center justify-center">
         <p className={`text-2xl font-medium ${selectedTheme.textColor}`}>{userTranscript}</p>
      </div>
      <div className="my-8">
        <Button
          size="lg"
          className={`rounded-full w-24 h-24 ${talkLoopActive ? 'bg-red-500' : 'bg-blue-500'}`}
          onClick={toggleTalkLoop}
        >
          {talkLoopActive ? <PhoneOff className="h-10 w-10" /> : <Mic className="h-12 w-12" />}
        </Button>
      </div>
      <div className="h-8">
        {isListening && <p className={`text-lg ${selectedTheme.textColor}`}>Listening...</p>}
        {sending && <p className={`text-lg ${selectedTheme.textColor}`}>Thinking...</p>}
        {isAISpeaking && <p className={`text-lg ${selectedTheme.textColor}`}>AI is speaking...</p>}
        {!talkLoopActive && !isAISpeaking && !sending && <p className={`text-lg ${selectedTheme.textColor}`}>Click the mic to start the call</p>}
      </div>
    </div>
  );

  const renderChatMode = () => (
    <>
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-3 rounded-lg max-w-md whitespace-pre-wrap leading-relaxed shadow-md ${
                  m.role === "user"
                    ? `${selectedTheme.color} ${selectedTheme.textColor}`
                    : "bg-white/20 text-white"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && messages[messages.length - 1]?.role === 'user' && <Loader2 className="h-4 w-4 animate-spin text-white" />}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="border-t border-white/20 p-4 bg-black/10">
        {limitReached ? (
          <p className="text-red-400 text-center">
            Daily limit reached.
          </p>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your chatbot..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !input.trim()}>
              {sending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        )}
      </div>
    </>
  );

  return (
    <div className={`h-screen max-h-screen flex flex-col ${selectedTheme.color}`}>
      {/* Header */}
      <header className="p-4 border-b border-white/20 bg-black/30 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <Link href="/app/chatbots">
            <Button variant="ghost" size="icon">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className={`font-bold text-lg ${selectedTheme.textColor}`}>
            {chatbot.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
           <Button onClick={() => setMode('chat')} variant={mode === 'chat' ? 'secondary' : 'ghost'}><MessageSquare className="mr-2 h-4 w-4"/>Chat</Button>
           <Button onClick={() => setMode('talk')} variant={mode === 'talk' ? 'secondary' : 'ghost'}><Mic className="mr-2 h-4 w-4"/>Talk</Button>
        </div>
        <div className="flex gap-2">
          <Link href={`/app/chatbots/${chatbot.id}/settings?tab=config`}>
            <Button variant="outline" size="icon">
              <Settings />
            </Button>
          </Link>
          <Link href={`/app/chatbots/${chatbot.id}/settings?tab=deploy`}>
            <Button variant="outline" size="icon">
              <Rocket />
            </Button>
          </Link>
        </div>
      </header>

      {mode === 'chat' ? renderChatMode() : renderTalkMode()}

    </div>
  )
}
