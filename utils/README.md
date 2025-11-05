# Utility Scripts

## fix-email-tracking.js

**Purpose:** Creates missing `email_tracking` records for invitees that don't have them.

**When to use:**
- After bulk importing guests
- If email preview shows "Email tracking not found" error
- After database restoration or migration

**How to run locally:**
```bash
npm run fix-tracking
```

**How to run on Railway:**
1. Go to your service in Railway
2. Click "Settings" tab
3. Under "Deploy", find "Custom Start Command"
4. Temporarily change to: `npm run fix-tracking && npm start`
5. Redeploy
6. After it runs, change back to: `npm start`

**What it does:**
1. Finds all unique `invite_master` values in the `invitees` table
2. Checks if each has a corresponding `email_tracking` record
3. Creates missing records with:
   - Same `unique_code` from invitees table
   - Status set to 'drafted'
   - Original created_at timestamp

**Output:**
```
Starting email_tracking migration...
Found 6 unique invite_master groups

✓ John Smith - already has tracking record
+ Jane Doe - created tracking record

=== Migration Complete ===
Total groups: 6
Already existed: 5
Created: 1
Failed: 0
```
