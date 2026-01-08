
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// The SQL migration script to create the necessary tables.
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
  // This is the correct, automatic solution.
  // It uses the provider_token to authorize a request against the Supabase Management API.
  // Instead of using an outdated JS library function, it posts the SQL query directly
  // to the correct API endpoint for running database queries.

  const { project_ref, provider_token } = await request.json();

  if (!project_ref || !provider_token) {
    return NextResponse.json({ error: 'Project reference and provider token are required' }, { status: 400 });
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

    if (response.ok) {
      // The query was successful. The body is usually an empty array on success.
      return NextResponse.json({ message: "Tables created successfully!" });
    } else {
      // The API returned an error.
      const errorBody = await response.json();
      console.error("Supabase Query API Error:", errorBody);
      const errorMessage = errorBody.message || `An error occurred with the Supabase Query API. Status: ${response.status}`;
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

  } catch (err: any) {
    console.error('Error calling Supabase Query API:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred while creating tables.' }, { status: 500 });
  }
}