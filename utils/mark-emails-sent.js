const db = require('../database/db');

console.log('Marking specific emails as sent...\n');

// Records to update with their unique codes
const recordsToUpdate = [
  {
    unique_code: '5341bc66-3991-4538-b8c2-7373754a0428',
    names: 'Mr. and Mrs. Matt Mead'
  },
  {
    unique_code: '7b40f202-b1ac-4e99-b9ad-ee1af8dd5109',
    names: 'Juliet Corless and Nathan Woofter'
  }
];

let processed = 0;
let updated = 0;
let failed = 0;

recordsToUpdate.forEach((record) => {
  const { unique_code, names } = record;

  // First check if the record exists
  db.get(
    'SELECT invite_master, status, sent_at FROM email_tracking WHERE unique_code = ?',
    [unique_code],
    (err, row) => {
      if (err) {
        console.error(`✗ Error checking ${names}:`, err);
        failed++;
        processed++;
        checkComplete();
        return;
      }

      if (!row) {
        console.error(`✗ ${names} - No record found with code ${unique_code}`);
        failed++;
        processed++;
        checkComplete();
        return;
      }

      console.log(`Found: ${row.invite_master} (current status: ${row.status})`);

      // Update the record
      db.run(
        'UPDATE email_tracking SET status = ?, sent_at = CURRENT_TIMESTAMP WHERE unique_code = ?',
        ['sent', unique_code],
        function(err) {
          if (err) {
            console.error(`✗ ${names} - Failed to update:`, err);
            failed++;
          } else if (this.changes === 0) {
            console.error(`✗ ${names} - No rows updated (code: ${unique_code})`);
            failed++;
          } else {
            console.log(`✓ ${row.invite_master} - Updated to 'sent' (${this.changes} row(s))`);
            updated++;
          }

          processed++;
          checkComplete();
        }
      );
    }
  );
});

function checkComplete() {
  if (processed === recordsToUpdate.length) {
    setTimeout(() => {
      console.log('\n=== Update Complete ===');
      console.log(`Total records: ${recordsToUpdate.length}`);
      console.log(`Successfully updated: ${updated}`);
      console.log(`Failed: ${failed}`);

      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
        process.exit(failed > 0 ? 1 : 0);
      });
    }, 500);
  }
}
