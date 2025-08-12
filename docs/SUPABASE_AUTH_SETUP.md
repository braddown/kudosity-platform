# Supabase Auth Configuration

## Important: Redirect URL Configuration

The Supabase project authentication settings need to be updated to support local development and production deployments.

### Required Redirect URLs

You need to add these URLs to your Supabase project's Auth settings:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/hgfsmeudhvsvwmzxexmv/auth/url-configuration

2. **Add these Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local development)
   - `http://localhost:3001/auth/callback` (alternate port)
   - `https://your-production-domain.com/auth/callback` (for production)

3. **Site URL**: Set to `http://localhost:3000` for development

### Current Issue

The project is currently redirecting to `https://kudosity-proto-kudosity-team.vercel.app` which is the wrong project. This needs to be fixed in the Supabase dashboard.

### OAuth Provider Setup

If you want to enable OAuth providers:

1. **Google OAuth**:
   - Create OAuth credentials in Google Cloud Console
   - Add client ID and secret to Supabase Auth providers

2. **GitHub OAuth**:
   - Create OAuth App in GitHub settings
   - Add client ID and secret to Supabase Auth providers

### Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hgfsmeudhvsvwmzxexmv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Testing Authentication

1. Start the development server: `npm run dev`
2. Navigate to: `http://localhost:3000/auth/signup`
3. Create a test account
4. Check email for verification link
5. After verification, you'll be redirected to organization setup

### Troubleshooting

If you're being redirected to the wrong domain:
1. Check Supabase Dashboard > Authentication > URL Configuration
2. Ensure "Site URL" is set correctly
3. Verify redirect URLs include your local development URL
4. Clear browser cookies and try again

