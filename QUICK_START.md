# Quick Start Guide

## After Forking

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Set up environment variables:**
   Create a `.env.local` file with:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   \`\`\`

3. **Run one-time setup:**
   \`\`\`bash
   npm run setup
   \`\`\`

4. **Set up database:**
   - Go to your Supabase project's SQL editor
   - Run the scripts listed in the setup output
   - Or use the consolidated `scripts/init-database.sql`

5. **Start development:**
   \`\`\`bash
   npm run dev
   \`\`\`

That's it! 🎉

## Optional Commands

- `npm run analyze` - Analyze build size
- `npm run check-deps` - Check for unused dependencies
