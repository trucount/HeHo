
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SQL_MIGRATION = `
CREATE TABLE IF NOT EXISTS products (
    id bigserial PRIMARY KEY,
    product_name text,
    use text,
    price numeric,
    quantity_in_stock integer,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
    id bigserial PRIMARY KEY,
    name text,
    phone_number text,
    project_description text,
    email text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_queries (
    id bigserial PRIMARY KEY,
    question text,
    answer text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
    id bigserial PRIMARY KEY,
    customer_name text,
    address text,
    email text,
    phone_number text,
    products jsonb,
    total_bill numeric,
    created_at timestamptz DEFAULT now()
);
`;

const DEFAULT_TABLES = ['products', 'leads', 'customer_queries', 'sales'];

export async function POST(request: Request) {
  const { project_ref, provider_token } = await request.json();
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Get the current user from the session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  // 2. Check if the default tables are already connected for this user.
  const { data: existingTables, error: checkError } = await supabase
    .from('user_connected_tables')
    .select('table_name')
    .eq('user_id', user.id)
    .in('table_name', DEFAULT_TABLES);

  if (checkError) {
      console.error("Error checking for existing tables:", checkError);
      // Proceed, but log the error. The upsert will handle conflicts anyway.
  } else if (existingTables && existingTables.length === DEFAULT_TABLES.length) {
      // If all tables are already connected, do nothing.
      return NextResponse.json({ message: "Default tables already exist and are connected." });
  }

  if (!project_ref || !provider_token) {
    return NextResponse.json({ error: 'Project reference and provider token are required to proceed.' }, { status: 400 });
  }

  try {
    // 3. Create the tables in the user's Supabase project via the Management API
    const response = await fetch(`https://api.supabase.com/v1/projects/${project_ref}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: SQL_MIGRATION })
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Supabase Query API Error:", errorBody);
      throw new Error(errorBody.message || `An error occurred with the Supabase Query API. Status: ${response.status}`);
    }

    // 4. If successful, automatically "connect" these tables by adding them to this app's database.
    const recordsToInsert = DEFAULT_TABLES.map(tableName => ({
        user_id: user.id,
        table_name: tableName
    }));

    const { error: insertError } = await supabase
        .from('user_connected_tables')
        .upsert(recordsToInsert, { onConflict: 'user_id, table_name' });

    if (insertError) {
      console.error("Failed to auto-connect default tables for user:", insertError);
      throw new Error(`Tables were created in your project, but failed to automatically appear in the app. Please connect them manually. Error: ${insertError.message}`);
    }

    return NextResponse.json({ message: "Tables created and automatically connected successfully!" });

  } catch (err: any) {
    console.error('Error in create-tables endpoint:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred while creating and connecting tables.' }, { status: 500 });
  }
}
