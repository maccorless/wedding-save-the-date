const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Add invitees to the database
 * Usage: node utils/add-invitees.js "John Smith" "Jane Doe" "Bob Johnson"
 */

const inviteeNames = process.argv.slice(2);

if (inviteeNames.length === 0) {
  console.log('Usage: node utils/add-invitees.js "Name1" "Name2" "Name3" ...');
  console.log('Example: node utils/add-invitees.js "John Smith" "Jane Doe"');
  process.exit(1);
}

console.log(`Adding ${inviteeNames.length} invitee(s)...`);

// Add each invitee
const promises = inviteeNames.map((name) => {
  return new Promise((resolve, reject) => {
    const uniqueCode = uuidv4();

    db.run(
      'INSERT INTO invitees (name, unique_code) VALUES (?, ?)',
      [name, uniqueCode],
      function (err) {
        if (err) {
          console.error(`Error adding ${name}:`, err.message);
          reject(err);
        } else {
          const link = `http://localhost:3000/?code=${uniqueCode}`;
          console.log(`\n✓ Added: ${name}`);
          console.log(`  Link: ${link}`);
          resolve({ name, link });
        }
      }
    );
  });
});

Promise.all(promises)
  .then(() => {
    console.log(`\n✓ Successfully added ${inviteeNames.length} invitee(s)`);
    console.log('\nYou can now:');
    console.log('1. Start the server: npm start');
    console.log('2. View the admin dashboard: http://localhost:3000/admin');
    db.close();
  })
  .catch((err) => {
    console.error('Error adding invitees:', err);
    db.close();
    process.exit(1);
  });
