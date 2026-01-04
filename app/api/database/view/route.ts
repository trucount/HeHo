import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { tableName } = await request.json()

  if (!tableName) {
    return NextResponse.json({ error: 'Table name is required' }, { status: 400 })
  }

  const cookieStore = cookies()

  // This client is for interacting with *your* app's database to get user details
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

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the user's Supabase credentials from our database
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('supabase_url, supabase_key_encrypted') // As instructed, treating this as a plaintext key
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    console.error('Error fetching user credentials:', userError);
    return NextResponse.json({ error: 'Could not retrieve user credentials.' }, { status: 500 })
  }

  const { supabase_url, supabase_key_encrypted } = userData

  if (!supabase_url || !supabase_key_encrypted) {
    return NextResponse.json({ error: 'User has not configured their Supabase connection in settings.' }, { status: 400 })
  }

  try {
    // This client is for interacting with the *user's* database
    const userSupabase = createClient(supabase_url, supabase_key_encrypted)

    // Fetch data from the user's table
    const { data: tableData, error: tableError } = await userSupabase
      .from(tableName)
      .select('*')
      .limit(100)

    if (tableError) {
      if (tableError.code === '42P01') { // undefined_table
          return NextResponse.json({ error: `Table "${tableName}" not found in your Supabase project.` }, { status: 404 });
      }
      console.error(`Error fetching data from user's Supabase table:`, tableError);
      throw tableError
    }

    const columns = tableData.length > 0 ? Object.keys(tableData[0]) : []

    return NextResponse.json({ data: tableData, columns })

  } catch (err: any) {
    console.error('Error in POST /api/database/view:', err)
    return NextResponse.json({ error: 'An unexpected error occurred while fetching data from the user\'s database.' }, { status: 500 })
  }
}
