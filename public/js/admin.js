// Format date/time for display
function formatDateTime(dateString) {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Store current data
let guestData = [];

// Create a new empty row for adding a guest
function createNewRow() {
  const row = document.createElement('tr');
  row.classList.add('edit-mode', 'new-row');
  row.dataset.id = 'new';

  row.innerHTML = `
    <td class="checkbox-col">-</td>
    <td><input type="text" class="edit-input" data-field="invite_master" placeholder="Invite Master" required></td>
    <td><input type="text" class="edit-input" data-field="first_name" placeholder="First name" required></td>
    <td><input type="text" class="edit-input" data-field="last_name" placeholder="Last name" required></td>
    <td><input type="email" class="edit-input" data-field="email" placeholder="email@example.com"></td>
    <td class="link-cell">-</td>
    <td>0</td>
    <td>-</td>
    <td>-</td>
    <td>
      <div class="action-btns">
        <button class="icon-btn save-btn" onclick="saveRow(this)" title="Save">✓</button>
        <button class="icon-btn cancel-btn" onclick="cancelEdit(this)" title="Cancel">✕</button>
      </div>
    </td>
  `;

  return row;
}

// Create a display row for an invite_master group (may contain 1 or 2 people)
function createGroupDisplayRow(group, groupIndex) {
  const invitees = group.invitees;
  const firstInvitee = invitees[0];
  const masterName = firstInvitee.invite_master || firstInvitee.name;

  const row = document.createElement('tr');
  row.dataset.id = firstInvitee.id;  // Use first invitee's ID for actions
  row.dataset.inviteMaster = masterName;
  row.dataset.inviteMasterGroup = groupIndex % 2 === 0 ? 'even' : 'odd';

  const uniqueLink = `${window.location.origin}/?code=${firstInvitee.unique_code}`;
  const isEmailSent = firstInvitee.email_status === 'sent';

  // Build names and emails display
  let namesDisplay = invitees.map(inv => `${inv.first_name || ''} ${inv.last_name || ''}`).join(' & ');
  let emailsDisplay = invitees.map(inv => inv.email).filter(e => e).join(', ') || '-';

  row.innerHTML = `
    <td class="checkbox-col">
      <input type="checkbox" class="row-checkbox" data-invite-master="${masterName}" ${isEmailSent ? 'disabled' : ''} onchange="updateSendButton()">
    </td>
    <td data-field="invite_master">${masterName}</td>
    <td colspan="2" data-field="names">${namesDisplay}</td>
    <td data-field="email">${emailsDisplay}</td>
    <td class="link-cell">
      <button class="copy-btn" onclick="copyToClipboard('${uniqueLink}')">Copy Link</button>
    </td>
    <td class="${firstInvitee.view_count > 0 ? 'status-viewed' : 'status-not-viewed'}">
      ${firstInvitee.view_count}
    </td>
    <td class="${group.mostRecentResponse === 'planning' ? 'status-planning' : group.mostRecentResponse === 'unlikely' ? 'status-unlikely' : ''}">
      ${group.mostRecentResponse === 'planning' ? 'Planning' : group.mostRecentResponse === 'unlikely' ? 'Unlikely' : '-'}
    </td>
    <td>
      <span class="status-badge ${firstInvitee.email_status || 'drafted'}">${firstInvitee.email_status || 'drafted'}</span>
      ${masterName ? `<button class="preview-email-btn" onclick="showEmailPreview(\`${masterName.replace(/`/g, '\\`')}\`)">Preview</button>` : ''}
    </td>
    <td>
      <div class="action-btns">
        <button class="icon-btn edit-btn" onclick="editGroup(${firstInvitee.id})" title="Edit">✏️</button>
        <button class="icon-btn delete-btn" onclick="deleteGroup('${masterName}')" title="Delete">❌</button>
      </div>
    </td>
  `;

  return row;
}

// Legacy function - keeping for compatibility (no longer used for main table)
function createDisplayRow(invitee, isFirstInGroup = false, groupIndex = 0) {
  const row = document.createElement('tr');
  row.dataset.id = invitee.id;
  row.dataset.inviteMaster = invitee.invite_master || '';
  row.dataset.inviteMasterGroup = groupIndex % 2 === 0 ? 'even' : 'odd';

  if (isFirstInGroup) {
    row.classList.add('invite-master-first');
  }

  const uniqueLink = `${window.location.origin}/?code=${invitee.unique_code}`;
  const isEmailSent = invitee.email_status === 'sent';

  // Only show checkbox for first row of each invite master group
  const checkboxHtml = isFirstInGroup
    ? `<input type="checkbox" class="row-checkbox" data-invite-master="${invitee.invite_master || ''}" ${isEmailSent ? 'disabled' : ''} onchange="updateSendButton()">`
    : '';

  row.innerHTML = `
    <td class="checkbox-col">${checkboxHtml}</td>
    <td data-field="invite_master">${invitee.invite_master || '-'}</td>
    <td data-field="first_name">${invitee.first_name || '-'}</td>
    <td data-field="last_name">${invitee.last_name || '-'}</td>
    <td data-field="email">${invitee.email || '-'}</td>
    <td class="link-cell">
      <button class="copy-btn" onclick="copyToClipboard('${uniqueLink}')">Copy Link</button>
    </td>
    <td class="${invitee.view_count > 0 ? 'status-viewed' : 'status-not-viewed'}">
      ${invitee.view_count}
    </td>
    <td class="${invitee.response_type === 'planning' ? 'status-planning' : invitee.response_type === 'unlikely' ? 'status-unlikely' : ''}">
      ${invitee.response_type === 'planning' ? 'Planning' : invitee.response_type === 'unlikely' ? 'Unlikely' : '-'}
    </td>
    <td>
      <span class="status-badge ${invitee.email_status || 'drafted'}">${invitee.email_status || 'drafted'}</span>
      ${invitee.invite_master ? `<button class="preview-email-btn" onclick="showEmailPreview(\`${invitee.invite_master.replace(/`/g, '\\`')}\`)">Preview</button>` : ''}
    </td>
    <td>
      <div class="action-btns">
        <button class="icon-btn edit-btn" onclick="editRow(this)" title="Edit">✏️</button>
        <button class="icon-btn delete-btn" onclick="deleteGuest(${invitee.id}, '${(invitee.first_name || '') + ' ' + (invitee.last_name || '')}' )" title="Delete">❌</button>
      </div>
    </td>
  `;

  return row;
}

// Create edit row
function createEditRow(invitee) {
  const row = document.createElement('tr');
  row.classList.add('edit-mode');
  row.dataset.id = invitee.id;

  const uniqueLink = `${window.location.origin}/?code=${invitee.unique_code}`;

  row.innerHTML = `
    <td class="checkbox-col">-</td>
    <td><input type="text" class="edit-input" data-field="invite_master" value="${invitee.invite_master || ''}" required></td>
    <td><input type="text" class="edit-input" data-field="first_name" value="${invitee.first_name || ''}" required></td>
    <td><input type="text" class="edit-input" data-field="last_name" value="${invitee.last_name || ''}" required></td>
    <td><input type="email" class="edit-input" data-field="email" value="${invitee.email || ''}"></td>
    <td class="link-cell">
      <button class="copy-btn" onclick="copyToClipboard('${uniqueLink}')">Copy Link</button>
    </td>
    <td class="${invitee.view_count > 0 ? 'status-viewed' : 'status-not-viewed'}">
      ${invitee.view_count}
    </td>
    <td class="${invitee.response_type === 'planning' ? 'status-planning' : invitee.response_type === 'unlikely' ? 'status-unlikely' : ''}">
      ${invitee.response_type === 'planning' ? 'Planning' : invitee.response_type === 'unlikely' ? 'Unlikely' : '-'}
    </td>
    <td>
      <span class="status-badge ${invitee.email_status || 'drafted'}">${invitee.email_status || 'drafted'}</span>
    </td>
    <td>
      <div class="action-btns">
        <button class="icon-btn save-btn" onclick="saveRow(this)" title="Save">✓</button>
        <button class="icon-btn cancel-btn" onclick="cancelEdit(this)" title="Cancel">✕</button>
      </div>
    </td>
  `;

  return row;
}

// Edit row
function editRow(btn) {
  const row = btn.closest('tr');
  const id = parseInt(row.dataset.id);
  const invitee = guestData.find(g => g.id === id);

  if (!invitee) return;

  const newRow = createEditRow(invitee);
  row.replaceWith(newRow);
  newRow.querySelector('input').focus();
}

// Cancel edit
function cancelEdit(btn) {
  const row = btn.closest('tr');
  const id = row.dataset.id;

  if (id === 'new') {
    row.remove();
    return;
  }

  const invitee = guestData.find(g => g.id === parseInt(id));
  if (!invitee) return;

  const newRow = createDisplayRow(invitee);
  row.replaceWith(newRow);
}

// Save row
async function saveRow(btn) {
  const row = btn.closest('tr');
  const id = row.dataset.id;
  const inputs = row.querySelectorAll('.edit-input');

  // Gather data
  const data = {};
  let isValid = true;

  inputs.forEach(input => {
    const field = input.dataset.field;
    const value = input.value.trim();

    if (input.required && !value) {
      isValid = false;
      input.style.borderColor = 'red';
    } else {
      input.style.borderColor = '';
      data[field] = value || null;
    }
  });

  if (!isValid) {
    alert('Please fill in all required fields (Invite Master, First Name, and Last Name)');
    return;
  }

  // Disable buttons during save
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    let response;
    if (id === 'new') {
      // Create new guest
      response = await fetch('/api/admin/invitees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      // Update existing guest
      response = await fetch(`/api/admin/invitees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }

    if (!response.ok) {
      throw new Error('Failed to save guest');
    }

    const result = await response.json();

    // Reload data
    await loadStats();

    if (id === 'new' && result.unique_code) {
      const link = `${window.location.origin}/?code=${result.unique_code}`;
      alert(`Guest added successfully!\n\nUnique link: ${link}`);
    }
  } catch (error) {
    console.error('Error saving guest:', error);
    alert('Error saving guest. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Save';
  }
}

// Delete guest
async function deleteGuest(id, name) {
  if (!confirm(`Are you sure you want to delete ${name}? This will also delete all their tracking data.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/invitees/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete guest');
    }

    await loadStats();
  } catch (error) {
    console.error('Error deleting guest:', error);
    alert('Error deleting guest. Please try again.');
  }
}

// Edit group (redirects to editing first person in group)
function editGroup(firstInviteeId) {
  const row = document.querySelector(`tr[data-id="${firstInviteeId}"]`);
  if (row) {
    const editBtn = row.querySelector('.edit-btn');
    if (editBtn) {
      editRow(editBtn);
    }
  }
}

// Delete entire invite_master group
async function deleteGroup(inviteMaster) {
  // Find all invitees in this group
  const inviteesInGroup = guestData.filter(inv =>
    (inv.invite_master || inv.name) === inviteMaster
  );

  if (inviteesInGroup.length === 0) {
    alert('No guests found in this group');
    return;
  }

  const namesList = inviteesInGroup.map(inv =>
    `${inv.first_name || ''} ${inv.last_name || ''}`
  ).join(', ');

  if (!confirm(`Are you sure you want to delete the entire group "${inviteMaster}"?\n\nThis includes: ${namesList}\n\nThis will also delete all their tracking data.`)) {
    return;
  }

  try {
    // Delete each invitee in the group
    for (const invitee of inviteesInGroup) {
      const response = await fetch(`/api/admin/invitees/${invitee.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${invitee.first_name} ${invitee.last_name}`);
      }
    }

    await loadStats();
  } catch (error) {
    console.error('Error deleting group:', error);
    alert('Error deleting group. Please try again.');
  }
}

// Load and display statistics
async function loadStats() {
  try {
    const response = await fetch('/api/admin/stats');
    const data = await response.json();

    // Store data
    guestData = data;

    console.log('Loaded guest data:', data);

    // Calculate summary statistics
    const totalInvitees = data.length;

    // Calculate total views: sum view_count per unique_code (not per person)
    const uniqueCodeViews = {};
    data.forEach(inv => {
      if (!uniqueCodeViews[inv.unique_code]) {
        uniqueCodeViews[inv.unique_code] = inv.view_count;
      }
    });
    const totalViews = Object.values(uniqueCodeViews).reduce((sum, count) => sum + count, 0);

    // Calculate confirmed count: group by invite_master and count people who said "planning"
    const inviteMasterGroups = {};
    data.forEach(inv => {
      const master = inv.invite_master || inv.name;
      if (!inviteMasterGroups[master]) {
        inviteMasterGroups[master] = {
          invitees: [],
          mostRecentResponse: null,
          mostRecentDate: null
        };
      }
      inviteMasterGroups[master].invitees.push(inv);

      // Track the most recent response across all invitees in this group
      if (inv.response_type && inv.last_clicked) {
        const clickedDate = new Date(inv.last_clicked);
        if (!inviteMasterGroups[master].mostRecentDate || clickedDate > inviteMasterGroups[master].mostRecentDate) {
          inviteMasterGroups[master].mostRecentResponse = inv.response_type;
          inviteMasterGroups[master].mostRecentDate = clickedDate;
        }
      }
    });

    // Count confirmed people (those whose invite_master has most recent response = "planning")
    let totalConfirmed = 0;
    Object.values(inviteMasterGroups).forEach(group => {
      if (group.mostRecentResponse === 'planning') {
        // Count the number of people in this group (1 or 2)
        totalConfirmed += group.invitees.length;
      }
    });

    // Count invite_master groups with views - only for groups with sent emails
    const sentGroups = Object.values(inviteMasterGroups).filter(group =>
      group.invitees.some(inv => inv.email_status === 'sent')
    );
    const groupsWithViews = sentGroups.filter(group =>
      group.invitees.some(inv => inv.view_count > 0)
    ).length;
    const totalSentGroups = sentGroups.length;
    const viewRate = totalSentGroups > 0 ? Math.round((groupsWithViews / totalSentGroups) * 100) : 0;

    // Update summary cards
    document.getElementById('totalInvitees').textContent = totalInvitees;
    document.getElementById('totalViews').textContent = totalViews;
    document.getElementById('totalClicks').textContent = totalConfirmed;
    document.getElementById('viewRate').textContent = `${viewRate}%`;

    // Save checkbox state before rebuilding table
    const checkedInviteMasters = new Set();
    document.querySelectorAll('.row-checkbox:checked').forEach(cb => {
      checkedInviteMasters.add(cb.dataset.inviteMaster);
    });

    // Populate table - group by invite_master to show one row per group
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="11" class="loading">No guests found. Click "+ Add Guest" to add your first guest.</td></tr>';
      return;
    }

    // Display one row per invite_master group
    Object.keys(inviteMasterGroups).forEach((masterName, groupIndex) => {
      const group = inviteMasterGroups[masterName];
      const row = createGroupDisplayRow(group, groupIndex);
      tableBody.appendChild(row);
    });

    // Restore checkbox state
    checkedInviteMasters.forEach(masterName => {
      const checkbox = document.querySelector(`.row-checkbox[data-invite-master="${masterName}"]`);
      if (checkbox && !checkbox.disabled) {
        checkbox.checked = true;
      }
    });

    // Update send button count
    updateSendButton();

  } catch (error) {
    console.error('Error loading stats:', error);
    document.getElementById('tableBody').innerHTML = '<tr><td colspan="11" class="loading">Error loading data</td></tr>';
  }
}

// Copy link to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Link copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

// Add guest button handler
document.getElementById('addGuestBtn').addEventListener('click', function() {
  // Check if there's already a new row
  const existingNewRow = document.querySelector('.new-row');
  if (existingNewRow) {
    existingNewRow.querySelector('input').focus();
    return;
  }

  const tableBody = document.getElementById('tableBody');
  const newRow = createNewRow();
  tableBody.insertBefore(newRow, tableBody.firstChild);
  newRow.querySelector('input').focus();
});

// Refresh button handler
document.getElementById('refreshBtn').addEventListener('click', loadStats);

// Bulk import functionality
let parsedGuests = [];

function openBulkImportModal() {
  document.getElementById('bulkImportModal').classList.remove('hidden');
  document.getElementById('bulkImportData').value = '';
  document.getElementById('previewSection').classList.add('hidden');
  document.getElementById('confirmImportBtn').classList.add('hidden');
  parsedGuests = [];
}

function closeBulkImportModal() {
  document.getElementById('bulkImportModal').classList.add('hidden');
  document.getElementById('bulkImportData').value = '';
  document.getElementById('previewSection').classList.add('hidden');
  document.getElementById('confirmImportBtn').classList.add('hidden');
  parsedGuests = [];
}

function parseExcelData(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    return { error: 'Not enough data. Please include at least a header row and one data row.' };
  }

  // Parse header row
  const headerRow = lines[0].split('\t');

  // Expected columns (case insensitive)
  const expectedColumns = {
    invite_master: ['invite master', 'invitemaster', 'master', 'invite', 'group'],
    first_name: ['first name', 'firstname', 'first'],
    last_name: ['last name', 'lastname', 'last'],
    partner_first_name: ['partner first', 'partner first name', 'partner firstname'],
    partner_last_name: ['partner last', 'partner last name', 'partner lastname'],
    email: ['email', 'e-mail', 'e mail']
  };

  // If no headers found, try to auto-detect based on position
  let autoDetectMode = false;

  // Map header indices to our fields
  const columnMap = {};
  headerRow.forEach((header, index) => {
    const cleanHeader = header.trim().toLowerCase();
    for (const [field, variations] of Object.entries(expectedColumns)) {
      if (variations.includes(cleanHeader)) {
        columnMap[index] = field;
        break;
      }
    }
  });

  // Check if we have required fields
  const hasFirstName = Object.values(columnMap).includes('first_name');
  const hasLastName = Object.values(columnMap).includes('last_name');
  const hasInviteMaster = Object.values(columnMap).includes('invite_master');

  // If missing required fields, try auto-detect mode
  if (!hasFirstName || !hasLastName || !hasInviteMaster) {
    // Check if first row might be data (not headers)
    const firstDataLine = lines[1]?.split('\t') || [];

    // If we have 5 columns, assume: First Name | Last Name | Name | Invite Master | Email
    if (headerRow.length === 5) {
      columnMap[0] = 'first_name';
      columnMap[1] = 'last_name';
      // Skip column 2 (derived name)
      columnMap[3] = 'invite_master';
      columnMap[4] = 'email';
      autoDetectMode = true;
      console.log('Auto-detected 5-column format: First | Last | Name | Invite Master | Email');
    } else {
      return {
        error: 'Missing required columns. Please include "Invite Master", "First Name" and "Last Name" columns, or use the format: First Name | Last Name | Name | Invite Master | Email'
      };
    }
  }

  // Parse data rows (start from 0 if auto-detect, else 1)
  const guests = [];
  const startLine = autoDetectMode ? 0 : 1;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const columns = line.split('\t');
    const guest = {
      invite_master: null,
      first_name: null,
      last_name: null,
      partner_first_name: null,
      partner_last_name: null,
      email: null
    };

    columns.forEach((value, index) => {
      const field = columnMap[index];
      if (field) {
        guest[field] = value.trim() || null;
      }
    });

    // Only add if we have required fields
    if (guest.invite_master && guest.first_name && guest.last_name) {
      guests.push(guest);
    }
  }

  if (guests.length === 0) {
    return { error: 'No valid guest data found. Make sure each row has at least Invite Master, First Name and Last Name.' };
  }

  return { guests };
}

function previewImport() {
  const data = document.getElementById('bulkImportData').value;

  if (!data.trim()) {
    alert('Please paste your guest data first.');
    return;
  }

  const result = parseExcelData(data);

  if (result.error) {
    alert(result.error);
    return;
  }

  parsedGuests = result.guests;

  // Show preview
  document.getElementById('previewCount').textContent = parsedGuests.length;
  const previewTableBody = document.getElementById('previewTableBody');
  previewTableBody.innerHTML = '';

  parsedGuests.forEach((guest, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${guest.invite_master || '-'}</td>
      <td>${guest.first_name || '-'}</td>
      <td>${guest.last_name || '-'}</td>
      <td>${guest.email || '-'}</td>
    `;
    previewTableBody.appendChild(row);
  });

  document.getElementById('previewSection').classList.remove('hidden');
  document.getElementById('confirmImportBtn').classList.remove('hidden');
}

async function confirmImport() {
  if (parsedGuests.length === 0) {
    alert('No guests to import. Please preview first.');
    return;
  }

  const mode = document.querySelector('input[name="importMode"]:checked').value;

  let confirmMessage = `Are you sure you want to import ${parsedGuests.length} guest(s)?\n\n`;
  if (mode === 'replace') {
    confirmMessage += 'WARNING: This will DELETE ALL existing guests and their tracking data!';
  } else {
    confirmMessage += 'This will ADD to your existing guest list.';
  }

  if (!confirm(confirmMessage)) {
    return;
  }

  const confirmBtn = document.getElementById('confirmImportBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Importing...';

  try {
    const response = await fetch('/api/admin/invitees/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guests: parsedGuests,
        mode: mode
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to import guests');
    }

    const result = await response.json();

    closeBulkImportModal();
    await loadStats();

    alert(`Success! Imported ${result.count} guest(s).`);
  } catch (error) {
    console.error('Error importing guests:', error);
    alert(`Error: ${error.message}`);
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm Import';
  }
}

// Email Preview Functions
async function showEmailPreview(inviteMaster) {
  try {
    const response = await fetch(`/api/admin/email-preview/${encodeURIComponent(inviteMaster)}`);

    if (!response.ok) {
      throw new Error('Failed to load email preview');
    }

    const data = await response.json();

    // Populate modal fields
    document.getElementById('emailTo').textContent = data.to_emails;
    document.getElementById('emailInviteMaster').textContent = data.invite_master;
    document.getElementById('emailTrackingCode').textContent = data.unique_code;

    // Set status badge
    const statusBadge = document.getElementById('emailStatus');
    statusBadge.textContent = data.status;
    statusBadge.className = 'status-badge ' + data.status;

    // Populate guests list
    const guestsList = document.getElementById('guestsList');
    guestsList.innerHTML = '';
    data.guests.forEach(guest => {
      const li = document.createElement('li');
      li.textContent = `${guest.name}${guest.email ? ' (' + guest.email + ')' : ''}`;
      guestsList.appendChild(li);
    });

    // Load the actual email HTML into the iframe
    const iframe = document.getElementById('emailHtmlFrame');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(data.html_content);
    iframeDoc.close();

    // Show modal
    document.getElementById('emailPreviewModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading email preview:', error);
    alert('Error loading email preview. Please try again.');
  }
}

function closeEmailPreviewModal() {
  document.getElementById('emailPreviewModal').classList.add('hidden');
}

// Update send button based on checkbox selection
function updateSendButton() {
  const checkboxes = document.querySelectorAll('.row-checkbox:not(:disabled)');
  const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
  const sendBtn = document.getElementById('sendSelectedBtn');

  sendBtn.disabled = checkedBoxes.length === 0;
  sendBtn.textContent = `✉️ Send Selected (${checkedBoxes.length})`;
}

// Select all checkbox handler
function toggleSelectAll() {
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const checkboxes = document.querySelectorAll('.row-checkbox:not(:disabled)');

  checkboxes.forEach(checkbox => {
    checkbox.checked = selectAllCheckbox.checked;
  });

  updateSendButton();
}

// Email sending functions
async function sendTestEmail() {
  const btn = document.getElementById('sendTestEmailBtn');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    const response = await fetch('/api/admin/email/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (result.success) {
      alert(`✅ Test email sent successfully!\n\nMessage ID: ${result.messageId}\n\nCheck your inbox at ${result.to}`);
    } else {
      alert(`❌ Failed to send test email:\n\n${result.error}`);
    }
  } catch (error) {
    alert(`❌ Error sending test email:\n\n${error.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = '📧 Send Test Email';
  }
}

// Send selected emails
async function sendSelectedEmails() {
  const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
  if (checkedBoxes.length === 0) {
    alert('Please select at least one invite to send.');
    return;
  }

  const inviteMasters = Array.from(checkedBoxes).map(cb => cb.dataset.inviteMaster);

  // Show progress modal
  const modal = document.getElementById('emailProgressModal');
  const progressFill = document.getElementById('progressFill');
  const progressMessage = document.getElementById('progressMessage');
  const progressStats = document.getElementById('progressStats');
  const sendResults = document.getElementById('sendResults');
  const resultsContent = document.getElementById('resultsContent');
  const closeBtn = document.getElementById('closeProgressBtn');

  modal.classList.remove('hidden');
  progressFill.style.width = '0%';
  progressMessage.textContent = 'Starting to send emails...';
  progressStats.textContent = `0 of ${inviteMasters.length} sent`;
  sendResults.classList.add('hidden');
  closeBtn.classList.add('hidden');

  try {
    const response = await fetch('/api/admin/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteMasters })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let successCount = 0;
    let failCount = 0;
    const results = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;

        const data = JSON.parse(line.substring(6));

        if (data.type === 'progress') {
          const percent = (data.current / data.total) * 100;
          progressFill.style.width = `${percent}%`;
          progressMessage.textContent = `Sending to ${data.inviteMaster}...`;
          progressStats.textContent = `${data.current} of ${data.total} sent`;
        } else if (data.type === 'result') {
          results.push(data);
          if (data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } else if (data.type === 'complete') {
          progressMessage.textContent = 'Email sending complete!';

          // Show results
          resultsContent.innerHTML = `
            <p><strong>✅ Successful:</strong> ${successCount}</p>
            <p><strong>❌ Failed:</strong> ${failCount}</p>
            ${results.filter(r => !r.success).length > 0 ? `
              <div style="margin-top: 10px;">
                <strong>Errors:</strong>
                <ul>
                  ${results.filter(r => !r.success).map(r => `<li>${r.inviteMaster}: ${r.error}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          `;
          sendResults.classList.remove('hidden');
          closeBtn.classList.remove('hidden');
        }
      }
    }

    // Refresh data to update email status
    await loadStats();

    // Uncheck all checkboxes
    checkedBoxes.forEach(cb => cb.checked = false);
    document.getElementById('selectAllCheckbox').checked = false;
    updateSendButton();

  } catch (error) {
    progressMessage.textContent = 'Error sending emails';
    resultsContent.innerHTML = `<p style="color: #dc3545;">❌ Error: ${error.message}</p>`;
    sendResults.classList.remove('hidden');
    closeBtn.classList.remove('hidden');
  }
}

// Close progress modal
function closeProgressModal() {
  document.getElementById('emailProgressModal').classList.add('hidden');
}

// Reset stats
async function resetStats() {
  // Check if any emails have been sent
  const hasSentEmails = guestData.some(g => g.email_status === 'sent');

  if (hasSentEmails) {
    alert('⚠️ Cannot reset stats - some invitations have already been sent.\n\nTo preserve data integrity, stats can only be reset when no emails have been sent.');
    return;
  }

  if (!confirm('Are you sure you want to reset all page views and response data?\n\nThis action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch('/api/admin/reset-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (result.success) {
      alert('✅ Stats reset successfully!');
      await loadStats();
    } else {
      alert(`❌ Failed to reset stats:\n\n${result.error}`);
    }
  } catch (error) {
    alert(`❌ Error resetting stats:\n\n${error.message}`);
  }
}

// Bulk import event listeners
document.getElementById('bulkImportBtn').addEventListener('click', openBulkImportModal);
document.getElementById('previewImportBtn').addEventListener('click', previewImport);
document.getElementById('confirmImportBtn').addEventListener('click', confirmImport);

// Email event listeners
document.getElementById('sendTestEmailBtn').addEventListener('click', sendTestEmail);
document.getElementById('sendSelectedBtn').addEventListener('click', sendSelectedEmails);
document.getElementById('selectAllCheckbox').addEventListener('change', toggleSelectAll);
document.getElementById('closeProgressBtn').addEventListener('click', closeProgressModal);
document.getElementById('resetStatsBtn').addEventListener('click', resetStats);

// Close modal when clicking outside
document.getElementById('bulkImportModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeBulkImportModal();
  }
});

document.getElementById('emailPreviewModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeEmailPreviewModal();
  }
});

// Search functionality
function filterByInviteMaster(searchTerm) {
  const rows = document.querySelectorAll('#tableBody tr');
  const term = searchTerm.toLowerCase().trim();

  if (!term) {
    // Show all rows if search is empty
    rows.forEach(row => row.classList.remove('search-hidden'));
    return;
  }

  rows.forEach(row => {
    const inviteMaster = (row.dataset.inviteMaster || '').toLowerCase();
    if (inviteMaster.includes(term)) {
      row.classList.remove('search-hidden');
    } else {
      row.classList.add('search-hidden');
    }
  });
}

// Search box event listeners
document.getElementById('inviteMasterSearch').addEventListener('input', function(e) {
  filterByInviteMaster(e.target.value);
});

document.getElementById('clearSearch').addEventListener('click', function() {
  document.getElementById('inviteMasterSearch').value = '';
  filterByInviteMaster('');
});

// Load stats on page load
loadStats();

// Auto-refresh every 30 seconds
setInterval(loadStats, 30000);
