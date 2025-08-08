# Deployment Guide

## Vercel Deployment

### Prerequisites
- Vercel account
- Supabase project set up
- GitHub repository

### Steps

1. **Connect Repository**
   - Go to Vercel dashboard
   - Click "New Project"
   - Import your GitHub repository

2. **Environment Variables**
   Add these in Vercel project settings:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   \`\`\`

3. **Database Setup**
   - Create tables in Supabase (see README.md)
   - Set up Row Level Security if needed

4. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Check deployment logs for any issues

### Troubleshooting

- Ensure all environment variables are set
- Check Supabase connection
- Verify database tables exist
- Review build logs for errors

## Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

Follow similar steps for environment variables and database setup.
