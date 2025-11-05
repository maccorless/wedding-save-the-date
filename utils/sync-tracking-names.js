const db = require('../database/db');

console.log('Syncing email_tracking names to match invitees table...\n');

// Find and update mismatches
const query = `
  SELECT DISTINCT
    i.unique_code,
    i.invite_master as correct_name,
    et.invite_master as old_name,
    et.id as tracking_id
  FROM invitees i
  JOIN email_tracking et ON i.unique_code = et.unique_code
  WHERE i.invite_master IS NOT NULL
    AND i.invite_master != et.invite_master
  GROUP BY i.unique_code
`;

db.all(query, [], (err, mismatches) => {
  if (err) {
    console.error('Error finding mismatches:', err);
    process.exit(1);
  }

  if (mismatches.length === 0) {
    console.log('No mismatches found! All names are already synced.');
    db.close();
    process.exit(0);
    return;
  }

  console.log(`Found ${mismatches.length} mismatches to fix:\n`);

  let updated = 0;
  let failed = 0;

  mismatches.forEach(m => {
    console.log(`Updating tracking ID ${m.tracking_id}:`);
    console.log(`  From: "${m.old_name}"`);
    console.log(`  To:   "${m.correct_name}"`);

    db.run(
      'UPDATE email_tracking SET invite_master = ? WHERE id = ?',
      [m.correct_name, m.tracking_id],
      function(err) {
        if (err) {
          console.error(`  ✗ Failed:`, err);
          failed++;
        } else {
          console.log(`  ✓ Updated (${this.changes} row(s))`);
          updated++;
        }

        // Check if done
        if (updated + failed === mismatches.length) {
          setTimeout(() => {
            console.log('\n=== Complete ===');
            console.log(`Total mismatches: ${mismatches.length}`);
            console.log(`Updated: ${updated}`);
            console.log(`Failed: ${failed}`);

            db.close((err) => {
              if (err) console.error('Error closing database:', err);
              process.exit(failed > 0 ? 1 : 0);
            });
          }, 500);
        }
      }
    );
  });
});
