# SwipeMix

Build Spotify playlists by describing a theme or mood — then swipe through AI-curated tracks Tinder-style. Right to keep, left to skip.

## Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo SDK 57 (TypeScript) |
| Swipe | react-native-gesture-handler + react-native-reanimated |
| Audio | expo-audio (30s iTunes preview clips) |
| Navigation | expo-router (file-based) |
| State | Zustand |
| Backend | Node.js + Express (TypeScript) |
| LLM | OpenRouter (deepseek/deepseek-chat) |
| Track search | Spotify Web API |
| Preview source | iTunes Search API (public) |

## Features

- **Theme-to-playlist in minutes** — type a vibe, get a curated swipe deck
- **Adaptive recommendations** — LLM refines suggestions based on tracks you keep
- **30s preview clips** — play before you keep (iTunes cross-reference)
- **Infinite scroll** — keep swiping; new tracks load adaptively
- **Session resume** — close the app mid-swipe, pick up where you left off
- **Batch mode** — skip swiping entirely, keep all generated tracks
- **Add to existing playlist** — pick from your Spotify library, duplicates auto-skipped
- **Swipe stats** — see kept/skipped counts per session
- **Top-tracks seeding** — LLM biases recommendations toward your listening history
- **AI theme suggester** — sparkles button fills in a random genre/mood
- **Track detail modal** — album info, release year, duration
- **Share playlist** — native share sheet with Spotify link
- **Health indicator** — green/red dot shows API status

## Project Structure

```
swipemix/
├── app/                  # React Native / Expo frontend
│   └── src/
│       ├── app/          # Screens (home, swipe, review, confirmation, settings)
│       ├── components/   # SwipeCard, TrackDetailModal, TrackRow, etc.
│       ├── store/        # Zustand stores (auth, deck, history)
│       ├── services/     # API client
│       ├── theme/        # Colors, typography, spacing
│       └── types/        # TypeScript interfaces
├── server/               # Express backend
│   └── src/
│       ├── routes/       # auth, theme, playlist, health
│       ├── services/     # OpenRouter, Spotify, iTunes, session, deck
│       ├── middleware/   # auth, error handling
│       ├── cache/        # In-memory preview URL cache
│       └── types/        # TypeScript interfaces
└── context/              # Project docs (architecture, progress, standards)
```

## Setup

### Prerequisites

- Node.js 20+
- Expo CLI (`npx expo`)
- Spotify API credentials (client ID + secret)
- OpenRouter API key

### Environment

```bash
# server/.env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENROUTER_API_KEY=your_openrouter_key
REDIRECT_URI=http://localhost:3000/api/auth/callback
PORT=3000
```

### Install & Run

```bash
# Backend
cd server
npm install
npm run dev

# Frontend (separate terminal)
cd app
npm install
npx expo start
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Health check |
| GET | `/api/auth/url` | No | Get Spotify OAuth URL |
| GET | `/api/auth/tokens` | No | Poll for tokens after auth |
| GET | `/api/auth/refresh` | Bearer | Refresh access token |
| POST | `/api/theme` | Bearer | Generate initial swipe deck |
| POST | `/api/theme/next` | Bearer | Fetch next adaptive batch |
| GET | `/api/theme/suggest` | Bearer | AI theme suggestion |
| GET | `/api/playlist/list` | Bearer | List user's playlists |
| POST | `/api/playlist` | Bearer | Save playlist (new or existing) |

## Spotify API Constraints

Apps registered after Nov 27, 2024 cannot use recommendations, audio features, or preview URLs from Spotify. SwipeMix works around this:

- **Theme → search seeds**: LLM interprets the mood → generates genre/keyword/artist seeds → Spotify `/v1/search`
- **Preview audio**: Cross-references each track against the public iTunes Search API
- **Taste matching**: Uses `/v1/me/top/tracks` + LLM to bias toward user's listening history
