# Railway.app Deployment Guide for alfiyaandken.com

## Why Railway?
- Dead simple deployment (5-10 minutes)
- Always-on (no spin down)
- $5/month free credit (your app uses ~$1-2/month)
- Automatic SSL for custom domains
- Built-in Node.js support

## Prerequisites
- GitHub account
- Railway.app account (sign up with GitHub at https://railway.app)
- Git installed locally

## Step 1: Prepare Your Code for Git

Check if you already have a Git repository:
```bash
cd /Users/kcorless/Documents/claude-code-course
git status
```

If not a Git repository, initialize it:
```bash
git init
git add .
git commit -m "Initial commit: Wedding save-the-date application"
```

## Step 2: Create GitHub Repository

Option A - Using GitHub CLI (if installed):
```bash
gh repo create wedding-app --private --source=. --remote=origin --push
```

Option B - Manual:
1. Go to https://github.com/new
2. Repository name: `wedding-app`
3. Privacy: Private (recommended - contains email config)
4. Don't initialize with README (you already have code)
5. Click "Create repository"
6. Run these commands:
```bash
git remote add origin https://github.com/YOUR-USERNAME/wedding-app.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Railway

### 3.1 Sign Up / Login
1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway to access your GitHub

### 3.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your `wedding-app` repository
4. Railway will automatically detect Node.js and start deploying

### 3.3 Configure Environment Variables
1. Click on your deployed service
2. Go to "Variables" tab
3. Add these variables:

```
GMAIL_USER=ken@corless.com
GMAIL_APP_PASSWORD=neeh khaa wxcr qalm
PORT=3000
BASE_URL=https://YOUR-APP-NAME.railway.app
```

Note: Railway automatically provides a PORT variable, but we set it to 3000 for consistency.

### 3.4 Update BASE_URL After First Deploy
1. After first deployment, Railway gives you a URL like: `https://wedding-app-production-xxxx.railway.app`
2. Copy this URL
3. Go back to Variables tab
4. Update `BASE_URL` to match your Railway URL
5. Click "Redeploy" (or just save - auto-redeploys)

## Step 4: Configure Custom Domain (alfiyaandken.com)

### 4.1 Add Domain in Railway
1. In your Railway project, go to "Settings" tab
2. Click "Generate Domain" first (for testing)
3. Click "Custom Domain"
4. Enter: `alfiyaandken.com`
5. Railway will show you DNS records to add

### 4.2 Update DNS in Dreamhost
1. Log into Dreamhost panel
2. Go to Domains → Manage Domains → DNS
3. Add the CNAME record Railway provides:
   - Type: CNAME
   - Name: `@` or `alfiyaandken.com`
   - Value: (provided by Railway, something like `xxxx.railway.app`)
   - TTL: 1 hour

4. Also add www subdomain (optional):
   - Type: CNAME
   - Name: `www`
   - Value: same as above

### 4.3 Update BASE_URL
1. After DNS propagates (5-60 minutes), update Railway variables:
   ```
   BASE_URL=https://alfiyaandken.com
   ```
2. Save (triggers automatic redeploy)

### 4.4 SSL Certificate
Railway automatically provisions SSL certificates for custom domains. No action needed!

## Step 5: Test Deployment

1. Visit https://alfiyaandken.com (or your Railway URL)
   - Should show save-the-date page

2. Visit https://alfiyaandken.com/admin
   - Should show admin dashboard with all your guests

3. Test a tracking link:
   - https://alfiyaandken.com/?code=[your-code]

4. Test email sending:
   - Click "Send Test Email" button
   - Check ken@corless.com inbox

## Managing Your Deployment

### View Logs
1. In Railway dashboard
2. Click "Deployments" tab
3. Click on latest deployment
4. View real-time logs

### Redeploy After Changes
```bash
# Make your code changes locally
git add .
git commit -m "Description of changes"
git push

# Railway automatically detects and redeploys!
```

### Restart Application
1. Railway dashboard → your service
2. Click "Redeploy" button (no need to touch any code)

### Backup Database
Download from Railway:
1. Click on your service
2. Go to "Data" tab (if available) or use CLI
3. Or download via Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Download database
railway run sqlite3 wedding.db ".backup wedding-backup.db"
```

Or download from your local machine:
```bash
# Just keep your local wedding.db synced before pushing to Git
cp wedding.db wedding-backup-$(date +%Y%m%d).db
```

### View Guests
Two options:

1. Use admin dashboard: https://alfiyaandken.com/admin

2. Connect to database via Railway CLI:
```bash
railway run sqlite3 wedding.db "SELECT * FROM invitees;"
```

## Troubleshooting

### Deployment Failed
- Check "Deployments" tab for error logs
- Verify package.json has correct start script: `"start": "node server.js"`
- Ensure all dependencies are listed in package.json

### Email Not Sending
- Verify GMAIL_USER and GMAIL_APP_PASSWORD in Railway variables
- Check Gmail app password is still valid
- View logs for specific error messages

### Custom Domain Not Working
- DNS propagation can take up to 48 hours (usually 5-60 minutes)
- Verify CNAME record is correctly set in Dreamhost
- Check Railway shows domain as "Active"
- Clear your browser cache

### Database Changes Not Persisting
- Railway provides persistent volumes by default for your workspace
- Database is stored in your app directory and persists across deploys
- For production, consider Railway's Postgres if you need more reliability

## Cost Estimates

Railway pricing (as of 2024):
- **Free tier:** $5/month credit
- **Your app usage:** ~$1-2/month for low traffic
- **First 2-3 months:** Free
- **After free credit:** ~$1-2/month

Your wedding app will easily stay under $5/month for low volume traffic.

## Security Notes

- .env file is NOT pushed to GitHub (.gitignore excludes it)
- Environment variables are securely stored in Railway
- SSL certificate automatically encrypts all traffic
- Consider adding authentication to /admin if you're concerned about security

## Next Steps

1. Test all functionality on Railway
2. Send test invitations to yourself
3. Verify tracking links work
4. Confirm emails send correctly with production URLs
5. Share alfiyaandken.com with your guests!

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: Join their community for help
- Check deployment logs for specific errors
