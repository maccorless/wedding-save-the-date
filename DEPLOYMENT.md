# Deployment Guide for alfiyaandken.com

## Prerequisites
- Dreamhost VPS or Dedicated hosting
- SSH access enabled
- Domain alfiyaandken.com configured

## Step 0: Install Node.js and npm on Dreamhost (If Not Already Installed)

SSH into your server first:
```bash
ssh username@server.dreamhost.com
```

### Check if Node.js is installed:
```bash
node --version
npm --version
```

### If not installed, install using NVM (Node Version Manager):

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Close and reopen your terminal, or run:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js v20.x (Compatible with Dreamhost)
# Note: v24.x has glibc compatibility issues on Dreamhost
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### Add to .bash_profile for persistence:
```bash
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bash_profile
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bash_profile
source ~/.bash_profile
```

## Step 1: Prepare Files for Upload

Files to upload to server:
```
✅ server.js
✅ package.json
✅ package-lock.json
✅ database/db.js
✅ services/emailService.js
✅ public/ (entire directory)
✅ wedding.db (your database with guest data)
✅ .env.example (as reference)

❌ node_modules/ (install on server)
❌ .env (create on server)
❌ .gitignore
```

## Step 2: SSH into Dreamhost Server

```bash
ssh username@server.dreamhost.com
```

## Step 3: Create Application Directory

```bash
mkdir -p ~/wedding-app
cd ~/wedding-app
```

## Step 4: Upload Files

From your local machine, upload files via SCP or SFTP:

```bash
# Option A: Using SCP
scp -r * username@server.dreamhost.com:~/wedding-app/

# Option B: Using SFTP client (FileZilla, Cyberduck, etc.)
# Upload all files to ~/wedding-app/ directory
```

## Step 5: Create .env File on Server

SSH into server and create .env file:

```bash
cd ~/wedding-app
nano .env
```

Add the following content:

```env
# Gmail Configuration
GMAIL_USER=ken@corless.com
GMAIL_APP_PASSWORD=neeh khaa wxcr qalm

# Server Configuration  
PORT=3000
BASE_URL=https://alfiyaandken.com
```

Save and exit (Ctrl+X, Y, Enter)

## Step 6: Install Dependencies

```bash
npm install --production
```

## Step 7: Configure Passenger for Node.js

Create `tmp/restart.txt` to enable Passenger:

```bash
mkdir -p tmp
touch tmp/restart.txt
```

Create `app.js` entry point for Passenger:

```bash
cat > app.js << 'APPJS'
require('./server.js');
APPJS
```

## Step 8: Configure Domain in Dreamhost Panel

1. Log into Dreamhost Panel
2. Go to Domains → Manage Domains
3. Edit alfiyaandken.com settings:
   - Document Root: `/home/username/wedding-app/public`
   - Enable Passenger for Node.js
   - Set Node.js version (14.x or later recommended)

## Step 9: Set up SSL Certificate

1. In Dreamhost Panel → Secure Certificates
2. Add Let's Encrypt SSL certificate for alfiyaandken.com
3. Enable "Force HTTPS"

## Step 10: Start/Restart Application

```bash
# Restart Passenger app
touch tmp/restart.txt

# Check if it's running
ps aux | grep node
```

## Step 11: Test Deployment

1. Visit https://alfiyaandken.com
   - Should show save-the-date page
   
2. Visit https://alfiyaandken.com/admin
   - Should show admin dashboard
   
3. Test a tracking link:
   - https://alfiyaandken.com/?code=[your-code]
   
4. Test email sending:
   - Click "Send Test Email" button
   - Check ken@corless.com inbox

## Troubleshooting

### Check Application Logs

```bash
tail -f ~/logs/alfiyaandken.com/http/error.log
```

### Restart Application

```bash
cd ~/wedding-app
touch tmp/restart.txt
```

### Check Node.js Version

```bash
node --version  # Should be 14.x or later
```

### Database Permissions

```bash
chmod 644 wedding.db
```

### Port Issues

If port 3000 is in use, Passenger will automatically assign an available port.
Make sure BASE_URL uses the domain name, not localhost.

## Maintenance

### Update Code

1. Upload new files via SCP/SFTP
2. Restart: `touch tmp/restart.txt`

### View Guests

SSH into server:
```bash
sqlite3 wedding.db "SELECT * FROM invitees;"
```

### Backup Database

```bash
scp username@server.dreamhost.com:~/wedding-app/wedding.db ./wedding-backup.db
```

## Security Notes

- ✅ .env file is NOT uploaded to server (excluded by .gitignore)
- ✅ SSL certificate encrypts all traffic
- ✅ Gmail app password (not real password) is used
- ✅ Admin dashboard has no authentication (consider adding if needed)

## Support

If you encounter issues:
1. Check Dreamhost error logs
2. Verify Node.js version compatibility
3. Ensure all dependencies installed correctly
4. Confirm .env file has correct values
