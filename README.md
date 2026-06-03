# Detour
Problem: Solo travelers often want company for a specific activity but have no good way to find it. Existing options like travel forums, hostel bulletin boards, and social media are too broad, not activity-focused, or require significant independent planning. Detour addresses this by matching people on what they actually want to do and reducing the stress of planning.

Detour is an app for solo travelers to find a travel buddy for the day. Post what you want to do and browse activites that others are interested in doing, get matched with another solo traveler in the same city, and get a shared itinerary that is generated with real venues tailored to both of you. After the meetup, ratings build a reputation score that improves future matches.

---

## How It Works

1. **Set up your profile** — pick your interests (hiking, jazz, street food, etc.) so the matching engine knows what you're into.
2. **Post an activity** — describe what you want to do in plain text. An AI intent parsing agent understands your description and suggests real nearby venues via Google Places. Pick one and post.
3. **Get matched** — the matching engine scores other open activities using shared interests, geographic proximity (within 25 miles), date alignment, and trust score.
4. **Connect** — send a match request to a traveler whose plans overlap with yours. The activity owner accepts or declines. Both parties get real-time notifications via Socket.io.
5. **Get an itinerary** — once matched, AI generates a shared day plan using real verified venues within walking distance of your chosen location. Both travelers can propose edits to individual stops, and the other person accepts or rejects each revision in real time.
6. **Leave feedback** — rate the experience after the meetup. A safety agent screens comments for harmful content. Ratings feed into each user's trust score, which influences future match rankings.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios, Socket.io client |
| Backend | Node.js, Express 4, Socket.io |
| Database | MongoDB Atlas via Mongoose |
| Auth | JWT stored in localStorage |
| AI | Cloudflare Workers AI (Llama 3.1 8B Instruct) |
| Venues | Google Places API (Nearby Search + Text Search) |

---

## Agent Architecture

| Agent | File | Description |
|---|---|---|
| Intent Parsing Agent | `backend/src/agents/intentParsingAgent.js` | Converts freeform text into structured activity profile (category, city, date, vibe) used for venue search |
| Itinerary Generation Agent | `backend/src/services/aiService.js` | Fetches real nearby venues via Google Places, then generates a coherent day plan anchored to those venues |
| Itinerary Refinement Agent | `backend/src/agents/itineraryRefinementAgent.js` | Revises individual itinerary stops based on natural language requests from either traveler |
| Safety Agent | `backend/src/agents/safetyAgent.js` | Classifies post-meetup feedback comments as safe, concerning, or harmful and flags accounts accordingly |

All agents call Cloudflare Workers AI (Llama 3.1 8B Instruct) via the Cloudflare REST API.

---

## Match Status State Machine

Matches move through three states: **pending → confirmed → completed**

- **Pending** — match request sent, awaiting activity owner response. Owner sees Accept/Decline. Initiator sees "Awaiting response."
- **Confirmed** — owner accepted. Both travelers can now generate and view the itinerary.
- **Completed** — meetup marked done. Feedback form unlocks for both travelers.

Only the activity owner can advance a match from pending to confirmed. This is a deliberate safety decision — the person who posted controls who joins their activity.

---

## Matching Algorithm

The matching engine scores candidate activities on four signals:

- **Shared interests** — +10 points per overlapping interest tag
- **Geographic proximity** — candidates filtered to within 25 miles using the Haversine formula; falls back to city name comparison when coordinates are unavailable
- **Date proximity** — up to +10 points, dropping by 5 for each day apart
- **Trust score bonus** — `(trustScore - 50) / 10`, adding up to ±5 points

Results are sorted highest to lowest.

---

## Trust Score

Every user starts with a trust score of 50. After each completed meetup with feedback, the rated user's score is recalculated:

```
trustScore = clamp(0–100,  50 + (completedMeetups × 10) + (averageRating − 3) × 5 − (flagCount × 15))
```

| Component | Effect |
|---|---|
| Base | Starts at 50 |
| `completedMeetups × 10` | +10 per successful meetup |
| `(averageRating − 3) × 5` | Rating 5 → +10, rating 3 → 0, rating 1 → −10 |
| `flagCount × 15` | −15 per safety flag |

Flags are only applied when a rating is 2 or below AND the safety agent classifies the comment as `harmful`. A `concerning` classification is logged but does not reduce the score. The trust score feeds back into match ranking via the ±5 point bonus in the matching algorithm.

---

## AI Itinerary Generation

When a match is confirmed, the app calls Cloudflare Workers AI with both travelers' names, interests, activity category, city, and date. Before calling the AI, it fetches real nearby venues from the Google Places Nearby Search API within 1500 meters of the activity's GPS coordinates. Those verified venues are passed to the model as required stops, so the AI writes narrative around real locations rather than inventing them.

Both travelers can propose edits to any stop via a natural language request. The other traveler sees the proposed change and can accept (updating the stop in the database) or reject it (restoring the original). Only one revision can be pending at a time.

---

## Real-Time Features

The backend runs a Socket.io server on the same HTTP port. After login, the frontend connects with a JWT and joins a private room keyed to the user ID. Events pushed in real time:

- Match request received
- Match accepted or declined
- Match status updated
- Itinerary revision proposed
- Itinerary revision accepted or rejected
- Safety flag notification

Notifications are also stored as database documents so users who are offline receive them on next login.

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/ayeshaa475/solo-traveler-matching.git
cd solo-traveler-matching
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Fill in `.env`:

```
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=choose_a_long_random_string
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
GOOGLE_PLACES_API_KEY=your_google_places_api_key
NODE_ENV=development
```

### 3. Start the backend

```bash
npm install
npm run dev
```

### 4. Start the frontend

```bash
cd ../frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000` and proxies `/api` requests to the backend on port 5001.

### 5. Seed demo data

```bash
cd backend
node src/scripts/seed.js
```

Creates 8 traveler profiles and 15 open activities in New York City. Log in with any seed user using password `password123`.

---

## Project Structure

```
.
├── backend/
│   └── src/
│       ├── index.js                          # Express app + Socket.io setup
│       ├── socket.js                         # Socket.io server with JWT auth and user rooms
│       ├── config/db.js                      # MongoDB connection
│       ├── middleware/auth.js                # JWT verification
│       ├── models/
│       │   ├── User.js                       # Auth, interests, trust score, reputation fields
│       │   ├── Activity.js                   # Posted activities with GPS coordinates
│       │   ├── Match.js                      # Pairing with status state machine and initiator field
│       │   ├── Itinerary.js                  # AI day plan with collaborative revision state
│       │   ├── Feedback.js                   # Post-meetup ratings and comments
│       │   └── Notification.js               # Real-time notification records
│       ├── agents/
│       │   ├── intentParsingAgent.js         # Freeform text to structured activity profile
│       │   ├── itineraryRefinementAgent.js   # Per-stop itinerary editing agent
│       │   └── safetyAgent.js                # Feedback moderation and flag classification
│       ├── services/
│       │   ├── matchingService.js            # Scoring algorithm with trust bonus
│       │   └── aiService.js                  # Itinerary generation with Google Places grounding
│       ├── controllers/                      # Route handlers for each resource
│       ├── routes/                           # Express route definitions
│       └── scripts/
│           ├── seed.js                       # NYC demo data
│           └── cleanup.js                    # Remove test accounts and stale data
└── frontend/
    └── src/
        ├── App.js                            # Routes and auth guard
        ├── context/AuthContext.js            # Global auth state
        ├── services/api.js                   # Axios instance with JWT header
        ├── components/Navbar.js              # Nav with real-time notification bell
        └── pages/
            ├── HomePage.js                   # Landing page
            ├── LoginPage.js
            ├── RegisterPage.js
            ├── ProfileSetupPage.js           # Interest selection after registration
            ├── ActivitiesPage.js             # Browse and post activities with AI venue suggestion
            ├── MyPostsPage.js                # Manage your posted activities
            ├── MatchesPage.js                # Role-based match management
            ├── ItineraryPage.js              # Collaborative itinerary view and editing
            └── FeedbackPage.js              # Post-meetup feedback form
```

---

## API Reference

### Auth

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/auth/register` | | Create account |
| POST | `/api/auth/login` | | Get JWT token |
| GET | `/api/auth/me` | JWT | Current user profile |
| PATCH | `/api/auth/profile` | JWT | Update interests |

### Activities

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/activities` | JWT | Browse open activities filtered by GPS radius |
| POST | `/api/activities` | JWT | Post activity with GPS coordinates |
| POST | `/api/activities/parse` | JWT | Parse freeform intent with AI agent |
| POST | `/api/activities/suggest` | JWT | Get Google Places venue suggestions |
| DELETE | `/api/activities/:id` | JWT | Delete your activity |

### Matches

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/matches` | JWT | Send connect request |
| GET | `/api/matches/my` | JWT | Your matches |
| PATCH | `/api/matches/:id/status` | JWT | Advance status (owner only for pending→confirmed) |
| DELETE | `/api/matches/:id` | JWT | Cancel or decline match |

### Itinerary

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/itinerary/generate/:matchId` | JWT | Generate itinerary (returns existing if already generated) |
| GET | `/api/itinerary/:id` | JWT | Get itinerary |
| POST | `/api/itinerary/:id/propose` | JWT | Propose a stop edit |
| PATCH | `/api/itinerary/:id/revision` | JWT | Accept or reject proposed revision |

### Feedback

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/feedback` | JWT | Submit feedback for a completed match |
| GET | `/api/feedback/:matchId` | JWT | Get feedback for a match |

### Notifications

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/notifications` | JWT | Get your notifications |
| PATCH | `/api/notifications/read-all` | JWT | Mark all read |
| PATCH | `/api/notifications/:id/read` | JWT | Mark one read |

---

## Limitations

- Google Places venue quality varies by city and category. Works best in dense urban areas with well-indexed businesses.
- Trust score calibration uses a fixed formula that would benefit from real usage data to tune the weights properly.
- Geographic radius filtering falls back to city name text matching when GPS coordinates are unavailable, which is the case for seed data activities.
- The AI model occasionally cuts off long responses before completing the JSON output. A repair function patches truncated responses automatically, but severely truncated responses may result in fewer stops.

---

## Testing and Validation

- Manually tested the full user flow end to end with two accounts across multiple activity types
- Verified matching scores by seeding users with overlapping and non-overlapping interests and confirming sort order
- Observed JSON truncation errors in backend logs during development, leading to the repair function
- Tested safety agent by submitting low-rated feedback with varying comment content and verified flag behavior"

---

## AI Usage Disclosure

This project was built with assistance from Claude Code (Anthropic) for scaffolding and development.

The following AI services power product features at runtime:

- **Cloudflare Workers AI (Llama 3.1 8B Instruct)** — used by all four agents: intent parsing, itinerary generation, itinerary refinement, and safety classification
- **Google Places API** — venue discovery when posting activities and geographic grounding of AI-generated itineraries
