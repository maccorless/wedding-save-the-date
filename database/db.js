const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use /app/data for production (Railway volume), otherwise use local database folder
const dataDir = '/app/data';
const dbPath = fs.existsSync(dataDir)
  ? path.join(dataDir, 'wedding.db')
  : path.join(__dirname, 'wedding.db');

console.log('Database path:', dbPath);
const db = new sqlite3.Database(dbPath);

// Initialize database schema
db.serialize(() => {
  // Table for invitees
  db.run(`
    CREATE TABLE IF NOT EXISTS invitees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      partner_first_name TEXT,
      partner_last_name TEXT,
      partner_email TEXT,
      unique_code TEXT NOT NULL,
      invite_master TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add new columns to existing table if they don't exist
  db.run(`ALTER TABLE invitees ADD COLUMN first_name TEXT`, () => {});
  db.run(`ALTER TABLE invitees ADD COLUMN last_name TEXT`, () => {});
  db.run(`ALTER TABLE invitees ADD COLUMN email TEXT`, () => {});
  db.run(`ALTER TABLE invitees ADD COLUMN partner_first_name TEXT`, () => {});
  db.run(`ALTER TABLE invitees ADD COLUMN partner_last_name TEXT`, () => {});
  db.run(`ALTER TABLE invitees ADD COLUMN partner_email TEXT`, () => {});
  db.run(`ALTER TABLE invitees ADD COLUMN invite_master TEXT`, () => {});

  // Table for page views
  db.run(`
    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invitee_id INTEGER NOT NULL,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invitee_id) REFERENCES invitees(id)
    )
  `);

  // Table for button clicks
  db.run(`
    CREATE TABLE IF NOT EXISTS button_clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invitee_id INTEGER NOT NULL,
      response_type TEXT,
      clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invitee_id) REFERENCES invitees(id)
    )
  `);

  // Add response_type column to existing table if it doesn't exist
  db.run(`ALTER TABLE button_clicks ADD COLUMN response_type TEXT`, () => {});

  // Table for email tracking by invite master
  db.run(`
    CREATE TABLE IF NOT EXISTS email_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invite_master TEXT UNIQUE NOT NULL,
      unique_code TEXT UNIQUE NOT NULL,
      email_content TEXT,
      status TEXT DEFAULT 'drafted',
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
