-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  agent_id UUID,
  status TEXT DEFAULT 'Active',
  channel TEXT DEFAULT 'SMS',
  priority TEXT DEFAULT 'Medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id),
  content TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'inbound' or 'outbound'
  sender_id UUID,
  recipient_id UUID,
  status TEXT DEFAULT 'Sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
-- First, create some sample profiles
INSERT INTO profiles (first_name, last_name, email, phone)
VALUES 
  ('John', 'Doe', 'john.doe@example.com', '+1234567890'),
  ('Jane', 'Smith', 'jane.smith@example.com', '+1987654321'),
  ('Bob', 'Johnson', 'bob.johnson@example.com', '+1122334455')
ON CONFLICT DO NOTHING;

-- Create some agent profiles
INSERT INTO profiles (first_name, last_name, email, phone)
VALUES 
  ('Agent', 'Smith', 'agent.smith@company.com', '+1999888777'),
  ('Support', 'Team', 'support@company.com', '+1888777666')
ON CONFLICT DO NOTHING;

-- Get profile IDs for reference
DO $$
DECLARE
  profile1_id UUID;
  profile2_id UUID;
  profile3_id UUID;
  agent1_id UUID;
  agent2_id UUID;
  chat1_id UUID;
  chat2_id UUID;
  chat3_id UUID;
BEGIN
  -- Get profile IDs
  SELECT id INTO profile1_id FROM profiles WHERE email = 'john.doe@example.com' LIMIT 1;
  SELECT id INTO profile2_id FROM profiles WHERE email = 'jane.smith@example.com' LIMIT 1;
  SELECT id INTO profile3_id FROM profiles WHERE email = 'bob.johnson@example.com' LIMIT 1;
  SELECT id INTO agent1_id FROM profiles WHERE email = 'agent.smith@company.com' LIMIT 1;
  SELECT id INTO agent2_id FROM profiles WHERE email = 'support@company.com' LIMIT 1;
  
  -- Create chats
  INSERT INTO chats (profile_id, agent_id, status, channel, priority)
  VALUES 
    (profile1_id, agent1_id, 'Active', 'SMS', 'High'),
    (profile2_id, agent2_id, 'Active', 'Email', 'Medium'),
    (profile3_id, agent1_id, 'Closed', 'SMS', 'Low')
  RETURNING id INTO chat1_id;
  
  -- Get chat IDs
  SELECT id INTO chat1_id FROM chats WHERE profile_id = profile1_id LIMIT 1;
  SELECT id INTO chat2_id FROM chats WHERE profile_id = profile2_id LIMIT 1;
  SELECT id INTO chat3_id FROM chats WHERE profile_id = profile3_id LIMIT 1;
  
  -- Add messages to first chat
  INSERT INTO messages (chat_id, content, direction, sender_id, recipient_id, status, created_at)
  VALUES
    (chat1_id, 'Hello, I need help with my account', 'inbound', profile1_id, agent1_id, 'Delivered', NOW() - INTERVAL '2 hours'),
    (chat1_id, 'Hi John, I''d be happy to help. What seems to be the issue?', 'outbound', agent1_id, profile1_id, 'Delivered', NOW() - INTERVAL '1 hour 55 minutes'),
    (chat1_id, 'I can''t access my dashboard', 'inbound', profile1_id, agent1_id, 'Delivered', NOW() - INTERVAL '1 hour 50 minutes'),
    (chat1_id, 'Let me check that for you. Can you try clearing your browser cache?', 'outbound', agent1_id, profile1_id, 'Delivered', NOW() - INTERVAL '1 hour 45 minutes');
  
  -- Add messages to second chat
  INSERT INTO messages (chat_id, content, direction, sender_id, recipient_id, status, created_at)
  VALUES
    (chat2_id, 'I''d like to upgrade my subscription', 'inbound', profile2_id, agent2_id, 'Delivered', NOW() - INTERVAL '3 hours'),
    (chat2_id, 'We''d be happy to help you upgrade. Which plan are you interested in?', 'outbound', agent2_id, profile2_id, 'Delivered', NOW() - INTERVAL '2 hours 50 minutes');
  
  -- Add messages to third chat
  INSERT INTO messages (chat_id, content, direction, sender_id, recipient_id, status, created_at)
  VALUES
    (chat3_id, 'Is there a mobile app available?', 'inbound', profile3_id, agent1_id, 'Delivered', NOW() - INTERVAL '2 days'),
    (chat3_id, 'Yes, we have apps for both iOS and Android. You can download them from the app stores.', 'outbound', agent1_id, profile3_id, 'Delivered', NOW() - INTERVAL '1 day 23 hours'),
    (chat3_id, 'Great, thanks!', 'inbound', profile3_id, agent1_id, 'Delivered', NOW() - INTERVAL '1 day 22 hours');
END $$;

-- Show what was created
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'chats' as table_name, COUNT(*) as count FROM chats
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as count FROM messages;
