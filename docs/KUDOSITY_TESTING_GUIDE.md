# Kudosity SMS Testing Guide

## Prerequisites
- ✅ Kudosity API key configured in `.cursor/mcp.json`
- ✅ ngrok tunnel running at `kudosity.ngrok.app`
- ✅ Development server running on port 3001

## Webhook Configuration

### 1. Set up Kudosity Webhooks
Configure these webhook URLs in your Kudosity account:

- **Webhook URL**: `https://kudosity.ngrok.app/api/kudosity/webhook`
- **Events to subscribe**:
  - `sms.sent` - When message is sent
  - `sms.delivered` - When message is delivered
  - `sms.failed` - When message fails
  - `sms.bounced` - When message bounces
  - `link.clicked` - When a tracking link is clicked

### 2. Test Phone Numbers
For testing, use these formats:
- International: `+447123456789` (UK)
- International: `+61412345678` (Australia)
- International: `+12025551234` (US)

## Testing Flow

### Step 1: Create Test Profiles
1. Go to `/profiles/new`
2. Create a test profile with:
   - Name: "Test User"
   - Mobile: Your actual phone number (for receiving test messages)
   - Email: test@example.com

### Step 2: Create a Test Segment
1. Go to `/segments`
2. Create a segment called "Test Recipients"
3. Add your test profile to this segment

### Step 3: Send a Test Message
1. Go to `/broadcast`
2. Compose your message:
   ```
   Hi {{first_name}}, 
   This is a test message from Kudosity Platform.
   Click here to learn more: https://example.com/test
   ```
3. Select sender ID (or use default)
4. Enable "Track Links" to test click tracking
5. Select the "Test Recipients" audience
6. Click "Send Message"

### Step 4: Monitor Results
1. Check `/campaigns/activity` - Message History tab
2. You should see:
   - Message appears with "Sent" status
   - Delivery status updates via webhooks
   - Click tracking when links are clicked

## Debugging

### Check Logs
Monitor the terminal for:
```bash
# API logs
Sending SMS via Kudosity: { recipient: '+44...', message: 'Hi Test User...' }

# Webhook logs
Received Kudosity webhook: { event_type: 'sms.delivered', ... }
```

### Database Verification
Check the database tables:
```sql
-- Check message history
SELECT * FROM message_history ORDER BY created_at DESC LIMIT 10;

-- Check webhook events
SELECT * FROM kudosity_webhook_events ORDER BY received_at DESC LIMIT 10;

-- Check link clicks
SELECT * FROM message_link_clicks ORDER BY clicked_at DESC LIMIT 10;
```

## Using Kudosity MCP Tools Directly

You can also test the Kudosity MCP tools directly:

### Send SMS
```javascript
// Via MCP tool
mcp_kudosity_send_sms({
  recipient: "+447123456789",
  message: "Test message from MCP",
  sender: "KUDOSITY",
  track_links: true
})
```

### Get SMS Status
```javascript
// Via MCP tool
mcp_kudosity_get_sms({
  message_id: "msg_123456"
})
```

### List SMS Messages
```javascript
// Via MCP tool
mcp_kudosity_list_sms({
  limit: 20,
  status: "delivered"
})
```

## Troubleshooting

### Issue: Messages not sending
- Check API key in `.cursor/mcp.json`
- Verify phone number format (must include country code)
- Check console logs for errors

### Issue: Webhooks not received
- Verify ngrok is running: `ngrok http 3001 --domain=kudosity.ngrok.app`
- Check webhook URL in Kudosity dashboard
- Monitor `kudosity_webhook_events` table

### Issue: Click tracking not working
- Ensure "Track Links" is enabled when sending
- Links must be full URLs (http:// or https://)
- Check `message_link_clicks` table for records

## Test Scenarios

### 1. Basic Send
- Send a simple message to one recipient
- Verify delivery status updates

### 2. Bulk Send
- Create multiple test profiles
- Send to a segment with 5+ recipients
- Monitor rate limiting behavior

### 3. Link Tracking
- Include 2-3 links in message
- Click links from different devices
- Verify click counts update

### 4. Failed Delivery
- Send to invalid number (e.g., +00000000000)
- Verify failed status is recorded

### 5. Message History
- Send 10+ messages
- Test search functionality
- Test status filtering
- Verify statistics are accurate
