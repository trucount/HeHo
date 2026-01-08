import { createClient as createSupabaseAdminClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

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

async function getTableSchema(client: any, tableName: string) {
  const { data, error } = await client
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', tableName)

  if (error) {
    console.error(`Error fetching schema for table ${tableName}:`, error)
    return null
  }

  return data
}

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

    const supabaseAdmin = await createSupabaseAdminClient()
    let chatbot: any = null
    let userId: string | null = null

    if (isPublic) {
      if (!chatbotId) {
        return NextResponse.json(
          { error: 'Chatbot ID is required' },
          { status: 400 }
        )
      }

      const { data: chatbotData } = await supabaseAdmin
        .from('chatbots')
        .select(
          '*, users(id, supabase_url, supabase_key_encrypted, openrouter_key_encrypted)'
        )
        .eq('id', chatbotId)
        .single()

      if (!chatbotData) {
        return NextResponse.json(
          { error: 'Chatbot not found' },
          { status: 404 }
        )
      }

      chatbot = chatbotData
      userId = chatbotData.users.id
    } else {
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      userId = user.id

      const { data: chatbotData } = await supabaseAdmin
        .from('chatbots')
        .select(
          '*, users(id, supabase_url, supabase_key_encrypted, openrouter_key_encrypted)'
        )
        .eq('id', chatbotId)
        .eq('user_id', user.id)
        .single()

      if (!chatbotData) {
        return NextResponse.json(
          { error: 'Chatbot not found' },
          { status: 404 }
        )
      }

      chatbot = chatbotData
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Could not identify user' },
        { status: 500 }
      )
    }

    const userData = chatbot.users

    if (!userData?.openrouter_key_encrypted) {
      return NextResponse.json(
        { error: 'API key not configured.' },
        { status: 400 }
      )
    }

    let systemPrompt = `You are a helpful AI assistant named ${chatbot.name}.`

    if (chatbot.goal) systemPrompt += ` Your goal is to ${chatbot.goal}.`
    if (chatbot.description)
      systemPrompt += ` ${chatbot.description}.`
    if (chatbot.tone) systemPrompt += ` Maintain a ${chatbot.tone} tone.`

    if (userData.supabase_url && userData.supabase_key_encrypted) {
      const userSupabase = createClient(
        userData.supabase_url,
        userData.supabase_key_encrypted
      )

      for (let i = 1; i <= 3; i++) {
        const tableName = chatbot[`data_table_${i}`]
        const canRead = chatbot[`data_table_${i}_read`]
        const canWrite = chatbot[`data_table_${i}_write`]

        if (!tableName) continue

        let accessLevel = ''
        if (canRead && canWrite) {
          accessLevel = 'READ and WRITE'
        } else if (canRead) {
          accessLevel = 'READ-ONLY'
        } else if (canWrite) {
          accessLevel = 'WRITE-ONLY'
        }

        if (canRead || canWrite) {
          systemPrompt += `\n\nYou are connected to the '${tableName}' table with ${accessLevel} access.`
        }

        if (canRead) {
          const { data: tableData, error: tableError } = await userSupabase
            .from(tableName)
            .select('*')

          if (tableError) {
            systemPrompt += `\nNote: Error accessing table '${tableName}': ${tableError.message}`
          } else if (tableData) {
            systemPrompt += `\nHere is the current data from the table:\n${JSON.stringify(
              tableData,
              null,
              2
            )}`
          }
        }

        if (canWrite) {
          const schema = await getTableSchema(userSupabase, tableName)

          if (schema) {
            systemPrompt += `\n\n**CRITICAL INSTRUCTION: DATABASE WRITE ACTION**`
            systemPrompt += `\nWhen a user wants to add data to the '${tableName}' table (e.g., 'buy a product', 'add a lead'), it is your primary job to add a new row to this table.`
            systemPrompt += `\n**Table Schema:**\n${JSON.stringify(
              schema,
              null,
              2
            )}`
            systemPrompt += `\n**Action Steps:**`
            systemPrompt += `\n1. Gather all required information from the user based on the schema.`
            systemPrompt += `\n2. Confirm the details with the user.`
            systemPrompt += `\n3. After user confirmation, you MUST IMMEDIATELY and ONLY respond with the JSON command below. Do not add ANY other text, greetings, or apologies. Your entire response must be the command.`
            systemPrompt += `\n**Command Format:** \`[ADD_DATA]{"tableName": "${tableName}", "data": { ...column_data... }}\``
            systemPrompt += `\n**Example:** \`[ADD_DATA]{"tableName": "sales", "data": {"product": "apples", "quantity": 20}}\``
          } else {
            systemPrompt += `\n\nNote: Could not retrieve schema for table '${tableName}'. Write operations may not be possible.`
          }
        }
      }
    }

    const modelsToTry = [chatbot.model, ...POPULAR_MODELS]
    let responseData: any = null

    for (const model of modelsToTry) {
      try {
        const res = await fetch(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${userData.openrouter_key_encrypted}`,
              'Content-Type': 'application/json',
              'HTTP-Referer':
                process.env.NEXT_PUBLIC_SITE_URL || 'https://heho.app',
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
          }
        )

        if (res.ok) {
          responseData = await res.json()
          break
        }
      } catch (e) {
        console.error('[MODEL ERROR]', model, e)
      }
    }

    if (!responseData) {
      return NextResponse.json(
        { error: 'All models failed.' },
        { status: 500 }
      )
    }

    let reply = responseData.choices[0].message.content
    const tokensUsed = responseData.usage?.total_tokens || 0
    let dbWriteOccurred = false

    if (reply.startsWith('[ADD_DATA]')) {
      try {
        const jsonString = reply.substring(10)
        const { tableName, data } = JSON.parse(jsonString)

        const addDataResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/chat/add-to-table`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Cookie: request.headers.get('cookie') || '',
            },
            body: JSON.stringify({ chatbotId, tableName, data }),
          }
        )

        const addDataResult = await addDataResponse.json()

        if (addDataResponse.ok) {
          reply = `Successfully added the data to the ${tableName} table.`
          dbWriteOccurred = true
        } else {
          reply = `I tried to add the data, but an error occurred: ${addDataResult.error}`
        }
      } catch (e: any) {
        console.error('[ADD_DATA] Error:', e)
        reply =
          'I was unable to process the request to add data to the table. Please try again.'
      }
    }

    const usageDate = new Date().toISOString().split('T')[0]

    const { data: existing } = await supabaseAdmin
      .from('usage')
      .select('id, messages, tokens, api_calls, db_writes')
      .eq('user_id', userId)
      .eq('month', usageDate)
      .maybeSingle()

    if (existing) {
      const updateData: any = {
        messages: existing.messages + 1,
        tokens: existing.tokens + tokensUsed,
        api_calls: existing.api_calls + 1,
        updated_at: new Date().toISOString(),
      }

      if (dbWriteOccurred) {
        updateData.db_writes = (existing.db_writes || 0) + 1
      }

      await supabaseAdmin.from('usage').update(updateData).eq('id', existing.id)
    } else {
      const insertData: any = {
        user_id: userId,
        month: usageDate,
        messages: 1,
        tokens: tokensUsed,
        api_calls: 1,
      }

      if (dbWriteOccurred) {
        insertData.db_writes = 1
      }

      await supabaseAdmin.from('usage').insert(insertData)
    }

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('[API ERROR]', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
