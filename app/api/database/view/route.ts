
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('tableName');

    if (!tableName) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { data: userDetails, error: detailsError } = await supabase
      .from('users')
      .select('supabase_url, supabase_key_encrypted')
      .eq('id', user.id)
      .single();

    if (detailsError || !userDetails) {
      throw new Error(detailsError?.message || 'Could not find user database credentials.');
    }

    if (!userDetails.supabase_url || !userDetails.supabase_key_encrypted) {
      throw new Error('Supabase URL or Key not configured for this user. Please complete setup.');
    }

    const userSupabase = createClient(userDetails.supabase_url, userDetails.supabase_key_encrypted);

    const { data, error: tableError } = await userSupabase
      .from(tableName)
      .select('*');

    if (tableError) {
      throw new Error(`Error fetching data from table '${tableName}': ${tableError.message}`);
    }
    
    // For the default tables, the primary key is 'id'. We will assume this convention.
    const primaryKey = 'id';

    return NextResponse.json({ data, primaryKey });

  } catch (err: any) {
    // Ensure any error returns a valid JSON response to prevent crashes
    console.error('[DB_VIEW_ERROR]', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
