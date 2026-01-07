
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

  if (!project_ref || !provider_token) {
    return NextResponse.json({ error: 'Project reference and provider token are required' }, { status: 400 });
  }

  const accessToken = provider_token;

  try {
    // Step 1: Use the provider token to securely fetch the project's service_role key.
    const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${project_ref}/api-keys`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!keysResponse.ok) {
      const errorBody = await keysResponse.json();
      console.error("Failed to fetch API keys:", errorBody);
      throw new Error(`Failed to fetch project API keys. Status: ${keysResponse.status}`);
    }

    const apiKeys = await keysResponse.json();
    const serviceRoleKey = apiKeys.find((key: any) => key.name === 'service_role')?.api_key;

    if (!serviceRoleKey) {
      throw new Error('Service role key not found for the project. Make sure the OAuth app has permission.');
    }

    // Step 2: Create a new, temporary admin client using the fetched service_role key.
    const supabaseUrl = `https://${project_ref}.supabase.co`;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Step 3: Execute the SQL to create the tables.
    const { error: migrationError } = await supabaseAdmin.sql(SQL_MIGRATION);

    if (migrationError) {
      console.error("Supabase Migration Error:", migrationError);
      throw new Error(`SQL Migration failed: ${migrationError.message}`);
    }

    return NextResponse.json({ message: "Tables created successfully!" });

  } catch (err: any) {
    console.error('Error in create-tables endpoint:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred while creating tables.' }, { status: 500 });
  }
}
