# Solo Traveler Matching

A full-stack app that matches solo travelers for shared activities, generates AI-powered itineraries, and learns from feedback.

## Stack

- **Frontend**: React 18, React Router v6, Axios
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT auth
- **AI**: OpenAI GPT-4o-mini for itinerary generation

## Project Structure

```
.
├── backend/
│   └── src/
│       ├── index.js                # Entry point
│       ├── config/db.js            # MongoDB connection
│       ├── middleware/auth.js      # JWT guard
│       ├── models/                 # User, Activity, Match, Itinerary, Feedback
│       ├── controllers/            # Route handlers
│       ├── routes/                 # Express routers
│       └── services/
│           ├── matchingService.js  # Scoring algorithm
│           └── aiService.js        # OpenAI itinerary generation
└── frontend/
    └── src/
        ├── App.js
        ├── context/AuthContext.js
        ├── services/api.js         # Axios instance with JWT
        ├── components/Navbar.js
        └── pages/
            ├── HomePage.js
            ├── LoginPage.js
            ├── RegisterPage.js
            ├── ActivitiesPage.js   # Browse + post activities
            ├── MatchesPage.js      # Candidate matches + my matches
            └── ItineraryPage.js    # AI itinerary + feedback form
```

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, OPENAI_API_KEY
npm install
npm run dev               # starts on :5000
```

### Frontend

```bash
cd frontend
npm install
npm start                 # starts on :3000, proxies /api → :5000
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | — | Register |
| POST | /api/auth/login | — | Login |
| GET | /api/auth/me | JWT | Current user |
| GET | /api/activities | — | List open activities |
| POST | /api/activities | JWT | Post an activity |
| GET | /api/matches/find/:activityId | JWT | Score candidates |
| POST | /api/matches | JWT | Create a match |
| GET | /api/matches/my | JWT | My matches |
| POST | /api/itinerary/generate/:matchId | JWT | Generate AI itinerary |
| GET | /api/itinerary/:id | JWT | Get itinerary |
| POST | /api/feedback | JWT | Submit feedback |