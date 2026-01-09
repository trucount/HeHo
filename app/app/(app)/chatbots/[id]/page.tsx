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
  
  // Talk Mode State
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
    if (recognitionRef.current && !isListening && !isAISpeaking) {
      finalTranscriptRef.current = "";
      setUserTranscript("")
      recognitionRef.current.start()
    }
  }, [isListening, isAISpeaking])

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
        body: JSON.stringify({ chatbotId, message, history: [] }),
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
      setSending(false)
      setIsAISpeaking(true)
      const utterance = new SpeechSynthesisUtterance("Sorry, something went wrong.")
      utterance.onend = () => {
          setIsAISpeaking(false)
          if (talkLoopActive) startListening()
      }
      speechSynthesis.speak(utterance)
    }
  }, [chatbotId, limitReached, talkLoopActive, startListening, usage.messages, usage.tokens])

  useEffect(() => {
    const SpeechRecognition = (window as IWindow).webkitSpeechRecognition || window.SpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }

      let silenceTimeout: NodeJS.Timeout;
      
      recognition.onresult = (event: any) => {
        clearTimeout(silenceTimeout);

        let interimTranscript = ''
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }
        finalTranscriptRef.current = finalTranscript;
        setUserTranscript(finalTranscript + interimTranscript);
        
        silenceTimeout = setTimeout(() => {
            recognition.stop();
            if (finalTranscriptRef.current.trim()){
                sendAndSpeak(finalTranscriptRef.current.trim());
            }
        }, 1000); 
      }
      
      recognitionRef.current = recognition
    }
  }, [sendAndSpeak])

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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return router.push("/login")

        const { data: chatbotData } = await supabase.from("chatbots").select("id, name, model, theme").eq("id", chatbotId).eq("user_id", user.id).single()
        if (!chatbotData) return router.push("/app/dashboard")
        setChatbot(chatbotData)

        const today = new Date(); today.setHours(0, 0, 0, 0)
        const { data: usageData } = await supabase.from("usage").select("messages, tokens").eq("user_id", user.id).gte("created_at", today.toISOString())
        
        if (usageData?.length) {
          const totalMessages = usageData.reduce((a, b) => a + (b.messages || 0), 0)
          const totalTokens = usageData.reduce((a, b) => a + (b.tokens || 0), 0)
          setUsage({ messages: totalMessages, tokens: totalTokens })
          if (totalMessages >= MESSAGE_LIMIT || totalTokens >= TOKEN_LIMIT) setLimitReached(true)
        }
      } catch {
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [chatbotId, router, supabase])

  useEffect(() => {
    if (mode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, mode])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || limitReached) return

    setSending(true)
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input, timestamp: new Date() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotId, message: userMessage.content, history: newMessages.slice(0, -1) }),
      })

      const { reply, tokens } = await res.json()
      const assistantId = (Date.now() + 1).toString()
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }])

      await typeWriterEffect(reply, (partial) => {
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: partial } : m))
      })

      const updatedUsage = { messages: usage.messages + 1, tokens: usage.tokens + (tokens || 0) }
      setUsage(updatedUsage)
      if (updatedUsage.messages >= MESSAGE_LIMIT || updatedUsage.tokens >= TOKEN_LIMIT) setLimitReached(true)
    } catch {
      setMessages((prev) => [...prev, { id: (Date.now() + 2).toString(), role: "assistant", content: "Sorry, something went wrong.", timestamp: new Date() }])
    } finally {
      setSending(false)
    }
  }
  
  const selectedTheme = THEMES.find((t) => t.value === chatbot?.theme) || THEMES[0]

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  if (!chatbot) return <div className="h-full flex items-center justify-center"><Card className="p-6">Chatbot not found</Card></div>
  
  const renderTalkMode = () => (
    <div className={`flex-1 flex flex-col items-center justify-center text-center p-4 ${selectedTheme.textColor}`}>
      <div className="h-24 flex items-center justify-center">
         <p className="text-2xl font-medium">{userTranscript}</p>
      </div>
      <div className="my-8">
        <Button size="lg" className={`rounded-full w-24 h-24 ${talkLoopActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`} onClick={toggleTalkLoop}>
          {talkLoopActive ? <PhoneOff className="h-10 w-10" /> : <Mic className="h-12 w-12" />}
        </Button>
      </div>
      <div className="h-8 text-lg">
        {isListening ? "Listening..." : sending ? "Thinking..." : isAISpeaking ? "AI is speaking..." : talkLoopActive ? "Paused" : "Click the mic to start"}
      </div>
    </div>
  );

  const renderChatMode = () => (
    <>
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`px-4 py-3 rounded-lg max-w-md whitespace-pre-wrap leading-relaxed shadow-md ${m.role === "user" ? `${selectedTheme.color} ${selectedTheme.textColor}` : "bg-white/20 text-white"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {sending && messages[messages.length - 1]?.role === 'user' && <div className="flex justify-start"><Loader2 className="h-4 w-4 animate-spin text-white" /></div>}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="border-t border-white/20 p-4 bg-black/10">
        {limitReached ? (
          <p className="text-red-400 text-center">Daily limit reached.</p>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your chatbot..." disabled={sending} className="flex-1 bg-black/20 border-white/30 text-white" />
            <Button type="submit" disabled={sending || !input.trim()}>
              {sending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        )}
      </div>
    </>
  );

  return (
    <div className={`h-screen flex flex-col ${selectedTheme.color}`}>
      <header className="p-4 border-b border-white/20 bg-black/30 flex justify-between items-center z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/app/chatbots"><Button variant="ghost" size="icon"><ArrowLeft /></Button></Link>
          <h1 className={`font-bold text-lg ${selectedTheme.textColor}`}>{chatbot.name}</h1>
        </div>
        <div className="flex items-center gap-2">
           <Button onClick={() => setMode('chat')} variant={mode === 'chat' ? 'secondary' : 'ghost'}><MessageSquare className="mr-2 h-4 w-4"/>Chat</Button>
           <Button onClick={() => setMode('talk')} variant={mode === 'talk' ? 'secondary' : 'ghost'}><Mic className="mr-2 h-4 w-4"/>Talk</Button>
        </div>
        <div className="flex gap-2">
          <Link href={`/app/chatbots/${chatbot.id}/settings?tab=config`}><Button variant="outline" size="icon"><Settings /></Button></Link>
          <Link href={`/app/chatbots/${chatbot.id}/settings?tab=deploy`}><Button variant="outline" size="icon"><Rocket /></Button></Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col min-h-0">
        {mode === 'chat' ? renderChatMode() : renderTalkMode()}
      </main>

    </div>
  )
}
