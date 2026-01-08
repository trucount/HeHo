import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Function to decrypt the key
function decrypt(encryptedText: string, key: string, iv: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function getUserSupabaseClient(userId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('supabase_url, supabase_key_encrypted, encryption_iv')
    .eq('id', userId)
    .single()

  if (userError || !userData) {
    throw new Error('Could not retrieve user credentials.');
  }

  if (!userData.supabase_url || !userData.supabase_key_encrypted || !userData.encryption_iv) {
    throw new Error('User database credentials or IV are not configured.');
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('Server encryption key is not configured.');
  }

  const decryptedKey = decrypt(userData.supabase_key_encrypted, encryptionKey, userData.encryption_iv);

  return createClient(userData.supabase_url, decryptedKey);
}

export async function POST(request: Request) {
  try {
    const { chatbotId, tableName, data } = await request.json();

    if (!chatbotId || !tableName || !data) {
      return NextResponse.json({ error: 'Missing required parameters: chatbotId, tableName, and data' }, { status: 400 });
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: chatbot, error: chatbotError } = await supabase
        .from('chatbots')
        .select('user_id, data_table_1, data_table_1_write, data_table_2, data_table_2_write, data_table_3, data_table_3_write')
        .eq('id', chatbotId)
        .single();

    if (chatbotError || !chatbot) {
        return NextResponse.json({ error: 'Chatbot not found or you do not have permission to access it.' }, { status: 404 });
    }
    
    if (chatbot.user_id !== user.id) {
        return NextResponse.json({ error: 'You are not the owner of this chatbot.'}, { status: 403 });
    }

    let hasWritePermission = false;
    for (let i = 1; i <= 3; i++) {
        if(chatbot[`data_table_${i}`] === tableName && chatbot[`data_table_${i}_write`]) {
            hasWritePermission = true;
            break;
        }
    }

    if (!hasWritePermission) {
        return NextResponse.json({ error: `The chatbot does not have write permission for the table '${tableName}'.` }, { status: 403 });
    }

    const userSupabase = await getUserSupabaseClient(user.id);

    const { error: insertError } = await userSupabase
      .from(tableName)
      .insert([data]);

    if (insertError) {
      console.error('Error inserting data into user table:', insertError);
      return NextResponse.json({ error: `Failed to insert data: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: `Successfully inserted data into ${tableName}.` });

  } catch (error: any) {
    console.error('[ADD TO TABLE API ERROR]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
