
CREATE TABLE IF NOT EXISTS public.user_connected_tables (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    table_name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT user_connected_tables_user_id_table_name_key UNIQUE (user_id, table_name)
);

COMMENT ON TABLE public.user_connected_tables IS '''Tracks which tables from a user'''''s Supabase project are connected to the app.''';
