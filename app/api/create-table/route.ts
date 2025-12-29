import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { chatbotId, tableName, userId, chatbotName } = await request.json()

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's OpenRouter key to generate SQL
    const { data: userData } = await supabase.from("users").select("*").eq("id", userId).single()

    if (!userData?.openrouter_key_encrypted) {
      return NextResponse.json({ error: "OpenRouter not configured" }, { status: 400 })
    }

    // Use AI to generate SQL schema based on chatbot purpose
    const { data: chatbotData } = await supabase.from("chatbots").select("*").eq("id", chatbotId).single()

    const generateSchemaResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userData.openrouter_key_encrypted}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "system",
            content: `You are an expert database schema designer. Generate a simple PostgreSQL CREATE TABLE statement.
            
Rules:
- Table name: ${tableName}
- Include an id column as primary key
- Include created_at timestamp
- Include updated_at timestamp
- Based on the chatbot purpose, add 3-5 relevant data columns
- Use appropriate column types (text, integer, timestamp, boolean)
- Keep it simple and practical
- Return ONLY the CREATE TABLE statement, nothing else
- No markdown, no backticks, just pure SQL`,
          },
          {
            role: "user",
            content: `Create a table for: ${chatbotName}\n\nChatbot Purpose: ${chatbotData?.goal}\n\nDetails: ${chatbotData?.description}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!generateSchemaResponse.ok) {
      throw new Error("Failed to generate schema")
    }

    const schemaData = await generateSchemaResponse.json()
    const createTableSQL = schemaData.choices[0].message.content

    // For now, return the SQL (actual execution happens via migrations)
    // In production, you'd execute this via a trusted server connection to Supabase

    return NextResponse.json({
      success: true,
      tableName,
      sql: createTableSQL,
    })
  } catch (error) {
    console.error("[v0] Create table error:", error)
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 })
  }
}
