# Wedding Save-the-Date Web Application

A personalized wedding save-the-date webpage with tracking capabilities. Each invitee gets a unique link that displays their name and tracks when they view the page and click the "I saved the date" button.

## Features

- **Personalized Links**: Each invitee gets a unique URL with their name
- **Page View Tracking**: Automatically tracks when someone views the page
- **Button Click Tracking**: Tracks when someone clicks "I saved the date"
- **Admin Dashboard**: View all tracking data in a beautiful web interface
- **Responsive Design**: Works perfectly on mobile and desktop

## Getting Started

### 1. Add Invitees

Use the utility script to add invitees to the database:

```bash
node utils/add-invitees.js "John Smith" "Jane Doe" "Bob Johnson"
```

This will generate unique links for each person and display them in the console.

### 2. Start the Server

```bash
npm start
```

The server will run on http://localhost:3000

### 3. Access the Admin Dashboard

Visit http://localhost:3000/admin to see:
- Total number of invitees
- Total page views
- Total confirmations
- View rate percentage
- Detailed table with each invitee's activity

### 4. Share the Links

Copy the unique links from the admin dashboard or from the console output when you add invitees. Each link looks like:

```
http://localhost:3000/?code=abc123-unique-code
```

When someone visits their link:
- They'll see a personalized greeting with their name
- Their view is automatically tracked
- They can click "I saved the date" to confirm

## Project Structure

```
.
├── server.js              # Express server with API endpoints
├── database/
│   ├── db.js             # Database initialization and schema
│   └── wedding.db        # SQLite database (created automatically)
├── public/
│   ├── index.html        # Save-the-date page
│   ├── admin.html        # Admin dashboard
│   ├── css/
│   │   ├── style.css     # Save-the-date page styles
│   │   └── admin.css     # Admin dashboard styles
│   └── js/
│       ├── app.js        # Save-the-date page logic
│       └── admin.js      # Admin dashboard logic
└── utils/
    └── add-invitees.js   # Utility to add invitees
```

## Customizing the Save-the-Date

You can customize the save-the-date page by editing:

1. **public/index.html** - Update the wedding details:
   - Change "Coming Soon" to your actual date
   - Update "Location TBD" to your venue
   - Modify the message text

2. **public/css/style.css** - Customize the appearance:
   - Change colors
   - Modify fonts
   - Adjust spacing and layout

## Database Schema

The application uses SQLite with three tables:

- **invitees**: Stores invitee names and unique codes
- **page_views**: Tracks when each invitee views the page
- **button_clicks**: Tracks when each invitee clicks the button

## API Endpoints

- `GET /` - Serve save-the-date page
- `GET /admin` - Serve admin dashboard
- `GET /api/invitee/:code` - Get invitee info by unique code
- `POST /api/track/view` - Track page view
- `POST /api/track/click` - Track button click
- `GET /api/admin/stats` - Get all tracking statistics

## Production Deployment

For production deployment, consider:

1. Change the port in server.js or use environment variable
2. Update the domain in utils/add-invitees.js
3. Use a process manager like PM2
4. Set up proper hosting (e.g., Heroku, DigitalOcean, AWS)
5. Add authentication to the admin dashboard
6. Use HTTPS for security

## Tips

- **Bulk Add Invitees**: You can add multiple invitees at once by listing all names in quotes
- **Copy Links**: Use the "Copy" button in the admin dashboard to easily copy links
- **Auto Refresh**: The admin dashboard auto-refreshes every 30 seconds
- **Mobile Friendly**: The save-the-date page looks great on all devices

## Troubleshooting

**Issue**: Database not found
- **Solution**: The database is created automatically when you first run the server

**Issue**: Links not working
- **Solution**: Make sure the server is running and the unique code is correct

**Issue**: Admin dashboard shows no data
- **Solution**: Add invitees using the utility script first

## License

This is a personal project. Feel free to use and modify for your wedding!
