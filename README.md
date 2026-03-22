# BugScope - Error Tracking System

A simple error tracking system built for learning production-level backend development. This project helps capture runtime errors from web applications, organize them intelligently, and provide insights.

## What is BugScope?

When you build a web app and something breaks in production, you need to know:
- What error happened?
- How many times did it happen?
- Which environment (dev/production) did it break in?
- How critical is it?

BugScope answers all these questions automatically. It's like having a monitoring system that never sleeps.

## The Idea

I was learning backend development and wanted to build something real and production-grade. Sentry (a popular error tracking tool) costs money, so I decided to build a simplified version that:
- Captures errors automatically
- Groups similar errors together (not duplicate entries)
- Classifies by severity (high/medium/low)
- Tracks which environment errors come from
- Logs everything professionally

## Tech Stack

### Backend (This Repo)
- Node.js + Express.js - Server
- MongoDB - Database
- Winston - Professional logging
- express-rate-limit - Security (prevent spam)

### Frontend (Coming Next)
- React / Next.js - User interface
- Tailwind CSS - Styling
- Dashboard to visualize errors

### Design
- My designer teammate will handle UI/UX

### AI Integration (Coming Soon)
- Hugging Face API - Explain what errors mean
- Suggest fixes automatically
- Natural language explanations

## Features Implemented

**Error Management:**
- Automatic error capture from frontend
- Group errors by message + stack + severity + environment
- Track first & last seen timestamps
- Count how many times error occurred

**Severity Levels:**
- LOW - Not urgent, can fix later
- MEDIUM - Should fix soon
- HIGH - Critical, needs immediate attention

**Environment Tracking:**
- Development
- Staging
- Production

**Security:**
- Rate limiting (prevent spam attacks)
- Input validation
- CORS protection
- Environment variables for secrets

**Logging:**
- Winston logger saves everything
- JSON formatted logs
- Timestamps on every action
- Separate error-only logs

## How It Works

```
1. Your app breaks (JavaScript error)
   ↓
2. SDK captures the error
   ↓
3. Sends to BugScope backend
   ↓
4. Backend validates the data
   ↓
5. Checks if error already exists
   ↓
6. If YES → increment count
   If NO → create new error
   ↓
7. Save to MongoDB
   ↓
8. Log the action with Winston
   ↓
9. Return success to frontend
```

## Getting Started

### Requirements
- Node.js (v14+)
- MongoDB (free account on MongoDB Atlas)
- npm

### Installation

```bash
# Clone repo
git clone https://github.com/gkverse/bugscope.git
cd bugscope

# Install packages
npm install

# Create .env file
# Add: PORT=5000, MONGO_URI=your_mongodb_url, NODE_ENV=development

# Start server
npm run dev
```

Server runs on `http://localhost:5000`

## API Endpoints

### Send an Error
```
POST /api/errors/log

Body:
{
  "message": "Cannot read property 'name'",
  "stack": "TypeError at line 10",
  "projectId": "my-app",
  "severity": "high",
  "environment": "production"
}

Response:
{
  "success": true,
  "errorId": "63f5a1b2c3d4e5f6g7h8i9j0",
  "count": 1
}
```

### Get All Errors
```
GET /api/errors?projectId=my-app&severity=high&environment=production

Returns list of errors with pagination
```

### Get Statistics
```
GET /api/errors/stats/my-app

Returns:
{
  "bySeverity": {
    "high": 15,
    "medium": 32,
    "low": 48,
    "total": 95
  },
  "byEnvironment": {
    "production": 60,
    "staging": 20,
    "development": 15,
    "total": 95
  }
}
```

## Database Schema

```javascript
Error {
  message: String,          // "Cannot read property..."
  stack: String,            // Stack trace
  severity: String,         // "low" | "medium" | "high"
  environment: String,      // "development" | "staging" | "production"
  count: Number,            // How many times occurred
  projectId: String,        // Which app
  firstSeen: Date,          // When first happened
  lastSeen: Date,           // When last happened
  isActive: Boolean,        // Still happening?
}
```

## Why Database Indexes Matter

When you have 100,000 errors in MongoDB, searching without indexes is slow. So I added:

1. Single field indexes on: projectId, severity, environment
2. Composite index: (projectId, message, stack, severity, environment) - helps group errors quickly
3. Composite index: (projectId, severity, environment, lastSeen) - helps dashboard queries

These make queries 100x faster.

## Security Features

**Rate Limiting:**
- General: 100 requests per 15 minutes
- Error endpoint: 30 requests per minute

This prevents someone from spamming thousands of fake errors to crash the database.

**Input Validation:**
- Check severity is "low", "medium", or "high"
- Check environment is "development", "staging", "production"
- Trim whitespace from message/stack

**CORS:**
- Only allow requests from whitelisted domains
- Prevents random websites from using your API

## Logging

All actions logged with Winston in JSON format.

**combined.log** - everything:
```
{"timestamp":"2026-03-22 13:33:53","level":"info","message":"Error logged (new)","projectId":"my-app","severity":"high"}
```

**error.log** - only errors:
```
{"timestamp":"2026-03-22 13:35:20","level":"error","message":"Database connection failed","error":"Connection timeout"}
```

View logs:
```bash
cat logs/combined.log
cat logs/error.log
tail -f logs/combined.log  # Real-time monitoring
```

## Testing

Use Thunder Client (VS Code extension) to test:

1. POST to `/api/errors/log` with error data
2. GET from `/api/errors?projectId=my-app`
3. GET from `/api/errors/stats/my-app`

## Project Structure

```
bugscope/
├── config/
│   ├── db.js          # Connect to MongoDB
│   └── logger.js      # Winston configuration
├── models/
│   └── Error.js       # Database schema
├── routes/
│   └── errorRoutes.js # API endpoints
├── logs/              # Log files stored here
├── .env               # Secrets (not in git)
├── .gitignore         # What to ignore in git
├── server.js          # Main server
└── package.json       # Dependencies
```

## Next Steps

**Feature 4: Smart Error Grouping**
- Group "Cannot read property X" errors as one type
- Instead of: "Cannot read name", "Cannot read age", "Cannot read email"
- Show them as: "Cannot read property (generic)"

**Feature 5: AI Integration with Hugging Face**
- Send error to Hugging Face API
- Get back: "This error means X"
- Get back: "To fix this, do Y"
- Show explanations on dashboard

**Feature 8: Frontend Dashboard**
- React UI to view all errors
- Charts showing trends
- Filter by severity, environment
- See detailed error information

## What I Learned

Building this project taught me:
- How to design APIs properly
- Database indexing and optimization
- Security best practices (rate limiting, validation)
- Professional logging with structured JSON
- Multi-environment support
- Error handling at scale
- How real production systems work

## Future Ideas

- Email alerts when HIGH severity errors occur
- Slack integration to notify team
- Session recording to see what user was doing
- Error trends (are we getting more errors?)
- Custom error grouping rules
- Dark mode on dashboard
- Mobile app to check errors on the go

## Note

This is a learning project. If you need enterprise error tracking in production, use Sentry or Datadog. This is built to understand how they work under the hood.

## Roadmap

- [x] Feature 2: Error Severity System
- [x] Feature 3: Environment Support
- [x] Feature 6: Rate Limiting
- [x] Feature 7: Winston Logging
- [ ] Feature 4: Smart Error Grouping
- [ ] Feature 5: Hugging Face AI Integration
- [ ] Feature 8: GitHub Setup (this!)
- [ ] Frontend Dashboard
- [ ] Deployment

## Author

Built by me while learning backend development.

GitHub: [@gkverse](https://github.com/gkverse)
