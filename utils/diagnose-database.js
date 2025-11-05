const db = require('../database/db');

console.log('=== Database Diagnostic ===\n');

// Check invitees table
db.all('SELECT COUNT(*) as count FROM invitees', [], (err, rows) => {
  if (err) {
    console.error('Error counting invitees:', err);
  } else {
    console.log(`Total invitees: ${rows[0].count}`);
  }

  // Check how many have invite_master set
  db.all('SELECT COUNT(*) as count FROM invitees WHERE invite_master IS NOT NULL', [], (err, rows) => {
    if (err) {
      console.error('Error counting invitees with invite_master:', err);
    } else {
      console.log(`Invitees with invite_master: ${rows[0].count}`);
    }

    // Show sample invitees
    db.all('SELECT id, name, invite_master, unique_code FROM invitees LIMIT 5', [], (err, rows) => {
      if (err) {
        console.error('Error fetching sample invitees:', err);
      } else {
        console.log('\nSample invitees:');
        rows.forEach(row => {
          console.log(`  ID: ${row.id}, Name: ${row.name}, InviteMaster: ${row.invite_master || 'NULL'}, UniqueCode: ${row.unique_code}`);
        });
      }

      // Check email_tracking table
      db.all('SELECT COUNT(*) as count FROM email_tracking', [], (err, rows) => {
        if (err) {
          console.error('Error counting email_tracking:', err);
        } else {
          console.log(`\nTotal email_tracking records: ${rows[0].count}`);
        }

        // Show sample email_tracking
        db.all('SELECT id, invite_master, unique_code, status FROM email_tracking LIMIT 5', [], (err, rows) => {
          if (err) {
            console.error('Error fetching sample email_tracking:', err);
          } else {
            console.log('\nSample email_tracking:');
            rows.forEach(row => {
              console.log(`  ID: ${row.id}, InviteMaster: ${row.invite_master}, UniqueCode: ${row.unique_code}, Status: ${row.status}`);
            });
          }

          console.log('\n=== Diagnostic Complete ===');
          db.close();
          process.exit(0);
        });
      });
    });
  });
});
