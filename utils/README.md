# Utility Scripts

## mark-emails-sent.js

**Purpose:** Updates specific email tracking records to 'sent' status.

**When to use:**
- When emails were successfully sent but status wasn't updated in database
- For manual correction of tracking status

**How to run on Railway:**
1. Go to your service in Railway
2. Click "Settings" tab
3. Under "Deploy", find "Custom Start Command"
4. Temporarily change to: `npm run mark-sent && npm start`
5. Redeploy
6. After it runs, change back to: `npm start`
7. Check the deployment logs to verify records were updated

**What it does:**
1. Looks up email_tracking records by unique_code
2. Updates status to 'sent' and sets sent_at timestamp
3. Reports success/failure for each record

**Output:**
```
Marking specific emails as sent...

Found: Mr. and Mrs. Matt Mead (current status: drafted)
✓ Mr. and Mrs. Matt Mead - Updated to 'sent' (1 row(s))

=== Update Complete ===
Total records: 2
Successfully updated: 2
Failed: 0
```

---

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
