import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/* =======================
   SERVER SAFETY GUARD
======================= */
if (typeof window !== 'undefined') {
  throw new Error('This route must run on the server only')
}

/* =======================
   SUPABASE (SERVICE ROLE)
======================= */
const supabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* =======================
   POPULAR FALLBACK MODELS
======================= */
const POPULAR_MODELS = [
  'allenai/olmo-3.1-32b-think:free',
  'xiaomi/mimo-v2-flash:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'mistralai/devstral-2512:free',
  'nex-agi/deepseek-v3.1-nex-n1:free',
  'arcee-ai/trinity-mini:free',
  'tngtech/tng-r1t-chimera:free',
  'kwaipilot/kat-coder-pro:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'alibaba/tongyi-deepresearch-30b-a3b:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'z-ai/glm-4.5-air:free',
  'qwen/qwen3-coder:free',
  'moonshotai/kimi-k2:free',
  'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
  'google/gemma-3n-e2b-it:free',
  'tngtech/deepseek-r1t2-chimera:free',
  'deepseek/deepseek-r1-0528:free',
  'google/gemma-3n-e4b-it:free',
]

const ALLOWED_MODELS = new Set(POPULAR_MODELS)

/* =======================
   OPENROUTER CALL
======================= */
async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  history: any[],
  message: string,
  temperature: number
) {
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
      temperature,
      max_tokens: 2048,
    }),
  })
}

/* =======================
   POST HANDLER
======================= */
export async function POST(request: NextRequest) {
  try {
    const { message, history, isPublic, shareToken } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    /* =======================
       PUBLIC CHAT ONLY
    ======================= */
    if (!isPublic || !shareToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    /* =======================
       VALIDATE SHARE LINK
    ======================= */
    const { data: shareData } = await supabase
      .from('chatbot_shares')
      .select('chatbot_id, user_id, expires_at')
      .eq('share_token', shareToken)
      .single()

    if (!shareData) {
      return NextResponse.json({ error: 'Invalid share link' }, { status: 404 })
    }

    if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Share link expired' }, { status: 410 })
    }

    const userId = shareData.user_id

    /* =======================
       LOAD CHATBOT
    ======================= */
    const { data: chatbot } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', shareData.chatbot_id)
      .single()

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
    }

    /* =======================
       LOAD USER KEY
    ======================= */
    const { data: user } = await supabase
      .from('users')
      .select('openrouter_key_encrypted')
      .eq('id', userId)
      .single()

    if (!user?.openrouter_key_encrypted) {
      return NextResponse.json(
        { error: 'Chatbot owner has no API key' },
        { status: 400 }
      )
    }

    const openrouterKey = user.openrouter_key_encrypted // decrypt here if encrypted

    /* =======================
       SYSTEM PROMPT
    ======================= */
    let systemPrompt = `You are a helpful AI assistant named ${chatbot.name}.`
    if (chatbot.goal) systemPrompt += ` Your goal is to ${chatbot.goal}.`
    if (chatbot.description) systemPrompt += ` ${chatbot.description}.`
    if (chatbot.tone) systemPrompt += ` Maintain a ${chatbot.tone} tone.`

    /* =======================
       MODEL FALLBACK LOGIC
    ======================= */
    const triedModels = new Set<string>()
    const modelsToTry = [
      ALLOWED_MODELS.has(chatbot.model) ? chatbot.model : null,
      ...POPULAR_MODELS,
    ].filter(Boolean) as string[]

    let responseData: any = null
    let usedModel: string | null = null

    for (const model of modelsToTry) {
      if (triedModels.has(model)) continue
      triedModels.add(model)

      try {
        const res = await callOpenRouter(
          openrouterKey,
          model,
          systemPrompt,
          history,
          message,
          chatbot.temperature ?? 0.7
        )

        if (res.status === 401) {
          return NextResponse.json(
            { error: 'Invalid OpenRouter API key' },
            { status: 401 }
          )
        }

        if (!res.ok) continue

        responseData = await res.json()
        usedModel = model
        break
      } catch {
        continue
      }
    }

    if (!responseData) {
      return NextResponse.json(
        { error: 'All models failed. Try again later.' },
        { status: 500 }
      )
    }

    const reply = responseData.choices[0].message.content

    /* =======================
       USAGE TRACKING (SAFE)
    ======================= */
    ;(async () => {
      try {
        const date = new Date().toISOString().split('T')[0]
        const tokens = responseData.usage?.total_tokens || 0

        const { data: usage } = await supabase
          .from('usage')
          .select('id, messages, tokens, api_calls')
          .eq('user_id', userId)
          .eq('month', date)
          .single()

        if (usage) {
          await supabase
            .from('usage')
            .update({
              messages: usage.messages + 1,
              tokens: usage.tokens + tokens,
              api_calls: usage.api_calls + 1,
            })
            .eq('id', usage.id)
        } else {
          await supabase.from('usage').insert({
            user_id: userId,
            month: date,
            messages: 1,
            tokens,
            api_calls: 1,
          })
        }
      } catch (e) {
        console.error('[USAGE ERROR]', e)
      }
    })()

    return NextResponse.json({ reply, model: usedModel })
  } catch (err) {
    console.error('[API ERROR]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
