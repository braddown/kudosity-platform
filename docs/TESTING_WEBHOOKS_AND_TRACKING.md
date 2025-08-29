# Testing Webhooks and Message Tracking

## Overview
The Kudosity integration now supports:
- SMS delivery status tracking (sent, delivered, failed, bounced)
- Link click tracking
- Reply handling (when configured)
- Real-time webhook processing

## Prerequisites

1. **Ngrok Setup**
   - Domain: `kudosity.ngrok.app`
   - Local port: 3000
   - Command: `ngrok http 3000 --domain=kudosity.ngrok.app`

2. **Webhook URL**
   - Your webhook endpoint: `https://kudosity.ngrok.app/api/kudosity/webhook`
   - This needs to be configured in your Kudosity account

## Testing Process

### Step 1: Configure Kudosity Webhook

You need to configure the webhook URL in your Kudosity account:

1. Log into your Kudosity account dashboard
2. Navigate to Settings → Webhooks or API Settings
3. Add webhook URL: `https://kudosity.ngrok.app/api/kudosity/webhook`
4. Select events to receive:
   - SMS Sent
   - SMS Delivered
   - SMS Failed/Bounced
   - Link Clicked
   - SMS Reply Received

### Step 2: Send a Test Message with Link Tracking

1. Navigate to `/test-sms` in your application
2. Compose a message that includes a URL (e.g., `Visit https://example.com for more info`)
3. Ensure "Track Links" is enabled (it is by default)
4. Send the message

When you send a message with link tracking enabled:
- Kudosity will automatically shorten the URL
- The shortened URL will track clicks
- Each click will trigger a webhook event

### Step 3: Monitor Webhook Events

#### In the Console
Watch the Next.js console for incoming webhook events:
```bash
# You should see logs like:
Received Kudosity webhook: { event_type: 'sms.sent', message_id: '...', ... }
Received Kudosity webhook: { event_type: 'sms.delivered', message_id: '...', ... }
Received Kudosity webhook: { event_type: 'link.clicked', url: '...', ... }
```

#### In the Database
Check the webhook events table:
```sql
-- View all webhook events
SELECT * FROM kudosity_webhook_events ORDER BY received_at DESC;

-- View message status updates
SELECT id, message_id, status, sent_at, delivered_at, click_count 
FROM message_history 
ORDER BY created_at DESC;

-- View link clicks
SELECT * FROM message_link_clicks ORDER BY clicked_at DESC;
```

### Step 4: Test Link Clicking

1. After sending a message with a link, the recipient will receive a shortened URL
2. When they click the link:
   - They'll be redirected to the original URL
   - A webhook event will be sent to your application
   - The click will be recorded in `message_link_clicks` table
   - The `click_count` in `message_history` will increment

### Step 5: View Message History

Navigate to `/campaigns/activity` to see:
- All sent messages
- Delivery status
- Click counts
- Timestamps for sent/delivered/clicked events

## Testing Scenarios

### Scenario 1: Successful Delivery with Link Click
1. Send message with URL to valid number
2. Wait for 'delivered' status webhook
3. Click the shortened link in the SMS
4. Verify click is recorded

### Scenario 2: Failed Delivery
1. Send message to invalid number (e.g., 61400000000)
2. Wait for 'failed' or 'bounced' webhook
3. Verify status is updated in message history

### Scenario 3: Multiple Link Clicks
1. Send message with multiple URLs
2. Click each link
3. Verify each click is tracked separately

## Troubleshooting

### Webhooks Not Receiving
1. Check ngrok is running: `ps aux | grep ngrok`
2. Verify webhook URL in Kudosity account
3. Check Next.js console for errors
4. Verify database tables exist (run migration 030)

### Link Tracking Not Working
1. Ensure `track_links: true` in send request
2. Check if URLs in message are being shortened
3. Verify webhook events for 'link.clicked' type

### Database Not Updating
1. Check Supabase connection
2. Verify tables exist:
   - `message_history`
   - `message_link_clicks`
   - `kudosity_webhook_events`
3. Check console for database errors

## Webhook Event Types

| Event Type | Description | Updates |
|------------|-------------|---------|
| `sms.sent` | Message accepted by carrier | Sets status to 'sent' |
| `sms.delivered` | Message delivered to device | Sets status to 'delivered' |
| `sms.failed` | Message failed to send | Sets status to 'failed' |
| `sms.bounced` | Number invalid/unreachable | Sets status to 'bounced' |
| `link.clicked` | Recipient clicked tracked link | Increments click_count, records click details |

## Reply Handling

SMS replies are typically handled through:
1. Dedicated reply numbers (virtual mobile numbers)
2. Webhook events with type `sms.reply` or `sms.received`
3. The reply webhook includes:
   - Original message reference
   - Reply content
   - Sender number
   - Timestamp

Note: Reply handling requires additional Kudosity account configuration for inbound SMS.

## Next Steps

1. **Production Setup**:
   - Replace ngrok with production webhook URL
   - Implement webhook signature verification
   - Add retry logic for failed webhook processing

2. **Enhanced Features**:
   - Add reply auto-responders
   - Implement conversation threading
   - Add analytics dashboard for click tracking
   - Set up alerting for failed messages

3. **Testing Automation**:
   - Create automated tests for webhook handlers
   - Add monitoring for webhook processing
   - Implement health checks for integration


