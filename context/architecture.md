# Architecture Context

## Stack

| Layer | Technology | Role |
|---|---|---|
| Mobile framework | React Native + Expo (TypeScript) | Cross-platform app shell |
| Swipe mechanics | react-native-gesture-handler + react-native-reanimated | Card swipe interaction |
| Audio playback | expo-audio | Preview clip playback |
| Navigation | expo-router | File-based routing |
| Secure storage | expo-secure-store | OAuth refresh tokens |
| State management | Zustand | Client-side state |
| Backend runtime | Node.js + Express (TypeScript) | API server |
| LLM provider | OpenRouter API (free model for MVP) | Theme interpretation + fun facts |
| Music search | Spotify Web API | Track sourcing |
| Preview audio source | iTunes Search API (public, no auth) | 30-sec preview clips |
| Caching | In-memory Map | Preview URL + fun fact cache |
| Hosting | Railway | Backend deployment |

## System Boundaries

- `app/` — React Native frontend (screens, components, store, hooks, theme, API client)
- `server/` — Express backend (routes, services, middleware, cache, types)
- `server/src/routes/` — HTTP route handlers (thin — delegate to services)
- `server/src/services/` — Business logic (OpenRouterService, SpotifyService, iTunesService)
- `server/src/cache/` — In-memory caching layer (preview URLs, fun facts)
- `server/src/middleware/` — Express middleware (auth, error handling, rate limiting)

## Storage Model

- **On-device (expo-secure-store)**: Spotify refresh token (encrypted)
- **On-device (AsyncStorage)**: Recent themes list (last 10), persisted swipe progress for session resume
- **In-memory cache (server)**: Track → preview URL mapping (30-day TTL), Track → fun fact mapping
- **No database**: No persistent user accounts, no server-side history in MVP

## Auth and Access Model

- **Authentication method**: Spotify OAuth 2.0 Authorization Code Flow with PKCE
- **Token flow**: Client requests auth URL from backend → user authorizes on Spotify → callback to backend → backend exchanges code for tokens → access token returned to client, refresh token stored on-device
- **Client secret**: Lives only on the backend — never bundled in the mobile app
- **Token refresh**: Backend handles refresh via `/api/auth/refresh`; access token refreshed without losing swipe session state
- **No app-specific accounts**: Identity fully delegated to Spotify

## High-Level Architecture

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│  Mobile App      │◄───────►│  Backend Server       │◄───────►│  Spotify Web API │
│  (React Native/  │         │  (Node/Express)       │         │                  │
│  Expo)           │         │                       │         └─────────────────┘
└─────────────────┘         │  - OAuth token mgmt   │         ┌─────────────────┐
                             │  - Theme→seed (LLM)  │◄───────►│  OpenRouter API  │
                             │  - Search orchestration│         └─────────────────┘
                             │  - Preview lookup      │         ┌─────────────────┐
                             │  - Fun fact generation │◄───────►│  iTunes Search   │
                             │  - Caching layer       │         │  API (public)    │
                             └──────────────────────┘         └─────────────────┘
```

## Spotify API Constraints (Critical)

Apps registered after Nov 27, 2024 face permanent removal of several endpoints.

### Unavailable
- `GET /v1/recommendations` — no recommendation endpoint
- Audio Features / Audio Analysis — no energy, valence, danceability, tempo
- Related Artists
- Get Featured Playlists / Get Category's Playlists
- `preview_url` — returns null for all tracks on new credentials
- Artist top-tracks and new-releases browse (removed Feb 2026)
- Track `popularity` and `external_ids` fields

### Still Available
- OAuth 2.0 Authorization Code with PKCE
- `GET /v1/search` (full-text search with genre/year/keyword filters)
- `GET /v1/me/top/tracks`, `GET /v1/me/top/artists`
- Playlist creation and track-adding endpoints
- Track metadata: title, artist(s), album art, ISRC (in most cases), duration

### Workaround Architecture

| Need | Old approach (unavailable) | SwipeMix approach |
|---|---|---|
| Songs matching a mood | `/recommendations` + audio features | LLM interprets theme → search seeds → `/v1/search` |
| Preview audio | `preview_url` from Spotify | Cross-reference via ISRC/title+artist against iTunes Search API |
| Filtering by "sounds like X" | Audio Features (valence, energy) | LLM-driven keyword/genre/era search terms |

## Key API Sequences

### Theme → Deck
1. Client → Backend: `POST /api/theme` `{ theme: "rainy day coding" }`
2. Backend → OpenRouter (LLM): structured prompt → JSON seeds
3. Backend → Spotify: parallel `/v1/search` calls per seed (throttled)
4. Backend: deduplicate, shuffle, cap at 30
5. Backend → iTunes Search API: preview lookup per track (parallel, cached)
6. Backend → Client: return deck (tracks + art + preview URLs)
7. Backend → OpenRouter (batched): fun facts for the deck
8. Backend → Client: fun facts pushed as ready (async)

### Save Playlist
1. Client → Backend: `POST /api/playlist` `{ name, track_ids: [...] }`
2. Backend → Spotify: create playlist, batch-add tracks (max 100 per request)
3. Backend → Client: playlist URL / URI for deep link

## Invariants

1. Client secrets (Spotify, OpenRouter) never leave the backend
2. All Spotify API calls are scoped to the logged-in user's access token
3. Swipe state is never lost on token refresh
4. Preview URL lookup failures never block card rendering or swiping
5. LLM responses are validated (parsed as strict JSON) before downstream use
6. Spotify rate limits (~3 req/sec sustained) are respected with queuing/throttling
7. Fun facts avoid hallucinated specific claims (chart positions, awards, dates) by prompt design
