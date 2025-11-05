const db = require('../database/db');

console.log('Finding invite_master name mismatches...\n');

// Find cases where invitees.invite_master doesn't match email_tracking.invite_master
const query = `
  SELECT
    i.unique_code,
    i.invite_master as invitee_name,
    et.invite_master as tracking_name,
    et.id as tracking_id,
    et.status
  FROM invitees i
  LEFT JOIN email_tracking et ON i.unique_code = et.unique_code
  WHERE i.invite_master IS NOT NULL
    AND et.id IS NOT NULL
    AND i.invite_master != et.invite_master
  GROUP BY i.unique_code
  ORDER BY i.invite_master
`;

db.all(query, [], (err, mismatches) => {
  if (err) {
    console.error('Error finding mismatches:', err);
    process.exit(1);
  }

  if (mismatches.length === 0) {
    console.log('No mismatches found! All names are consistent.');
    db.close();
    process.exit(0);
    return;
  }

  console.log(`Found ${mismatches.length} name mismatches:\n`);

  mismatches.forEach(m => {
    console.log(`Tracking ID: ${m.tracking_id}`);
    console.log(`  Invitees table:       "${m.invitee_name}"`);
    console.log(`  Email_tracking table: "${m.tracking_name}"`);
    console.log(`  Unique code: ${m.unique_code}`);
    console.log(`  Status: ${m.status}`);
    console.log('');
  });

  console.log('=== Fix Options ===');
  console.log('Option 1: Update email_tracking to match invitees (recommended)');
  console.log('Option 2: Update invitees to match email_tracking');
  console.log('\nTo auto-fix, run: npm run sync-tracking-names\n');

  db.close();
  process.exit(0);
});
