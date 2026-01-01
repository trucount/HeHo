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
    const { message, history, isPublic, shareToken, chatbotId } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const supabase = await createClient()
    let chatbot: any = null
    let userId: string | null = null

    if (isPublic) {
      if (!shareToken) {
        return NextResponse.json({ error: 'Share token is required' }, { status: 400 })
      }

      const { data: shareData, error: shareError } = await supabase
        .from('chatbot_shares')
        .select('chatbot_id, user_id, expires_at')
        .eq('share_token', shareToken)
        .single()

      if (shareError || !shareData) {
        return NextResponse.json({ error: 'Invalid share link' }, { status: 404 })
      }

      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
      }
      
      userId = shareData.user_id;

      const { data: chatbotData, error: chatbotError } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', shareData.chatbot_id)
        .single()

      if (chatbotError || !chatbotData) {
        return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
      }
      chatbot = chatbotData

    } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        userId = user.id;
        const { data: chatbotData, error: chatbotError } = await supabase
            .from("chatbots")
            .select("*")
            .eq("id", chatbotId)
            .single()
        if (chatbotError || !chatbotData) {
            return NextResponse.json({ error: "Chatbot not found" }, { status: 404 })
        }

        if (chatbotData.user_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }
        chatbot = chatbotData
    }

    if (!userId) {
      return NextResponse.json({ error: 'Could not identify user' }, { status: 500 })
    }

    const { data: userData } = await supabase.from('users').select('openrouter_key_encrypted').eq('id', userId).single()

    if (!userData?.openrouter_key_encrypted) {
      return NextResponse.json({ error: 'API key not configured for the chatbot owner.' }, { status: 400 })
    }

    // Construct the system prompt
    let systemPrompt = `You are a helpful AI assistant named ${chatbot.name}.`;
    if ( chatbot.goal) {
        systemPrompt += ` Your goal is to ${chatbot.goal}.`;
    }
    if (chatbot.description) {
        systemPrompt += ` Here is a description of you: ${chatbot.description}.`;
    }
    if (chatbot.tone) {
        systemPrompt += ` Maintain a ${chatbot.tone} tone.`;
    }

    const modelsToTry = [chatbot.model, ...POPULAR_MODELS];
    let openRouterResponse = null;
    let responseData: any = null;

    for (const model of modelsToTry) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${userData.openrouter_key_encrypted}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://heho.app',
                'X-Title': 'HeHo',
              },
              body: JSON.stringify({
                model: model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...(history || []),
                  { role: 'user', content: message },
                ],
                temperature: chatbot.temperature || 0.7,
                max_tokens: 2048, 
              }),
            });

            if (response.ok) {
                openRouterResponse = response;
                responseData = await openRouterResponse.json();
                break; // Success, exit loop
            }
        } catch (error) {
            console.error(`[API] Error with model ${model}:`, error);
        }
    }
    
    if (!openRouterResponse || !responseData) {
      return NextResponse.json({ error: "All models failed to respond." }, { status: 500 });
    }

    const reply = responseData.choices[0].message.content;

    // Record usage in a separate, non-blocking operation
    (async () => {
      try {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD

        const { data: existingUsage, error: usageError } = await supabase
          .from('usage')
          .select('id, messages, tokens, api_calls')
          .eq('user_id', userId!)
          .eq('month', dateString) // Use dateString in the 'month' column for daily tracking
          .single();

        if (usageError && usageError.code !== 'PGRST116') throw usageError;

        const usageTokens = responseData.usage?.total_tokens || 0;

        if (existingUsage) {
          await supabase
            .from('usage')
            .update({
              messages: (existingUsage.messages || 0) + 1,
              tokens: (existingUsage.tokens || 0) + usageTokens,
              api_calls: (existingUsage.api_calls || 0) + 1,
            })
            .eq('id', existingUsage.id);
        } else {
          await supabase.from('usage').insert({
            user_id: userId!,
            month: dateString, // Use dateString for daily tracking
            messages: 1,
            tokens: usageTokens,
            api_calls: 1,
          });
        }
      } catch (e) {
        console.error('[API] Usage recording error:', e);
      }
    })();

    return NextResponse.json({ reply })

  } catch (error: any) {
    console.error('[API] Chat error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
