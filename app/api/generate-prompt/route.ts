export async function POST(request: Request) {
  try {
    const { name, goal } = await request.json()

    if (!name || !goal) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

    // Note: In production, you should get the user's OpenRouter key from Supabase
    // For now, using a free model that doesn't require authentication
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://heho.app",
        "X-Title": "HeHo",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "user",
            content: `You are an expert AI chatbot designer. Create a detailed system prompt for a chatbot with the following requirements:

Chatbot Name: ${name}
Goal: ${goal}

Generate a comprehensive system prompt (at least 200 characters) that includes:
1. The chatbot's purpose and role
2. Key behaviors and capabilities
3. Tone and communication style guidelines
4. Important limitations and what it should NOT do
5. How to handle edge cases
6. Any specific business rules to follow

The prompt should be practical, detailed, and ready to use for training the AI model. Return only the system prompt, no additional text.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!openRouterResponse.ok) {
      const error = await openRouterResponse.json()
      console.error("[v0] OpenRouter error:", error)
      return Response.json({ error: "Failed to generate prompt" }, { status: 500 })
    }

    const data = await openRouterResponse.json()
    const prompt = data.choices[0].message.content.trim()

    return Response.json({ prompt })
  } catch (error) {
    console.error("[v0] Generate prompt error:", error)
    return Response.json({ error: "Failed to generate prompt" }, { status: 500 })
  }
}
