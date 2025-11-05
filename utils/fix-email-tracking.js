const db = require('../database/db');

console.log('Starting email_tracking migration...\n');

// Get all unique invite_masters from invitees
const inviteesQuery = `
  SELECT DISTINCT invite_master, unique_code, created_at
  FROM invitees
  WHERE invite_master IS NOT NULL
  ORDER BY invite_master
`;

db.all(inviteesQuery, [], (err, invitees) => {
  if (err) {
    console.error('Error fetching invitees:', err);
    process.exit(1);
  }

  console.log(`Found ${invitees.length} unique invite_master groups\n`);

  let processed = 0;
  let created = 0;
  let skipped = 0;

  invitees.forEach((invitee, index) => {
    const { invite_master, unique_code, created_at } = invitee;

    // Check if email_tracking record exists
    db.get(
      'SELECT id FROM email_tracking WHERE invite_master = ?',
      [invite_master],
      (err, row) => {
        if (err) {
          console.error(`Error checking ${invite_master}:`, err);
          processed++;
          return;
        }

        if (row) {
          console.log(`✓ ${invite_master} - already has tracking record`);
          skipped++;
        } else {
          // Create missing email_tracking record
          db.run(
            'INSERT INTO email_tracking (invite_master, unique_code, status, created_at) VALUES (?, ?, ?, ?)',
            [invite_master, unique_code, 'drafted', created_at],
            (err) => {
              if (err) {
                console.error(`✗ ${invite_master} - failed to create:`, err);
              } else {
                console.log(`+ ${invite_master} - created tracking record`);
                created++;
              }
            }
          );
        }

        processed++;

        // When all are processed, show summary
        if (processed === invitees.length) {
          setTimeout(() => {
            console.log('\n=== Migration Complete ===');
            console.log(`Total groups: ${invitees.length}`);
            console.log(`Already existed: ${skipped}`);
            console.log(`Created: ${created}`);
            console.log(`Failed: ${invitees.length - skipped - created}`);

            db.close((err) => {
              if (err) {
                console.error('Error closing database:', err);
              }
              process.exit(0);
            });
          }, 500);
        }
      }
    );
  });
});
