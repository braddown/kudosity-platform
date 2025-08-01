-- First, let's create the proper foreign key relationships for the chat system

-- Add foreign key constraints to the chats table
ALTER TABLE chats 
ADD CONSTRAINT chats_contact_id_fkey 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE chats 
ADD CONSTRAINT chats_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add foreign key constraints to messages_sent table
ALTER TABLE messages_sent 
ADD CONSTRAINT messages_sent_chat_id_fkey 
FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE messages_sent 
ADD CONSTRAINT messages_sent_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE messages_sent 
ADD CONSTRAINT messages_sent_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES contacts(id) ON DELETE CASCADE;

-- Add foreign key constraints to messages_received table
ALTER TABLE messages_received 
ADD CONSTRAINT messages_received_chat_id_fkey 
FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE messages_received 
ADD CONSTRAINT messages_received_contact_id_fkey 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE messages_received 
ADD CONSTRAINT messages_received_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_contact_id ON chats(contact_id);
CREATE INDEX IF NOT EXISTS idx_chats_profile_id ON chats(profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_chat_id ON messages_sent(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_received_chat_id ON messages_received(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_created_at ON messages_sent(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_received_received_at ON messages_received(received_at);

-- Create some sample data to test with
-- First, ensure we have some contacts
INSERT INTO contacts (id, first_name, last_name, email, phone, status, created_at) 
VALUES 
  ('contact-1', 'John', 'Doe', 'john.doe@example.com', '+1234567890', 'Active', NOW()),
  ('contact-2', 'Jane', 'Smith', 'jane.smith@example.com', '+1234567891', 'Active', NOW()),
  ('contact-3', 'Bob', 'Johnson', 'bob.johnson@example.com', '+1234567892', 'Active', NOW())
ON CONFLICT (id) DO NOTHING;

-- Ensure we have some profiles (staff/agents)
INSERT INTO profiles (id, first_name, last_name, email, role, status, created_at)
VALUES 
  ('profile-1', 'Agent', 'Smith', 'agent.smith@company.com', 'staff', 'Active', NOW()),
  ('profile-2', 'Support', 'Team', 'support@company.com', 'staff', 'Active', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create some chats
INSERT INTO chats (id, contact_id, profile_id, status, channel, priority, created_at, updated_at)
VALUES 
  ('chat-1', 'contact-1', 'profile-1', 'Active', 'SMS', 'Medium', NOW(), NOW()),
  ('chat-2', 'contact-2', 'profile-1', 'Active', 'SMS', 'High', NOW(), NOW()),
  ('chat-3', 'contact-3', 'profile-2', 'Waiting', 'SMS', 'Low', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Add some sent messages
INSERT INTO messages_sent (id, chat_id, sender_id, recipient_id, message_content, type, channel, status, created_at)
VALUES 
  ('msg-sent-1', 'chat-1', 'profile-1', 'contact-1', 'Hello John! How can I help you today?', 'Chat', 'SMS', 'Delivered', NOW() - INTERVAL '2 hours'),
  ('msg-sent-2', 'chat-1', 'profile-1', 'contact-1', 'Thanks for your question. Let me check that for you.', 'Chat', 'SMS', 'Delivered', NOW() - INTERVAL '1 hour'),
  ('msg-sent-3', 'chat-2', 'profile-1', 'contact-2', 'Hi Jane! Welcome to our service.', 'Chat', 'SMS', 'Delivered', NOW() - INTERVAL '3 hours'),
  ('msg-sent-4', 'chat-3', 'profile-2', 'contact-3', 'Hello Bob, thanks for reaching out!', 'Chat', 'SMS', 'Delivered', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- Add some received messages
INSERT INTO messages_received (id, chat_id, contact_id, message_content, sentiment, received_at)
VALUES 
  ('msg-recv-1', 'chat-1', 'contact-1', 'Hi there! I need help with my account.', 'neutral', NOW() - INTERVAL '2 hours 30 minutes'),
  ('msg-recv-2', 'chat-1', 'contact-1', 'I cant seem to log in to my dashboard.', 'negative', NOW() - INTERVAL '2 hours 15 minutes'),
  ('msg-recv-3', 'chat-1', 'contact-1', 'Perfect, thank you so much for your help!', 'positive', NOW() - INTERVAL '45 minutes'),
  ('msg-recv-4', 'chat-2', 'contact-2', 'Thank you! I have a question about billing.', 'neutral', NOW() - INTERVAL '3 hours 15 minutes'),
  ('msg-recv-5', 'chat-3', 'contact-3', 'Hey, I need support with my recent order.', 'neutral', NOW() - INTERVAL '45 minutes')
ON CONFLICT (id) DO NOTHING;

-- Update chats with last message info
UPDATE chats SET 
  last_message_id = 'msg-recv-3',
  updated_at = NOW() - INTERVAL '45 minutes'
WHERE id = 'chat-1';

UPDATE chats SET 
  last_message_id = 'msg-recv-4', 
  updated_at = NOW() - INTERVAL '3 hours 15 minutes'
WHERE id = 'chat-2';

UPDATE chats SET 
  last_message_id = 'msg-recv-5',
  updated_at = NOW() - INTERVAL '45 minutes'
WHERE id = 'chat-3';
