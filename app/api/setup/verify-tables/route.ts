
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// This function checks if a table exists by trying to select from it.
// Supabase returns a specific error code '42P01' if the table does not exist.
async function tableExists(supabaseClient: any, tableName: string): Promise<boolean> {
    const { error } = await supabaseClient.from(tableName).select('id').limit(1);
    if (error && error.code === '42P01') {
        return false; // Table does not exist
    }
    // If there's no error, or a different error, we assume the table exists or the user lacks permissions,
    // which is still a form of 'existence' for our verification purpose.
    return true;
}

export async function POST(request: Request) {
  const { tableNames, supabaseUrl, supabaseKey } = await request.json();

  if (!tableNames || !Array.isArray(tableNames) || tableNames.length === 0) {
    return NextResponse.json({ error: 'An array of table names is required' }, { status: 400 });
  }
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase URL and Key are required for verification' }, { status: 400 });
  }

  try {
    // Create a new Supabase client with the user-provided, temporary credentials for verification.
    const userSupabase = createClient(supabaseUrl, supabaseKey);
    
    const verificationResults: { [key: string]: boolean } = {};
    for (const tableName of tableNames) {
        verificationResults[tableName] = await tableExists(userSupabase, tableName);
    }

    return NextResponse.json({ verificationResults });

  } catch (err: any) {
    console.error("Error during table verification:", err);
    return NextResponse.json({ error: 'An unexpected error occurred during table verification.' }, { status: 500 });
  }
}
