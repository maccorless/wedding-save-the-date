const { Resend } = require('resend');
require('dotenv').config();

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Log that email service is ready
console.log('Email server is ready to send messages (Resend API)');

// Generate HTML email template
function generateEmailHTML(greeting, saveTheDateUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Save the Date - Alfiya & Ken</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Georgia, serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #8B2635 0%, #722F37 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: normal;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .divider {
      width: 100px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #D4A5A5, transparent);
      margin: 30px auto;
    }
    .names {
      font-size: 28px;
      color: #333;
      margin: 20px 0;
      font-weight: normal;
    }
    .subtitle {
      font-size: 18px;
      color: #666;
      font-style: italic;
      margin-bottom: 30px;
    }
    .date-box {
      background: #FFF5EB;
      border-left: 4px solid #8B2635;
      padding: 25px;
      margin: 30px 0;
    }
    .date {
      font-size: 24px;
      color: #8B2635;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .location {
      font-size: 18px;
      color: #666;
    }
    .message {
      font-size: 16px;
      color: #555;
      line-height: 1.6;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background: #8B2635;
      color: white;
      text-decoration: none;
      padding: 15px 40px;
      border-radius: 50px;
      font-size: 18px;
      font-weight: bold;
      margin: 30px 0;
      box-shadow: 0 4px 15px rgba(139, 38, 53, 0.4);
    }
    .footer {
      background: #F5E6D3;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #777;
      font-style: italic;
    }
    @media only screen and (max-width: 600px) {
      .header h1 {
        font-size: 24px;
      }
      .names {
        font-size: 22px;
      }
      .date {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Save the Date</h1>
    </div>

    <div class="content">
      <div class="divider"></div>

      <p class="names">Alfiya and Ken Corless</p>
      <p class="subtitle">Request the pleasure of your company</p>

      <div class="date-box">
        <div class="date">April 4, 2026</div>
        <div class="location">London House, Chicago, IL</div>
      </div>

      <div class="divider"></div>

      <p class="message">
        ${greeting},<br><br>
        We are delighted to invite you to celebrate our wedding! As our celebration falls on Easter Saturday and many of our loved ones are traveling from out of town, we would be grateful for a preliminary sense of headcount.<br><br>
        Please know this is completely non-binding—we understand that plans may change, and we would be delighted to have you join us if your schedule allows.
      </p>

      <a href="${saveTheDateUrl}" class="cta-button">View Your Save-the-Date</a>

      <p class="message" style="font-size: 14px;">
        Formal invitation to follow in January 2026
      </p>
    </div>

    <div class="footer">
      With love,<br>
      Alfiya and Ken
    </div>
  </div>
</body>
</html>
  `;
}

// Send email function
async function sendEmail(toAddresses, inviteMaster, saveTheDateUrl, invitees = []) {
  // Generate greeting from invitee names
  let greeting;

  if (invitees.length === 0) {
    // Fallback to invite master if no invitees provided
    greeting = `Dear ${inviteMaster}`;
  } else if (invitees.length === 1) {
    // Single person: "Dear FirstName LastName"
    const person = invitees[0];
    greeting = `Dear ${person.first_name} ${person.last_name}`;
  } else if (invitees.length === 2) {
    // Two people: "Dear FirstName1 and FirstName2"
    greeting = `Dear ${invitees[0].first_name} and ${invitees[1].first_name}`;
  } else {
    // More than two: use invite master or construct from names
    const firstNames = invitees.map(inv => inv.first_name).filter(name => name);
    if (firstNames.length > 0) {
      greeting = `Dear ${firstNames.join(', ')}`;
    } else {
      greeting = `Dear ${inviteMaster}`;
    }
  }

  // Generate HTML content
  const htmlContent = generateEmailHTML(greeting, saveTheDateUrl);

  // Convert toAddresses to array if it's a string
  const toArray = Array.isArray(toAddresses) ? toAddresses : [toAddresses];

  try {
    const { data, error } = await resend.emails.send({
      from: `Alfiya & Ken <${process.env.EMAIL_FROM || 'noreply@alfiyaandken.com'}>`,
      to: toArray,
      subject: 'Save the Date - Alfiya & Ken - April 4, 2026',
      html: htmlContent
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Test email function (sends to self)
async function sendTestEmail(saveTheDateUrl) {
  const testEmail = process.env.TEST_EMAIL_TO || 'ken@corless.com';
  return sendEmail(testEmail, 'Ken (Test)', saveTheDateUrl);
}

module.exports = {
  sendEmail,
  sendTestEmail
};
