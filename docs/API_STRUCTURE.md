# API Structure Documentation

## Kudosity API Routes

### Production Routes (Keep)
- `/api/kudosity/send-sms/` - Main SMS sending endpoint (v2 API)
- `/api/kudosity/senders/` - Fetch available sender IDs from Kudosity
- `/api/kudosity/webhook/` - Production webhook handler for SMS status, inbound, and link hits
- `/api/kudosity/messages/` - Fetch message history
- `/api/kudosity/inbound-messages/` - Fetch inbound messages
- `/api/kudosity/webhook-events/` - Fetch webhook events for monitoring

### Webhook Structure
The main webhook handler at `/app/kudosity/webhook/route.ts` processes:
1. SMS_STATUS - Delivery status updates
2. SMS_INBOUND - Incoming SMS replies
3. LINK_HIT - Link click tracking

## Filter Implementation Notes

### Current Duplication Issue
We have THREE separate filter implementations:
1. `/app/profiles/page.tsx` - Has `renderFieldValueInput()` for the profiles page
2. `/components/ProfileFilterBuilder.tsx` - Used by Contacts component
3. `/components/features/campaigns/BroadcastMessage.tsx` - Has its own filter rendering

### Recommendation
These should be consolidated into a single reusable component to avoid the confusion we experienced where fixing one didn't fix the others.

## Cleaned Up Test Code
The following test/debug routes and pages have been removed:
- Test pages: test-broadcast, test-sms, webhooks-test, debug-account, debug-simple, example pages
- Test API routes: test-account, test-auth, test-db, test-org, debug-account, debug-session
- Kudosity test routes: test-message-storage, test-webhook, send-bulk (deprecated)

## Active Features
- SMS Broadcasting with audience selection
- Webhook processing for replies and link tracking
- Campaign activity tracking
- Profile filtering (needs consolidation)
- Segment management with proper boolean field handling


