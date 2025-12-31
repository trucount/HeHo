import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { chatbotId, message, isPublic } = await request.json()

    const supabase = await createClient()

    // For public access, we don't require authentication
    let user = null
    if (!isPublic) {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      user = currentUser
    }

    const { data: chatbot, error: chatbotError } = await supabase
      .from("chatbots")
      .select("*")
      .eq("id", chatbotId)
      .single()

    if (chatbotError || !chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 })
    }

    // For public access, verify chatbot is deployed
    if (isPublic && !chatbot.deployed) {
      return NextResponse.json({ error: "Chatbot not deployed" }, { status: 404 })
    }

    if (!isPublic && chatbot.user_id !== user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("*").eq("id", chatbot.user_id).single()

    if (!userData?.openrouter_key_encrypted) {
      return NextResponse.json({ error: "OpenRouter key not configured" }, { status: 400 })
    }

    const dataTableName = chatbot.data_table_name || null

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userData.openrouter_key_encrypted}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://heho.app",
        "X-Title": "HeHo",
      },
      body: JSON.stringify({
        model: chatbot.model,
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant for: ${chatbot.name}. 
            
Project Context:
${chatbot.description}

Goal: ${chatbot.goal}
Tone: ${chatbot.tone || "professional"}

${dataTableName ? `Database Table: ${dataTableName} - Save relevant user data here when appropriate` : ""}

You have access to the user's Supabase database with the following permissions:
- Read: ${userData.supabase_permissions?.can_read ? "Yes" : "No"}
- Insert: ${userData.supabase_permissions?.can_insert ? "Yes" : "No"}
- Create: ${userData.supabase_permissions?.can_create ? "Yes" : "No"}
- Delete: ${userData.supabase_permissions?.can_delete ? "Yes" : "No"}

Always respond helpfully and consider the user's database context when answering.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json()
      console.error("[v0] OpenRouter error:", errorData)
      throw new Error("OpenRouter API error")
    }

    const data = await openRouterResponse.json()
    const reply = data.choices[0].message.content

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthString = monthStart.toISOString().split('T')[0];

    const { data: existingUsage } = await supabase
      .from("usage")
      .select("id, messages, tokens, api_calls")
      .eq("user_id", chatbot.user_id)
      .eq("month", monthString)
      .single();

    if (existingUsage) {
      await supabase
        .from("usage")
        .update({
          messages: (existingUsage.messages || 0) + 1,
          tokens: (existingUsage.tokens || 0) + (data.usage?.total_tokens || 0),
          api_calls: (existingUsage.api_calls || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUsage.id);
    } else {
      await supabase.from("usage").insert({
        user_id: chatbot.user_id,
        month: monthString,
        messages: 1,
        tokens: data.usage?.total_tokens || 0,
        api_calls: 1,
        db_reads: 0,
        db_writes: 0,
      });
    }

    return NextResponse.json({ reply, tokens: data.usage?.total_tokens || 0 })
  } catch (error) {
    console.error("[v0] Chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
