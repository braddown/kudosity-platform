# Deploying Kudosity App to Vercel

This guide will help you deploy the Kudosity App to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A [GitHub account](https://github.com/signup) (if deploying from GitHub)
3. Your Supabase project set up and running

## Deployment Steps

### 1. Push your code to GitHub

If you haven't already, push your code to a GitHub repository:

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/kudosity-app.git
git push -u origin main
\`\`\`

### 2. Import your project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next

### 3. Configure Environment Variables

Add all the required environment variables from your `.env.example` file to the Vercel project:

1. In your project settings, go to "Environment Variables"
2. Add each variable from your local `.env` file
3. Make sure to mark variables that should be exposed to the browser with `NEXT_PUBLIC_` prefix

### 4. Deploy

Click "Deploy" and wait for the deployment to complete.

## Troubleshooting

### Build Failures

If your build fails, check the build logs for errors. Common issues include:

- Missing environment variables
- Incompatible dependencies
- Syntax errors in your code

### Database Connection Issues

If your app deploys but can't connect to Supabase:

1. Verify your Supabase environment variables are correct
2. Check that your Supabase project allows connections from Vercel's IP ranges
3. Ensure your database is not in a paused state

### Large File Issues

If you have files larger than 50MB, they might cause deployment issues. Consider:

- Removing large files and using external storage
- Using Git LFS for large files
- Breaking down large files into smaller chunks

## Post-Deployment

After successful deployment:

1. Set up a custom domain (optional)
2. Configure additional environment variables if needed
3. Set up preview deployments for pull requests
