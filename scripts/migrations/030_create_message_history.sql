-- Create message history table for tracking all sent messages
CREATE TABLE IF NOT EXISTS message_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  
  -- Message details
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  sender TEXT,
  message_id TEXT, -- Kudosity message ID
  message_ref TEXT, -- Custom reference
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Message metadata
  segments INTEGER DEFAULT 1,
  cost DECIMAL(10, 4),
  encoding TEXT CHECK (encoding IN ('GSM', 'Unicode')),
  track_links BOOLEAN DEFAULT true,
  
  -- Click tracking
  click_count INTEGER DEFAULT 0,
  first_clicked_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  
  -- Campaign association
  campaign_id UUID,
  campaign_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_message_history_user_id ON message_history(user_id);
CREATE INDEX idx_message_history_account_id ON message_history(account_id);
CREATE INDEX idx_message_history_status ON message_history(status);
CREATE INDEX idx_message_history_created_at ON message_history(created_at DESC);
CREATE INDEX idx_message_history_recipient ON message_history(recipient);
CREATE INDEX idx_message_history_message_id ON message_history(message_id);

-- Create link clicks table for tracking individual clicks
CREATE TABLE IF NOT EXISTS message_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES message_history(id) ON DELETE CASCADE,
  
  -- Click details
  url TEXT NOT NULL,
  short_url TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- User information
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  country TEXT,
  city TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for link clicks
CREATE INDEX idx_message_link_clicks_message_id ON message_link_clicks(message_id);
CREATE INDEX idx_message_link_clicks_clicked_at ON message_link_clicks(clicked_at DESC);

-- Create webhook events table for tracking all Kudosity webhook events
CREATE TABLE IF NOT EXISTS kudosity_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_id TEXT UNIQUE,
  
  -- Related message
  message_id TEXT,
  message_history_id UUID REFERENCES message_history(id) ON DELETE SET NULL,
  
  -- Event payload
  payload JSONB NOT NULL,
  
  -- Processing status
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  
  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for webhook events
CREATE INDEX idx_kudosity_webhook_events_event_type ON kudosity_webhook_events(event_type);
CREATE INDEX idx_kudosity_webhook_events_message_id ON kudosity_webhook_events(message_id);
CREATE INDEX idx_kudosity_webhook_events_processed ON kudosity_webhook_events(processed);

-- Add RLS policies
ALTER TABLE message_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudosity_webhook_events ENABLE ROW LEVEL SECURITY;

-- Policies for message_history
CREATE POLICY "Users can view their own messages" ON message_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own messages" ON message_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own messages" ON message_history
  FOR UPDATE USING (user_id = auth.uid());

-- Policies for message_link_clicks (read-only for users)
CREATE POLICY "Users can view clicks for their messages" ON message_link_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_history 
      WHERE message_history.id = message_link_clicks.message_id 
      AND message_history.user_id = auth.uid()
    )
  );

-- Webhook events are system-only (no user policies needed)
