require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./database/db');
const { v4: uuidv4 } = require('uuid');
const { sendEmail, sendTestEmail } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve save-the-date page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API: Get invitee info by unique code
app.get('/api/invitee/:code', (req, res) => {
  const { code } = req.params;

  // Get all invitees with this unique code
  const inviteesQuery = `SELECT * FROM invitees WHERE unique_code = ?`;

  db.all(inviteesQuery, [code], (err, invitees) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!invitees || invitees.length === 0) {
      return res.status(404).json({ error: 'Invitee not found' });
    }

    // Get all invitee IDs for this unique code
    const inviteeIds = invitees.map(inv => inv.id);

    // Get the most recent response from ANY invitee in this group
    const responseQuery = `
      SELECT response_type, clicked_at
      FROM button_clicks
      WHERE invitee_id IN (${inviteeIds.join(',')})
      ORDER BY clicked_at DESC
      LIMIT 1
    `;

    db.get(responseQuery, [], (err, response) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Use the first invitee for display name (they all share the same unique code)
      const displayName = invitees.length === 1
        ? invitees[0].name
        : invitees[0].invite_master || invitees.map(i => i.first_name).join(' & ');

      res.json({
        id: invitees[0].id,  // Use first invitee ID for tracking
        name: displayName,
        response_type: response ? response.response_type : null,
        response_date: response ? response.clicked_at : null,
        unique_code: code
      });
    });
  });
});

// API: Track page view
app.post('/api/track/view', (req, res) => {
  const { invitee_id } = req.body;

  if (!invitee_id) {
    return res.status(400).json({ error: 'Invitee ID required' });
  }

  db.run('INSERT INTO page_views (invitee_id) VALUES (?)', [invitee_id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// API: Track button click
app.post('/api/track/click', (req, res) => {
  const { invitee_id, response_type } = req.body;

  if (!invitee_id) {
    return res.status(400).json({ error: 'Invitee ID required' });
  }

  db.run('INSERT INTO button_clicks (invitee_id, response_type) VALUES (?, ?)', [invitee_id, response_type], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// API: Get admin statistics
app.get('/api/admin/stats', (req, res) => {
  const query = `
    SELECT
      i.id,
      i.name,
      i.first_name,
      i.last_name,
      i.email,
      i.partner_first_name,
      i.partner_last_name,
      i.unique_code,
      i.invite_master,
      i.created_at,
      (SELECT COUNT(*) FROM page_views WHERE invitee_id = i.id) as view_count,
      (SELECT viewed_at FROM page_views WHERE invitee_id = i.id ORDER BY viewed_at DESC LIMIT 1) as last_viewed,
      (SELECT COUNT(*) FROM button_clicks WHERE invitee_id = i.id) as click_count,
      (SELECT clicked_at FROM button_clicks WHERE invitee_id = i.id ORDER BY clicked_at DESC LIMIT 1) as last_clicked,
      (SELECT response_type FROM button_clicks WHERE invitee_id = i.id ORDER BY clicked_at DESC LIMIT 1) as response_type,
      (SELECT status FROM email_tracking WHERE invite_master = i.invite_master) as email_status
    FROM invitees i
    ORDER BY i.invite_master, i.last_name, i.first_name
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// API: Get email preview for an invite master
app.get('/api/admin/email-preview/:inviteMaster', (req, res) => {
  const { inviteMaster } = req.params;

  // Get all guests for this invite master
  const guestsQuery = `
    SELECT * FROM invitees WHERE invite_master = ?
  `;

  // Get email tracking info
  const trackingQuery = `
    SELECT * FROM email_tracking WHERE invite_master = ?
  `;

  db.all(guestsQuery, [inviteMaster], (err, guests) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!guests || guests.length === 0) {
      return res.status(404).json({ error: 'Invite master not found' });
    }

    db.get(trackingQuery, [inviteMaster], (err, tracking) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Generate greeting based on guests
      let greeting = 'Dear ';
      if (guests.length === 1) {
        greeting += guests[0].name;
      } else {
        // Multiple guests - use invite master as the addressee
        greeting += inviteMaster;
      }

      // Generate email URL
      const saveTheDateUrl = `${BASE_URL}/?code=${tracking.unique_code}`;

      // Collect all email addresses
      const emailAddresses = guests
        .map(g => g.email)
        .filter(e => e)
        .join(', ');

      // Create email preview
      const emailPreview = {
        invite_master: inviteMaster,
        greeting: greeting,
        to_emails: emailAddresses || 'No email addresses',
        save_the_date_url: saveTheDateUrl,
        unique_code: tracking.unique_code,
        status: tracking.status,
        sent_at: tracking.sent_at,
        guests: guests.map(g => ({
          name: g.name,
          email: g.email
        }))
      };

      res.json(emailPreview);
    });
  });
});

// API: Create new invitee
app.post('/api/admin/invitees', (req, res) => {
  const {
    first_name,
    last_name,
    email,
    partner_first_name,
    partner_last_name,
    invite_master
  } = req.body;

  if (!first_name || !last_name || !invite_master) {
    return res.status(400).json({ error: 'First name, last name, and invite master are required' });
  }

  // Generate display name
  let name = `${first_name} ${last_name}`;
  if (partner_first_name && partner_last_name) {
    name += ` & ${partner_first_name} ${partner_last_name}`;
  }

  // Check if invite_master already has a tracking record
  db.get('SELECT unique_code FROM email_tracking WHERE invite_master = ?', [invite_master], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    let uniqueCode;

    if (row) {
      // Reuse existing unique code for this invite master
      uniqueCode = row.unique_code;
      insertInvitee();
    } else {
      // Create new email tracking record
      uniqueCode = uuidv4();
      db.run(
        'INSERT INTO email_tracking (invite_master, unique_code, status) VALUES (?, ?, ?)',
        [invite_master, uniqueCode, 'drafted'],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error creating email tracking' });
          }
          insertInvitee();
        }
      );
    }

    function insertInvitee() {
      const query = `
        INSERT INTO invitees
        (name, first_name, last_name, email, partner_first_name, partner_last_name, unique_code, invite_master)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        query,
        [name, first_name, last_name, email, partner_first_name, partner_last_name, uniqueCode, invite_master],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({
            success: true,
            id: this.lastID,
            unique_code: uniqueCode,
            name: name
          });
        }
      );
    }
  });
});

// API: Update invitee
app.put('/api/admin/invitees/:id', (req, res) => {
  const { id } = req.params;
  const {
    first_name,
    last_name,
    email,
    partner_first_name,
    partner_last_name,
    invite_master
  } = req.body;

  if (!first_name || !last_name || !invite_master) {
    return res.status(400).json({ error: 'First name, last name, and invite master are required' });
  }

  // Generate display name
  let name = `${first_name} ${last_name}`;
  if (partner_first_name && partner_last_name) {
    name += ` & ${partner_first_name} ${partner_last_name}`;
  }

  const query = `
    UPDATE invitees
    SET name = ?, first_name = ?, last_name = ?, email = ?,
        partner_first_name = ?, partner_last_name = ?, invite_master = ?
    WHERE id = ?
  `;

  db.run(
    query,
    [name, first_name, last_name, email, partner_first_name, partner_last_name, invite_master, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Invitee not found' });
      }
      res.json({ success: true });
    }
  );
});

// API: Delete invitee
app.delete('/api/admin/invitees/:id', (req, res) => {
  const { id } = req.params;

  // Delete associated records first
  db.run('DELETE FROM page_views WHERE invitee_id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.run('DELETE FROM button_clicks WHERE invitee_id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      db.run('DELETE FROM invitees WHERE id = ?', [id], function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Invitee not found' });
        }
        res.json({ success: true });
      });
    });
  });
});

// API: Bulk import invitees
app.post('/api/admin/invitees/bulk', (req, res) => {
  const { guests, mode } = req.body;

  if (!guests || !Array.isArray(guests)) {
    return res.status(400).json({ error: 'Invalid guests data' });
  }

  if (mode !== 'replace' && mode !== 'append') {
    return res.status(400).json({ error: 'Invalid mode. Must be "replace" or "append"' });
  }

  // Validate all guests have required fields
  for (let i = 0; i < guests.length; i++) {
    if (!guests[i].first_name || !guests[i].last_name || !guests[i].invite_master) {
      return res.status(400).json({
        error: `Guest at row ${i + 1} is missing required fields (first_name, last_name, invite_master)`
      });
    }
  }

  db.serialize(() => {
    if (mode === 'replace') {
      // Delete all existing invitees and their tracking data
      db.run('DELETE FROM page_views', (err) => {
        if (err) console.error('Error deleting page views:', err);
      });
      db.run('DELETE FROM button_clicks', (err) => {
        if (err) console.error('Error deleting button clicks:', err);
      });
      db.run('DELETE FROM email_tracking', (err) => {
        if (err) console.error('Error deleting email tracking:', err);
      });
      db.run('DELETE FROM invitees', (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error clearing existing data' });
        }
      });
    }

    // Group guests by invite_master
    const inviteMasterGroups = {};
    guests.forEach((guest) => {
      const master = guest.invite_master;
      if (!inviteMasterGroups[master]) {
        inviteMasterGroups[master] = {
          unique_code: uuidv4(),
          guests: []
        };
      }
      inviteMasterGroups[master].guests.push(guest);
    });

    // Create email tracking records for each invite master
    const emailTrackingPromises = Object.keys(inviteMasterGroups).map((master) => {
      return new Promise((resolve, reject) => {
        const uniqueCode = inviteMasterGroups[master].unique_code;
        const query = `
          INSERT INTO email_tracking
          (invite_master, unique_code, status)
          VALUES (?, ?, 'drafted')
        `;
        db.run(query, [master, uniqueCode], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ invite_master: master, unique_code: uniqueCode });
          }
        });
      });
    });

    // Insert all guests with their shared unique_code
    const insertPromises = guests.map((guest) => {
      return new Promise((resolve, reject) => {
        const { first_name, last_name, partner_first_name, partner_last_name, email, invite_master } = guest;

        // Generate display name
        let name = `${first_name} ${last_name}`;
        if (partner_first_name && partner_last_name) {
          name += ` & ${partner_first_name} ${partner_last_name}`;
        }

        // Get the shared unique code for this invite master
        const uniqueCode = inviteMasterGroups[invite_master].unique_code;

        const query = `
          INSERT INTO invitees
          (name, first_name, last_name, email, partner_first_name, partner_last_name, unique_code, invite_master)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
          query,
          [name, first_name, last_name, email, partner_first_name, partner_last_name, uniqueCode, invite_master],
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                id: this.lastID,
                unique_code: uniqueCode,
                name: name,
                invite_master: invite_master
              });
            }
          }
        );
      });
    });

    Promise.all([...emailTrackingPromises, ...insertPromises])
      .then((results) => {
        res.json({
          success: true,
          count: guests.length,
          invite_masters: Object.keys(inviteMasterGroups).length,
          message: `Successfully imported ${guests.length} guest(s) across ${Object.keys(inviteMasterGroups).length} invite master(s)`
        });
      })
      .catch((err) => {
        console.error('Error importing guests:', err);
        res.status(500).json({ error: 'Error importing guests' });
      });
  });
});

// API: Send test email to yourself
app.post('/api/admin/email/test', async (req, res) => {
  const { inviteMaster } = req.body;

  try {
    // Get the tracking code for test
    const testUrl = `${BASE_URL}/?code=test-code`;
    const result = await sendTestEmail(testUrl);

    if (result.success) {
      res.json({ success: true, message: 'Test email sent successfully!' });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// API: Send emails to selected invite masters
app.post('/api/admin/email/send', async (req, res) => {
  const { inviteMasters } = req.body;

  if (!inviteMasters || !Array.isArray(inviteMasters) || inviteMasters.length === 0) {
    return res.status(400).json({ error: 'No invite masters selected' });
  }

  // Set headers for server-sent events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const results = [];
  const total = inviteMasters.length;
  let current = 0;

  for (const inviteMaster of inviteMasters) {
    try {
      current++;

      // Send progress update
      res.write(`data: ${JSON.stringify({ type: 'progress', inviteMaster, current, total })}\n\n`);

      // Get all invitees for this invite master
      const invitees = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM invitees WHERE invite_master = ?', [inviteMaster], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (!invitees || invitees.length === 0) {
        const result = { inviteMaster, success: false, error: 'No invitees found' };
        results.push(result);
        res.write(`data: ${JSON.stringify({ type: 'result', ...result })}\n\n`);
        continue;
      }

      // Get the unique tracking code (same for all in group)
      const uniqueCode = invitees[0].unique_code;
      const saveTheDateUrl = `${BASE_URL}/?code=${uniqueCode}`;

      // Collect all email addresses (filter out nulls)
      const emailAddresses = invitees
        .map(inv => inv.email)
        .filter(email => email);

      if (emailAddresses.length === 0) {
        const result = { inviteMaster, success: false, error: 'No email addresses found' };
        results.push(result);
        res.write(`data: ${JSON.stringify({ type: 'result', ...result })}\n\n`);
        continue;
      }

      // Send the email
      const emailResult = await sendEmail(emailAddresses, inviteMaster, saveTheDateUrl, invitees);

      if (emailResult.success) {
        // Update email tracking status
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE email_tracking SET status = ?, sent_at = CURRENT_TIMESTAMP WHERE invite_master = ?',
            ['sent', inviteMaster],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        const result = {
          inviteMaster,
          success: true,
          recipients: emailAddresses.length,
          messageId: emailResult.messageId
        };
        results.push(result);
        res.write(`data: ${JSON.stringify({ type: 'result', ...result })}\n\n`);
      } else {
        const result = { inviteMaster, success: false, error: emailResult.error };
        results.push(result);
        res.write(`data: ${JSON.stringify({ type: 'result', ...result })}\n\n`);
      }

      // Rate limit: wait 1 second between emails
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Error processing ${inviteMaster}:`, error);
      const result = { inviteMaster, success: false, error: error.message };
      results.push(result);
      res.write(`data: ${JSON.stringify({ type: 'result', ...result })}\n\n`);
    }
  }

  // Send completion message
  res.write(`data: ${JSON.stringify({
    type: 'complete',
    total,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  })}\n\n`);

  res.end();
});

// Reset stats endpoint
app.post('/api/admin/reset-stats', (req, res) => {
  // First check if any emails have been sent
  db.get('SELECT COUNT(*) as count FROM email_tracking WHERE status = "sent"', (err, row) => {
    if (err) {
      console.error('Error checking email status:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (row.count > 0) {
      return res.status(400).json({
        error: 'Cannot reset stats - some invitations have already been sent'
      });
    }

    // Delete all page views
    db.run('DELETE FROM page_views', (err) => {
      if (err) {
        console.error('Error deleting page views:', err);
        return res.status(500).json({ error: 'Failed to delete page views' });
      }

      // Delete all button clicks
      db.run('DELETE FROM button_clicks', (err) => {
        if (err) {
          console.error('Error deleting button clicks:', err);
          return res.status(500).json({ error: 'Failed to delete button clicks' });
        }

        res.json({ success: true, message: 'Stats reset successfully' });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Wedding Save-the-Date server running on ${BASE_URL}`);
  console.log(`Admin dashboard available at ${BASE_URL}/admin`);
});
