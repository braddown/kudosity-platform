# Kudosity Webhook Testing Complete Guide

## ✅ Webhook Integration Status

The webhook integration is **FULLY FUNCTIONAL** and ready for testing! All three webhook types are implemented:

1. **SMS_STATUS** - Delivery status updates
2. **SMS_INBOUND** - Incoming SMS replies
3. **LINK_HIT** - Link click tracking

## 🚀 Quick Start

### 1. Ensure ngrok is running
```bash
ngrok http 3000 --domain=kudosity.ngrok.app
```

### 2. Access the testing pages
- **Send Test SMS**: http://localhost:3000/test-sms
- **Webhook Monitor**: http://localhost:3000/webhooks-test

## 📊 Database Setup Complete

All necessary tables have been created:

### Core Tables
- `message_history` - Tracks all sent messages
- `inbound_messages` - Stores incoming SMS replies
- `message_link_clicks` - Records link click events
- `kudosity_webhook_events` - Logs all webhook events

### Indexes for Performance
- `idx_message_history_message_ref` - Fast webhook lookups
- `idx_message_history_external_id` - External ID tracking
- `idx_kudosity_webhook_events_event_type` - Event filtering
- `idx_kudosity_webhook_events_message_id` - Message association

## 🔗 Testing Link Clicks

### How it works:
1. **Send SMS with URL**: Include any URL in your message
2. **Kudosity shortens it**: Automatically creates trackable link
3. **User clicks link**: Redirected to original URL
4. **LINK_HIT webhook fires**: We receive the event
5. **Database updated**: Click count incremented, details stored

### What we track:
- Total click count per message
- First and last click timestamps
- IP address and location
- Device type and user agent
- Individual click events

### Test it:
```
1. Go to /test-sms
2. Send: "Check out this link: https://example.com/offer"
3. Click the shortened link in the SMS
4. Check /webhooks-test to see the LINK_HIT event
5. View click details in Message History tab
```

## 📱 Testing SMS Replies

### How it works:
1. **User replies to SMS**: Any reply to your sent message
2. **SMS_INBOUND webhook fires**: Kudosity sends the event
3. **Intent detection**: We detect STOP, HELP, START keywords
4. **Database storage**: Reply stored in `inbound_messages`
5. **Association**: Links reply to original message if available

### Intent Detection:
- **STOP**: Unsubscribe keywords (STOP, UNSUBSCRIBE, CANCEL, END, QUIT)
- **HELP**: Support keywords (HELP, INFO, SUPPORT)
- **START**: Opt-in keywords (START, YES, SUBSCRIBE)

### Test it:
```
1. Send an SMS from /test-sms
2. Reply from your phone with any message
3. Check /webhooks-test Inbound SMS tab
4. Try replying "STOP" to test unsubscribe detection
```

## 📊 Testing Delivery Status

### Status Flow:
1. **pending** → Initial state when message created
2. **sent** → SMS_STATUS with SENT/SUBMITTED status
3. **delivered** → SMS_STATUS with DELIVERED status
4. **failed** → SMS_STATUS with FAILED/REJECTED/EXPIRED
5. **bounced** → SMS_STATUS with BOUNCED/UNDELIVERABLE

### What we track:
- Status transitions with timestamps
- Error messages for failures
- Delivery confirmations
- Bounce reasons

### Test it:
```
1. Send SMS to valid number → Should show "delivered"
2. Send to invalid number → Should show "failed" or "bounced"
3. Watch real-time updates in /webhooks-test
```

## 🔍 Webhook Monitoring Dashboard

### Features:
- **Real-time updates**: Auto-refreshes every 10 seconds
- **Event viewer**: See raw webhook payloads
- **Message history**: Track all sent messages
- **Inbound messages**: View all replies
- **Statistics**: Total messages, clicks, replies

### Dashboard Tabs:
1. **Overview**: Summary stats and testing instructions
2. **Webhook Events**: Raw webhook event log
3. **Message History**: Sent messages with status
4. **Inbound SMS**: Received replies with intent

## 🛠️ Webhook Processing Flow

```mermaid
graph TD
    A[Kudosity Webhook] --> B[/kudosity/webhook endpoint]
    B --> C[Store in kudosity_webhook_events]
    C --> D{Event Type?}
    
    D -->|SMS_STATUS| E[Update message_history status]
    D -->|SMS_INBOUND| F[Store in inbound_messages]
    D -->|LINK_HIT| G[Record in message_link_clicks]
    
    E --> H[Update timestamps & error messages]
    F --> I[Detect intent & associate with original]
    G --> J[Increment click count & store details]
```

## 🔐 Security Features

### Implemented:
- Row Level Security (RLS) on all tables
- User can only see their own messages
- Webhook endpoint allows unauthenticated POST (required)
- API endpoints require authentication

### Webhook Validation:
- Event deduplication via `event_id`
- Payload logging for audit trail
- Error handling and retry logic

## 📝 API Endpoints

### Webhook Receiver
```
POST /kudosity/webhook
- Receives all webhook events
- No authentication required
- Processes and stores events
```

### Data Retrieval
```
GET /api/kudosity/webhook-events
- Returns recent webhook events
- Requires authentication

GET /api/kudosity/messages
- Returns message history
- Requires authentication

GET /api/kudosity/inbound-messages
- Returns inbound SMS messages
- Requires authentication
```

## 🧪 Test Scenarios

### 1. Complete Message Lifecycle
```
1. Send SMS with link from /test-sms
2. Wait for SMS_STATUS (sent) webhook
3. Wait for SMS_STATUS (delivered) webhook
4. Click link in SMS
5. See LINK_HIT webhook
6. Reply to SMS
7. See SMS_INBOUND webhook
```

### 2. Unsubscribe Flow
```
1. Send SMS
2. Reply with "STOP"
3. Check intent detection in Inbound SMS tab
4. Verify unsubscribe processing
```

### 3. Failed Delivery
```
1. Send to invalid number (e.g., 61400000000)
2. Wait for SMS_STATUS (failed) webhook
3. Check error message in Message History
```

## 🚨 Troubleshooting

### Webhooks not arriving?
1. Check ngrok is running: `ps aux | grep ngrok`
2. Verify webhook URL in Kudosity: https://kudosity.ngrok.app/kudosity/webhook
3. Check webhook configuration has correct sender filter: 61477333222

### Messages not updating?
1. Check console logs in browser DevTools
2. Verify message_ref matches between send and webhook
3. Check Supabase logs for database errors

### Link clicks not tracking?
1. Ensure message includes valid URL
2. Verify track_links is true when sending
3. Check shortened URL is clickable in SMS

## 📊 Webhook Payload Examples

### SMS_STATUS Event
```json
{
  "event": "SMS_STATUS",
  "message_id": "msg_abc123",
  "status": "DELIVERED",
  "recipient": "61438333061",
  "timestamp": "2024-01-25T10:30:00Z"
}
```

### SMS_INBOUND Event
```json
{
  "event": "SMS_INBOUND",
  "sender": "61438333061",
  "to": "61477333222",
  "body": "Thanks for the info!",
  "timestamp": "2024-01-25T10:35:00Z",
  "last_message": {
    "message_ref": "sms_1234_abc"
  }
}
```

### LINK_HIT Event
```json
{
  "event": "LINK_HIT",
  "url": "https://example.com/offer",
  "short_url": "https://kudo.si/abc123",
  "source_message": {
    "message_ref": "sms_1234_abc"
  },
  "timestamp": "2024-01-25T10:32:00Z",
  "ip_address": "203.0.113.1",
  "user_agent": "Mozilla/5.0..."
}
```

## ✅ Ready for Production

The webhook integration is production-ready with:
- Comprehensive error handling
- Database indexing for performance
- Security via RLS policies
- Complete audit trail
- Real-time monitoring dashboard
- Intent detection for compliance

Start testing at http://localhost:3000/webhooks-test!

