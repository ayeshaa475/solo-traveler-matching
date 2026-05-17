# Solo Traveler Matching

Detour: An app that helps users engage in their favorite hobbies with others while in a new city. This project aims to make it easier for solo travelers to meet new people based on shared interests and make friends. You post what you want to do, the app matches you with a compatible traveler in the same city, and generates a concrete itinerary for your day together. After the meetup, both travelers rate the experience, and those ratings build a trust score that helps surface more reliable matches in the future.

## How It Works

1. **Post an activity** — describe what you want to do, pick a category (hiking, food, music, art, etc.), and set a city and date.
2. **Get matched** — the matching engine scores other open activities using shared interests and how closely your dates align.
3. **Connect** — send a match request to a traveler whose plans overlap with yours.
4. **Get an itinerary** — once matched, the AI generates a day plan with specific venues, times, and logistics tailored to both travelers.
5. **Leave feedback** — rate the experience and say whether you'd meet again. Ratings feed back into each user's trust score, which influences future matches.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB via Mongoose |
| Auth | JWT (stored in localStorage) |
| AI | Anthropic Claude  |

---

## Prerequisites

- Node.js 18+
- MongoDB running locally or a connection string (e.g. MongoDB Atlas)
- An Anthropic API key

---

## Getting Started

### 1. Clone and enter the repo

```bash
git clone <repo-url>
cd solo-traveler-matching
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/solo-traveler-matching
JWT_SECRET=choose_a_long_random_string
ANTHROPIC_API_KEY=sk-ant-...
NODE_ENV=development
```

### 3. Install dependencies and start the backend

```bash
npm install
npm run dev       # starts on http://localhost:5000
```

### 4. Start the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm start         # starts on http://localhost:3000
```

The frontend proxies all `/api` requests to the backend, so no CORS config is needed in development.

---

## Project Structure

```
.
├── backend/
│   └── src/
│       ├── index.js                  # Express app entry point
│       ├── config/
│       │   └── db.js                 # MongoDB connection
│       ├── middleware/
│       │   └── auth.js               # JWT verification
│       ├── models/
│       │   ├── User.js               # Auth, profile, interests, trust score
│       │   ├── Activity.js           # Posted activities (city, date, category)
│       │   ├── Match.js              # Pairing between two travelers
│       │   ├── Itinerary.js          # AI-generated day plan with stops
│       │   └── Feedback.js           # Post-meetup ratings and comments
│       ├── controllers/              # Route handlers for each resource
│       ├── routes/                   # Express route definitions
│       └── services/
│           ├── matchingService.js    # Scores candidates by interest overlap + date proximity
│           └── aiService.js         # Prompts Claude to generate itinerary JSON
└── frontend/
    └── src/
        ├── App.js                    # Routes and auth guard
        ├── context/
        │   └── AuthContext.js        # Global auth state (login, register, logout)
        ├── services/
        │   └── api.js               # Axios instance — auto-attaches JWT header
        ├── components/
        │   └── Navbar.js
        └── pages/
            ├── HomePage.js           # Landing page
            ├── LoginPage.js
            ├── RegisterPage.js
            ├── ActivitiesPage.js     # Post and browse activities with city/category filters
            ├── MatchesPage.js        # Match candidates + existing matches
            └── ItineraryPage.js      # Itinerary view + feedback form
```

---

## API Reference

### Auth

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/auth/register` | | Create account |
| POST | `/api/auth/login` | | Get JWT token |
| GET | `/api/auth/me` | JWT | Current user profile |

### Activities

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/activities` | | List open activities (filter by `city`, `category`, `date`) |
| GET | `/api/activities/:id` | | Single activity |
| POST | `/api/activities` | JWT | Post a new activity |
| DELETE | `/api/activities/:id` | JWT | Remove your activity |

### Matches

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/matches/find/:activityId` | JWT | Scored list of compatible activities |
| POST | `/api/matches` | JWT | Create a match between two travelers |
| GET | `/api/matches/my` | JWT | All matches you're part of |

### Itinerary

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/itinerary/generate/:matchId` | JWT | Generate AI itinerary for a match |
| GET | `/api/itinerary/:id` | JWT | Retrieve a saved itinerary |

### Feedback

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/feedback` | JWT | Submit feedback for a completed match |
| GET | `/api/feedback/:matchId` | JWT | Get feedback for a match |

---

## Matching

The matching engine (`backend/src/services/matchingService.js`) scores candidate activities against yours on two signals:

- **Shared interests** — +10 points per overlapping interest tag
- **Date proximity** — up to +10 points, dropping by 5 for each day apart

Results come back sorted highest-to-lowest. Trust score weighting — where higher-rated users surface higher in candidate lists — is planned for a future update.

---

## AI Itinerary Generation

When a match is confirmed, the app sends a prompt to Claude containing both travelers' names, interests, activity category, city, and date. Claude returns a JSON object with a summary and an array of stops — each with a time, venue name, description, and duration. The prompt instructs the model to pick specific real venues and account for travel time between stops.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the backend listens on (default `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign and verify tokens |
| `ANTHROPIC_API_KEY` | Anthropic API key for itinerary generation |
| `NODE_ENV` | `development` or `production` |

## AI Usage

Built with Claude Code (Anthropic) for initial scaffolding and development assistance. The Anthropic Claude API is used at runtime to generate itineraries for matched travelers.
