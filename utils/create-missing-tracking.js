const db = require('../database/db');

console.log('Creating missing email_tracking records...\n');

// Find all invite_masters that don't have email_tracking records
const query = `
  SELECT DISTINCT i.invite_master, i.unique_code, MIN(i.created_at) as created_at
  FROM invitees i
  LEFT JOIN email_tracking et ON i.invite_master = et.invite_master
  WHERE i.invite_master IS NOT NULL
    AND et.id IS NULL
  GROUP BY i.invite_master, i.unique_code
  ORDER BY i.invite_master
`;

db.all(query, [], (err, missing) => {
  if (err) {
    console.error('Error finding missing records:', err);
    process.exit(1);
  }

  console.log(`Found ${missing.length} invite_masters without email_tracking records\n`);

  if (missing.length === 0) {
    console.log('All invite_masters already have email_tracking records!');
    db.close();
    process.exit(0);
    return;
  }

  let created = 0;
  let failed = 0;

  missing.forEach((record, index) => {
    const { invite_master, unique_code, created_at } = record;

    db.run(
      'INSERT INTO email_tracking (invite_master, unique_code, status, created_at) VALUES (?, ?, ?, ?)',
      [invite_master, unique_code, 'drafted', created_at],
      function(err) {
        if (err) {
          console.error(`✗ Failed to create for "${invite_master}":`, err);
          failed++;
        } else {
          console.log(`✓ Created email_tracking record for "${invite_master}" (ID: ${this.lastID})`);
          created++;
        }

        // Check if done
        if (created + failed === missing.length) {
          setTimeout(() => {
            console.log('\n=== Complete ===');
            console.log(`Total missing: ${missing.length}`);
            console.log(`Created: ${created}`);
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
