import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

const POPULAR_MODELS = [
  "allenai/olmo-3.1-32b-think:free",
  "xiaomi/mimo-v2-flash:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "mistralai/devstral-2512:free",
  "nex-agi/deepseek-v3.1-nex-n1:free",
  "arcee-ai/trinity-mini:free",
  "tngtech/tng-r1t-chimera:free",
  "kwaipilot/kat-coder-pro:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "alibaba/tongyi-deepresearch-30b-a3b:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "z-ai/glm-4.5-air:free",
  "qwen/qwen3-coder:free",
  "moonshotai/kimi-k2:free",
  "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
  "google/gemma-3n-e2b-it:free",
  "tngtech/deepseek-r1t2-chimera:free",
  "deepseek/deepseek-r1-0528:free",
  "google/gemma-3n-e4b-it:free",
]

export async function POST(request: NextRequest) {
  try {
    const { message, history, isPublic, shareToken, chatbotId } =
      await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    let chatbot: any = null
    let userId: string | null = null

    // ---------------- PUBLIC CHAT ----------------
    if (isPublic) {
      if (!shareToken) return NextResponse.json({ error: 'Share token required' }, { status: 400 })

      const { data: shareData } = await supabase
        .from('chatbot_shares')
        .select('chatbot_id, user_id, expires_at')
        .eq('share_token', shareToken)
        .single()

      if (!shareData) return NextResponse.json({ error: 'Invalid share link' }, { status: 404 })
      if (shareData.expires_at && new Date(shareData.expires_at) < new Date())
        return NextResponse.json({ error: 'Share link expired' }, { status: 410 })

      userId = shareData.user_id

      const { data: chatbotData } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', shareData.chatbot_id)
        .single()

      if (!chatbotData) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
      chatbot = chatbotData
    }

    // ---------------- PRIVATE CHAT ----------------
    else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id

      const { data: chatbotData } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', chatbotId)
        .single()

      if (!chatbotData) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
      if (chatbotData.user_id !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      chatbot = chatbotData
    }

    if (!userId) return NextResponse.json({ error: 'Could not identify user' }, { status: 500 })

    const { data: userData } = await supabase
      .from('users')
      .select('openrouter_key_encrypted')
      .eq('id', userId)
      .single()

    if (!userData?.openrouter_key_encrypted)
      return NextResponse.json({ error: 'API key not configured.' }, { status: 400 })

    // ---------------- SYSTEM PROMPT ----------------
    let systemPrompt = `You are a helpful AI assistant named ${chatbot.name}.`
    if (chatbot.goal) systemPrompt += ` Your goal is to ${chatbot.goal}.`
    if (chatbot.description) systemPrompt += ` ${chatbot.description}.`
    if (chatbot.tone) systemPrompt += ` Maintain a ${chatbot.tone} tone.`

    // ---------------- AI CALL ----------------
    const modelsToTry = [chatbot.model, ...POPULAR_MODELS]
    let responseData: any = null

    for (const model of modelsToTry) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userData.openrouter_key_encrypted}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://heho.app',
            'X-Title': 'HeHo',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...(history || []),
              { role: 'user', content: message },
            ],
            temperature: chatbot.temperature || 0.7,
            max_tokens: 2048,
          }),
        })

        if (res.ok) {
          responseData = await res.json()
          break
        }
      } catch (e) {
        console.error('[MODEL ERROR]', model, e)
      }
    }

    if (!responseData) return NextResponse.json({ error: 'All models failed.' }, { status: 500 })

    const reply = responseData.choices[0].message.content
    const tokensUsed = responseData.usage?.total_tokens || 0

    // ---------------- USAGE TRACKING (CUMULATIVE) ----------------
    const usageDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // 1. Try to increment existing row
    const { data: existing, error } = await supabase
      .from('usage')
      .select('id, messages, tokens, api_calls')
      .eq('user_id', userId)
      .eq('month', usageDate)
      .maybeSingle()

    if (existing) {
      // Update cumulatively
      await supabase
        .from('usage')
        .update({
          messages: existing.messages + 1,
          tokens: existing.tokens + tokensUsed,
          api_calls: existing.api_calls + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      // Insert new row for today
      await supabase.from('usage').insert({
        user_id: userId,
        month: usageDate,
        messages: 1,
        tokens: tokensUsed,
        api_calls: 1,
      })
    }

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('[API ERROR]', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
