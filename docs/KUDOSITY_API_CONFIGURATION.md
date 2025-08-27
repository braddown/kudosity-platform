# Kudosity API Configuration

## Overview
All Kudosity API access in this application uses environment variables for credentials. No API keys or secrets are hardcoded in the source code.

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Required for all Kudosity functionality
KUDOSITY_API_KEY=your_kudosity_api_key
KUDOSITY_API_SECRET=your_kudosity_api_secret
```

## Optional Environment Variables

```env
# Default sender configuration
NEXT_PUBLIC_KUDOSITY_DEFAULT_SENDER=61477333222
NEXT_PUBLIC_KUDOSITY_ALPHANUMERIC_SENDER=YOURBRAND

# If you need client-side access (not recommended for security)
NEXT_PUBLIC_KUDOSITY_API_KEY=your_kudosity_api_key
NEXT_PUBLIC_KUDOSITY_API_SECRET=your_kudosity_api_secret
```

## Where Kudosity API is Used

1. **`/api/kudosity/senders`** - Fetches available sender IDs
   - Uses: `KUDOSITY_API_KEY`, `KUDOSITY_API_SECRET`
   - API: Legacy API (https://api.transmitsms.com)

2. **`/api/kudosity/send-sms`** - Sends individual SMS messages
   - Uses: `KUDOSITY_API_KEY`
   - API: v2 API (https://api.transmitmessage.com)

3. **`/api/kudosity/send-bulk`** - Sends bulk SMS messages
   - Uses: `KUDOSITY_API_KEY`
   - API: v2 API (https://api.transmitmessage.com)

4. **`lib/api/kudosity-api.ts`** - Client library (not currently used)
   - Uses: `KUDOSITY_API_KEY`, `KUDOSITY_API_SECRET`
   - Supports both Legacy and v2 APIs

## Changing Kudosity Accounts

To switch to a different Kudosity account:

1. **Update `.env.local`**:
   ```env
   KUDOSITY_API_KEY=your_new_api_key
   KUDOSITY_API_SECRET=your_new_api_secret
   ```

2. **Restart your development server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Start it again
   npm run dev
   ```

3. **Update webhooks in Kudosity dashboard**:
   - Make sure your new account has webhooks configured to point to your ngrok URL
   - Webhook URL: `https://kudosity.ngrok.app/kudosity/webhook`
   - Configure for: SMS_STATUS, SMS_INBOUND, LINK_HIT

## Security Notes

- **Never commit `.env.local`** to version control
- API keys without `NEXT_PUBLIC_` prefix are only available server-side (more secure)
- API keys with `NEXT_PUBLIC_` prefix are exposed to the client (use with caution)
- All API endpoints validate that credentials are present before making requests

## Error Handling

If API credentials are missing or invalid, the application will:
- Return clear error messages indicating which credentials are missing
- Log errors to the server console for debugging
- Show user-friendly error messages in the UI

## Testing

After changing credentials:
1. Go to `/broadcast` and check if sender IDs load
2. Try sending a test message
3. Check `/test-sms` for individual message testing
4. Verify webhooks are working at `/webhooks-test`

