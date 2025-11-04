// Get URL parameters
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Global variable to store invitee data
let inviteeData = null;

// Fetch invitee data and initialize page
async function init() {
  const code = getQueryParam('code');

  if (!code) {
    document.getElementById('greeting').textContent = 'Hello!';
    return;
  }

  try {
    // Fetch invitee data
    const response = await fetch(`/api/invitee/${code}`);

    if (!response.ok) {
      document.getElementById('greeting').textContent = 'Hello!';
      return;
    }

    inviteeData = await response.json();

    // Display personalized greeting
    document.getElementById('greeting').textContent = `Hello, ${inviteeData.name}!`;

    // Check if they have a previous response
    if (inviteeData.response_type) {
      showPreviousResponse(inviteeData.response_type, inviteeData.response_date);
    }

    // Track page view
    await trackView();

  } catch (error) {
    console.error('Error loading invitee data:', error);
    document.getElementById('greeting').textContent = 'Hello!';
  }
}

// Track page view
async function trackView() {
  if (!inviteeData) return;

  try {
    await fetch('/api/track/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invitee_id: inviteeData.id }),
    });
  } catch (error) {
    console.error('Error tracking view:', error);
  }
}

// Track button click with response type
async function trackClick(responseType) {
  if (!inviteeData) return;

  try {
    await fetch('/api/track/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invitee_id: inviteeData.id,
        response_type: responseType
      }),
    });
  } catch (error) {
    console.error('Error tracking click:', error);
  }
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Show previous response
function showPreviousResponse(responseType, responseDate) {
  const planningButton = document.getElementById('planningButton');
  const unlikelyButton = document.getElementById('unlikelyButton');
  const planningReply = document.getElementById('planningReply');
  const unlikelyReply = document.getElementById('unlikelyReply');

  const formattedDate = responseDate ? ` on ${formatDate(responseDate)}` : '';

  if (responseType === 'planning') {
    planningButton.classList.add('selected');
    planningReply.textContent = `You replied${formattedDate}`;
    planningReply.classList.remove('hidden');
  } else if (responseType === 'unlikely') {
    unlikelyButton.classList.add('selected');
    unlikelyReply.textContent = `You replied${formattedDate}`;
    unlikelyReply.classList.remove('hidden');
  }
}

// Clear previous response indicators
function clearResponseIndicators() {
  const planningButton = document.getElementById('planningButton');
  const unlikelyButton = document.getElementById('unlikelyButton');
  const planningReply = document.getElementById('planningReply');
  const unlikelyReply = document.getElementById('unlikelyReply');

  planningButton.classList.remove('selected');
  unlikelyButton.classList.remove('selected');
  planningReply.classList.add('hidden');
  unlikelyReply.classList.add('hidden');
}

// Handle response button click
async function handleResponse(responseType, button) {
  const confirmMessage = document.getElementById('confirmMessage');
  const allButtons = document.querySelectorAll('.response-button');

  // Disable all buttons temporarily during save
  allButtons.forEach(btn => btn.disabled = true);

  const originalText = button.textContent;
  button.textContent = 'Saving...';

  // Track the click with response type
  await trackClick(responseType);

  // Update the invitee data with new response
  inviteeData.response_type = responseType;

  // Clear old indicators and show new ones
  clearResponseIndicators();

  // Get current date for display
  const currentDate = new Date().toISOString();
  showPreviousResponse(responseType, currentDate);

  // Show confirmation message with appropriate text
  if (responseType === 'planning') {
    confirmMessage.textContent = 'Thank you for your response! We look forward to celebrating with you.';
  } else {
    confirmMessage.textContent = 'Thank you for letting us know. We completely understand, and if your plans change before the official invites, you are most welcome!';
  }
  confirmMessage.classList.remove('hidden');
  button.textContent = originalText;

  // Re-enable buttons to allow changing
  setTimeout(() => {
    allButtons.forEach(btn => btn.disabled = false);

    // Hide confirmation message after 5 seconds
    setTimeout(() => {
      confirmMessage.classList.add('hidden');
    }, 5000);
  }, 500);
}

// Handle "I'm Planning On It" button
document.getElementById('planningButton').addEventListener('click', function() {
  handleResponse('planning', this);
});

// Handle "It's Not Likely" button
document.getElementById('unlikelyButton').addEventListener('click', function() {
  handleResponse('unlikely', this);
});

// Initialize on page load
init();
