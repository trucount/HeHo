import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { tableName } = await request.json();

  if (!tableName || typeof tableName !== 'string' || tableName.trim().length === 0) {
    return NextResponse.json({ error: 'Table name is required and must be a non-empty string.' }, { status: 400 });
  }

  const trimmedTableName = tableName.trim();
  const cookieStore = cookies();

  // Client to interact with the application's database.
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
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Before adding the table to our metadata, let's verify it exists in the user's database.
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('supabase_url, supabase_key_encrypted')
        .eq('id', user.id)
        .single();

    if (userError || !userData?.supabase_url || !userData?.supabase_key_encrypted) {
        return NextResponse.json({ error: 'Could not retrieve your Supabase credentials. Please verify them in the settings.' }, { status: 500 });
    }

    const userSupabase = createClient(userData.supabase_url, userData.supabase_key_encrypted);
    
    // We select with a limit of 0 because we only care if the table exists, not about its data.
    const { error: tableCheckError } = await userSupabase.from(trimmedTableName).select('*', { head: true, count: 'exact' });

    if (tableCheckError) {
      if (tableCheckError.code === '42P01') { // undefined_table
          return NextResponse.json({ error: `The table "${trimmedTableName}" does not seem to exist in your database. Please check the name and try again.` }, { status: 404 });
      }
      // For other errors, return a generic message but log the specific error.
      console.error("Error checking user table:", tableCheckError);
      return NextResponse.json({ error: `An error occurred while trying to verify your table: ${tableCheckError.message}` }, { status: 500 });
    }

    // Now that we've verified the table exists, add it to our user_connected_tables.
    const { data, error: insertError } = await supabase
      .from('user_connected_tables')
      .insert({ user_id: user.id, table_name: trimmedTableName })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') { // unique_violation
        return NextResponse.json({ error: `You have already connected the table named "${trimmedTableName}".` }, { status: 409 });
      }
      throw insertError;
    }

    return NextResponse.json({ message: 'Table connected successfully!', table: data });

  } catch (err: any) {
    console.error('Error in POST /api/database/connect:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
