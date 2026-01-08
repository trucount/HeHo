
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

export async function POST(request: Request) {
  const { project_ref, provider_token } = await request.json();
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  if (!project_ref || !provider_token) {
    return NextResponse.json({ error: 'Project reference and provider token are required.' }, { status: 400 });
  }

  try {
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
    
    // The logic for saving to 'user_connected_tables' has been removed as requested.

    return NextResponse.json({ message: "Tables created successfully in your Supabase project!" });

  } catch (err: any) {
    console.error('Error in create-tables endpoint:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred while creating tables.' }, { status: 500 });
  }
}
