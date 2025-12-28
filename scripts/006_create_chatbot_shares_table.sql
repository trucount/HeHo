-- Create chatbot shares table for shareable links
CREATE TABLE IF NOT EXISTS chatbot_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  share_token VARCHAR(32) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Enable RLS
ALTER TABLE chatbot_shares ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view public shares"
  ON chatbot_shares FOR SELECT
  USING (true);

CREATE POLICY "Users can create shares for their chatbots"
  ON chatbot_shares FOR INSERT
  WITH CHECK (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );
