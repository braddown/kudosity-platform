-- Check all webhook events
SELECT 
  event_type,
  message_id,
  processed,
  payload->>'status' as status,
  payload->>'sender' as sender,
  payload->>'recipient' as recipient,
  payload->>'body' as body,
  received_at
FROM kudosity_webhook_events 
ORDER BY received_at DESC 
LIMIT 20;

-- Check message delivery status updates
SELECT 
  id,
  recipient,
  sender,
  status,
  sent_at,
  delivered_at,
  failed_at,
  error_message,
  click_count
FROM message_history 
WHERE user_id IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;

-- Check inbound messages (replies)
SELECT 
  sender,
  recipient,
  message,
  received_at,
  intent,
  processed
FROM inbound_messages 
ORDER BY received_at DESC 
LIMIT 10;

-- Check link clicks
SELECT 
  message_id,
  url,
  clicked_at,
  ip_address,
  user_agent,
  device_type,
  location
FROM message_link_clicks 
ORDER BY clicked_at DESC 
LIMIT 10;

