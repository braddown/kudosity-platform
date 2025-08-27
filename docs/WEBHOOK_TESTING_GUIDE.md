# Kudosity Webhook Testing Guide

## ✅ Webhook Setup Complete

Your webhooks are now properly configured and ready to receive events! The system will handle:
- **SMS_STATUS** - Delivery status updates (sent, delivered, failed)
- **SMS_INBOUND** - Incoming SMS replies
- **LINK_HIT** - Link click tracking

## 🚀 Quick Test Instructions

### 1. Verify Webhook Endpoint
```bash
# Test that webhook is accessible
curl -X GET https://kudosity.ngrok.app/kudosity/webhook

# Should return:
# {"status":"ok","message":"Kudosity webhook endpoint is active","actual_handler":"/api/kudosity/webhook"}
```

### 2. Send a Test Message with Link Tracking

1. Navigate to `/test-sms` in your browser
2. Compose a message with a URL:
   ```
   Hi! Check out this link: https://example.com/special-offer
   ```
3. Select a sender ID (61477333222 is configured in your webhooks)
4. Send the message

### 3. Monitor Webhook Events

Watch the console for incoming events:
```bash
# In your Next.js console, you'll see:
Received Kudosity webhook: {
  "event": "SMS_STATUS",
  "status": "SENT",
  "message_ref": "sms_xxx",
  ...
}

# When delivered:
Received Kudosity webhook: {
  "event": "SMS_STATUS", 
  "status": "DELIVERED",
  ...
}

# When link is clicked:
Received Kudosity webhook: {
  "event": "LINK_HIT",
  "url": "https://example.com/special-offer",
  "source_message": {
    "message_ref": "sms_xxx",
    "sender": "61477333222"
  },
  ...
}
```

### 4. Test SMS Reply (Inbound)

When someone replies to your SMS (sent from 61477333222):
```bash
# You'll see:
Received Kudosity webhook: {
  "event": "SMS_INBOUND",
  "sender": "+61438333061",  # Person who replied
  "body": "Thanks for the info!",
  "to": "61477333222",        # Your sender ID
  "last_message": {
    "message_ref": "sms_xxx"   # Reference to original message
  },
  ...
}
```

## 📊 Check Database Records

### View All Webhook Events
```sql
-- See all received webhooks
SELECT event_type, event_id, payload->>'status' as status, received_at 
FROM kudosity_webhook_events 
ORDER BY received_at DESC 
LIMIT 10;
```

### View Message History
```sql
-- See message statuses
SELECT message_ref, recipient, status, sent_at, delivered_at, click_count 
FROM message_history 
WHERE message_type = 'sms'
ORDER BY created_at DESC 
LIMIT 10;
```

### View Link Clicks
```sql
-- See link click details
SELECT m.message_ref, l.url, l.clicked_at, l.ip_address, l.device_type
FROM message_link_clicks l
JOIN message_history m ON l.message_id = m.id
ORDER BY l.clicked_at DESC
LIMIT 10;
```

### View Inbound Messages (Replies)
```sql
-- See SMS replies
SELECT sender, recipient, message, created_at, 
       metadata->>'original_message_ref' as reply_to
FROM message_history 
WHERE message_type = 'inbound'
ORDER BY created_at DESC
LIMIT 10;
```

## 🔍 Webhook Event Formats

### SMS_STATUS Event
```json
{
  "event": "SMS_STATUS",
  "message_id": "msg_abc123",
  "message_ref": "sms_1234567890_xyz",
  "status": "DELIVERED",  // SENT, DELIVERED, FAILED, BOUNCED
  "recipient": "+61438333061",
  "timestamp": "2025-01-25T12:34:56Z",
  "error_code": null,     // Only if failed
  "error_message": null    // Only if failed
}
```

### SMS_INBOUND Event
```json
{
  "event": "SMS_INBOUND",
  "sender": "+61438333061",    // Person who sent the reply
  "to": "61477333222",          // Your sender ID
  "body": "Reply message text",
  "timestamp": "2025-01-25T12:35:00Z",
  "last_message": {
    "message_ref": "sms_1234567890_xyz",  // Original message they're replying to
    "sender": "61477333222"
  }
}
```

### LINK_HIT Event
```json
{
  "event": "LINK_HIT",
  "url": "https://example.com/special-offer",  // Original URL
  "short_url": "https://kudo.si/abc123",       // Shortened tracking URL
  "timestamp": "2025-01-25T12:36:00Z",
  "source_message": {
    "message_ref": "sms_1234567890_xyz",
    "sender": "61477333222"
  },
  "ip_address": "203.45.67.89",
  "user_agent": "Mozilla/5.0...",
  "device_type": "mobile",
  "geo": {
    "country": "AU",
    "city": "Sydney"
  }
}
```

## 🛠️ Troubleshooting

### Webhooks Not Receiving
1. **Check ngrok is running:**
   ```bash
   ps aux | grep ngrok
   # If not running:
   ngrok http 3000 --domain=kudosity.ngrok.app &
   ```

2. **Verify webhook configuration in Kudosity:**
   - URL: `https://kudosity.ngrok.app/kudosity/webhook`
   - Events: SMS_STATUS, SMS_INBOUND, LINK_HIT
   - Filter: sender = 61477333222

3. **Test webhook directly:**
   ```bash
   curl -X POST https://kudosity.ngrok.app/kudosity/webhook \
     -H "Content-Type: application/json" \
     -d '{"event":"SMS_STATUS","status":"DELIVERED","message_ref":"test_123"}'
   ```

### Status Not Updating
- Check console for errors
- Verify `message_ref` matches between send and webhook
- Check database for webhook events: `SELECT * FROM kudosity_webhook_events`

### Link Tracking Not Working
- Ensure `track_links: true` when sending
- Check if URLs in message are being shortened
- Verify shortened URLs redirect properly

## 📈 View Results in UI

1. **Message History:** Navigate to `/campaigns/activity`
   - See all sent messages
   - View delivery status
   - Check click counts

2. **Test SMS Page:** Navigate to `/test-sms`
   - Send test messages
   - Select sender IDs
   - Enable/disable link tracking

## 🎯 Next Steps

The webhook integration is fully functional! You can now:

1. **Send messages** with full tracking
2. **Receive delivery confirmations** in real-time
3. **Track link clicks** with detailed analytics
4. **Handle SMS replies** automatically

For production:
1. Replace ngrok with a permanent webhook URL
2. Implement webhook signature verification
3. Add retry logic for failed webhook processing
4. Set up monitoring and alerting

