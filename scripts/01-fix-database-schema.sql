-- Fix usage table - add missing columns and constraints
ALTER TABLE public.usage 
ADD COLUMN IF NOT EXISTS month TEXT;

-- Update existing records with month value
UPDATE public.usage 
SET month = TO_CHAR(created_at, 'YYYY-MM') 
WHERE month IS NULL;

-- Add deploy_url to chatbots table
ALTER TABLE public.chatbots 
ADD COLUMN IF NOT EXISTS deploy_url TEXT;

-- Add deployed flag if not exists
ALTER TABLE public.chatbots 
ADD COLUMN IF NOT EXISTS deployed BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_usage_user_created_at ON public.usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_month ON public.usage(month, user_id);
CREATE INDEX IF NOT EXISTS idx_chatbots_user_deployed ON public.chatbots(user_id, deployed);

-- Ensure RLS is enabled
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'usage' AND policyname = 'Users can view own usage'
  ) THEN
    CREATE POLICY "Users can view own usage" ON public.usage
    FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'usage' AND policyname = 'Users can insert own usage'
  ) THEN
    CREATE POLICY "Users can insert own usage" ON public.usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'usage' AND policyname = 'Users can update own usage'
  ) THEN
    CREATE POLICY "Users can update own usage" ON public.usage
    FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chatbots' AND policyname = 'Users can view own chatbots'
  ) THEN
    CREATE POLICY "Users can view own chatbots" ON public.chatbots
    FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chatbots' AND policyname = 'Users can insert chatbots'
  ) THEN
    CREATE POLICY "Users can insert chatbots" ON public.chatbots
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chatbots' AND policyname = 'Users can update own chatbots'
  ) THEN
    CREATE POLICY "Users can update own chatbots" ON public.chatbots
    FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chatbots' AND policyname = 'Users can delete own chatbots'
  ) THEN
    CREATE POLICY "Users can delete own chatbots" ON public.chatbots
    FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
