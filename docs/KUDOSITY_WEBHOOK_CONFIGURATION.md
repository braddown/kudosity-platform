# Kudosity Webhook Configuration

## Correct Webhook URL
The webhook URL that should be configured in your Kudosity account is:
```
https://kudosity.ngrok.app/kudosity/webhook
```

**Note:** NOT `/api/kudosity/webhook` - the webhook handler is at `/kudosity/webhook`

## Your Current Webhook Configuration

You have 3 webhooks configured in Kudosity, all filtered by sender `61477333222`:

### 1. SMS Status Webhook
- **Name:** Kudosity Prototype SMS Status
- **Event Type:** SMS_STATUS
- **Filter:** sender = 61477333222
- **URL:** https://kudosity.ngrok.app/kudosity/webhook
- **Purpose:** Receives delivery status updates (sent, delivered, failed, bounced)

### 2. SMS Inbound Webhook
- **Name:** Kudosity Prototype Inbound SMS
- **Event Type:** SMS_INBOUND
- **Filter:** sender = 61477333222
- **URL:** https://kudosity.ngrok.app/kudosity/webhook
- **Purpose:** Receives SMS replies from recipients

### 3. Link Hit Webhook
- **Name:** Kudosity Prototype Link Hit
- **Event Type:** LINK_HIT
- **Filter:** sender = 61477333222
- **URL:** https://kudosity.ngrok.app/kudosity/webhook
- **Purpose:** Receives notifications when tracked links are clicked

## Important Notes

1. **Sender Filter**: All webhooks are filtered to only process events from sender `61477333222`. This means:
   - Only messages sent from this number will trigger webhooks
   - Only replies to this number will be captured
   - Only links in messages from this number will be tracked

2. **ngrok Configuration**: 
   - Domain: `kudosity.ngrok.app`
   - Local port: 3000
   - Command: `ngrok http 3000 --domain=kudosity.ngrok.app`

3. **Webhook Handler**: Located at `app/kudosity/webhook/route.ts`
   - Uses Supabase service role for database access (no auth required)
   - Stores all events in `kudosity_webhook_events` table
   - Processes events based on type

## API Endpoints (For Dashboard)

These are internal API endpoints used by the dashboard to fetch data:

- `/api/kudosity/webhook-events` - Fetches webhook events for display
- `/api/kudosity/messages` - Fetches message history
- `/api/kudosity/inbound-messages` - Fetches inbound SMS messages

These are NOT webhook endpoints - they are GET endpoints for the dashboard UI.

## Testing Webhooks

### Manual Testing
```bash
# Test SMS_STATUS
curl -X POST https://kudosity.ngrok.app/kudosity/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "SMS_STATUS",
    "message_id": "test-123",
    "status": "DELIVERED",
    "sender": "61477333222",
    "recipient": "61438333061"
  }'

# Test SMS_INBOUND
curl -X POST https://kudosity.ngrok.app/kudosity/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "SMS_INBOUND",
    "sender": "61438333061",
    "recipient": "61477333222",
    "body": "This is a reply",
    "message_id": "inbound-123"
  }'

# Test LINK_HIT
curl -X POST https://kudosity.ngrok.app/kudosity/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "LINK_HIT",
    "url": "https://example.com",
    "source_message": {
      "message_id": "msg-123",
      "sender": "61477333222"
    }
  }'
```

### Monitoring
- Dashboard: http://localhost:3000/webhooks-test
- Database: Query `kudosity_webhook_events` table
- Console: Check server logs for webhook processing

## Troubleshooting

1. **500 Errors**: Usually means database connection issue or malformed payload
2. **No Events Showing**: Check sender filter matches the number you're using
3. **ngrok Not Working**: Restart with `pkill ngrok && ngrok http 3000 --domain=kudosity.ngrok.app`


