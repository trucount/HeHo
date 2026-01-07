
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const EDITABLE_TABLES = ['products', 'leads', 'customer_queries', 'sales', 'chat_history'];

async function getSupabaseClient() {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    const { data: userDetails, error: detailsError } = await supabase
        .from('users')
        .select('supabase_url, supabase_key_encrypted')
        .eq('id', user.id)
        .single();

    if (detailsError || !userDetails || !userDetails.supabase_url || !userDetails.supabase_key_encrypted) {
        throw new Error('Supabase credentials not found.');
    }

    return createClient(userDetails.supabase_url, userDetails.supabase_key_encrypted);
}

export async function POST(request: Request) {
    try {
        const { tableName, rowId, rowData, primaryKey } = await request.json();

        if (!tableName || !EDITABLE_TABLES.includes(tableName)) {
            return NextResponse.json({ error: 'Invalid or non-editable table specified' }, { status: 400 });
        }

        if (!rowId || !primaryKey) {
            return NextResponse.json({ error: 'Row identifier (rowId) and primary key name are required' }, { status: 400 });
        }

        const userSupabase = await getSupabaseClient();
        
        // The primary key and created_at should not be changed.
        const cleanRowData = { ...rowData };
        delete cleanRowData[primaryKey];
        delete cleanRowData.created_at;

        const { data, error } = await userSupabase
            .from(tableName)
            .update(cleanRowData)
            .eq(primaryKey, rowId)
            .select();

        if (error) throw new Error(error.message);

        return NextResponse.json({ message: 'Row updated successfully', data });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
