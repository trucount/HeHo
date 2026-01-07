
import { createServerClient } from '@supabase/ssr';
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

  if (!project_ref) {
    return NextResponse.json({ error: 'Project reference is required' }, { status: 400 });
  }

  if (!provider_token) {
    return NextResponse.json({ error: 'Supabase access token not found.' }, { status: 400 });
  }

  const accessToken = provider_token;

  try {
    // Corrected the API endpoint from /database/migrate to /sql
    const response = await fetch(`https://api.supabase.com/v1/projects/${project_ref}/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      // Corrected the request body to use the 'query' field
      body: JSON.stringify({ query: SQL_MIGRATION })
    });

    // The /sql endpoint returns 200 OK with an empty response on success
    // so we can't parse it as JSON if the request was successful.
    if (response.ok) {
      return NextResponse.json({ message: "Tables created successfully!" });
    } else {
      const result = await response.json();
      console.error("Supabase SQL API Error:", result);
      const errorMessage = result.error?.message || `An error occurred with the Supabase SQL API. Status: ${response.status}`;
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

  } catch (err: any) {
    console.error('Error calling Supabase SQL API:', err);
    return NextResponse.json({ error: 'An unexpected error occurred while creating tables.' }, { status: 500 });
  }
}
