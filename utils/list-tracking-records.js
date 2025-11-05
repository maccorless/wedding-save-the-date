const db = require('../database/db');

console.log('Listing all email_tracking records...\n');

db.all(
  'SELECT invite_master, unique_code, status, sent_at FROM email_tracking ORDER BY invite_master',
  [],
  (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      process.exit(1);
    }

    if (!rows || rows.length === 0) {
      console.log('No email_tracking records found');
      process.exit(0);
    }

    console.log(`Found ${rows.length} email_tracking records:\n`);
    console.log('=' .repeat(120));
    console.log('INVITE_MASTER'.padEnd(50), 'UNIQUE_CODE'.padEnd(40), 'STATUS'.padEnd(10), 'SENT_AT');
    console.log('=' .repeat(120));

    rows.forEach(row => {
      const inviteMaster = (row.invite_master || '').padEnd(50);
      const uniqueCode = (row.unique_code || '').padEnd(40);
      const status = (row.status || '').padEnd(10);
      const sentAt = row.sent_at || 'NULL';

      console.log(inviteMaster, uniqueCode, status, sentAt);
    });

    console.log('=' .repeat(120));
    console.log(`\nTotal: ${rows.length} records`);
    console.log(`Status 'drafted': ${rows.filter(r => r.status === 'drafted').length}`);
    console.log(`Status 'sent': ${rows.filter(r => r.status === 'sent').length}`);

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
      process.exit(0);
    });
  }
);
