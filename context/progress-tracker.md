# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Backend implementation — Milestones 1–3 complete

## Current Goal

Backend is fully built: OAuth, theme→deck pipeline (with preview enrichment and caching), and playlist save are all implemented and compiling.

## Completed

- Context files written (all 6)
- Monorepo scaffolded (root package.json with npm workspaces)
- Express + TypeScript server set up with health check
- **Milestone 1 — Spotify OAuth**: `/api/auth/url`, `/api/auth/callback`, `/api/auth/refresh` routes with PKCE flow. Server-side code exchange with Basic auth header. Error handling middleware.
- **Milestone 2 — Theme→Search pipeline**: OpenRouter LLM integration (configurable model, default `deepseek/deepseek-chat`), structured seed prompt, parallel Spotify search with rate-limit throttle (350ms between requests), deck assembly (dedup by ID + normalized title/artist, Fisher-Yates shuffle, cap at 30), auto-broadening fallback (drop era → reduce keywords).
- **Milestone 3 — Preview lookup**: iTunes Search API integration with batch lookup (5 at a time), in-memory cache with TTL (30 days for preview URLs, 7 days for fun facts), graceful degradation when no preview found.
- **Milestone 6 — Playlist save**: `/api/playlist` route with create playlist + batch add tracks (100 per request), returns playlist URL for deep linking.

## In Progress

- None.

## Next Up

**Milestone 4 — Swipe UI (frontend)**
- Scaffold Expo + React Native app in `app/`
- Build swipe card component with react-native-gesture-handler + reanimated
- Wire to mock deck first, then to real backend
- Home screen with theme input
- Audio preview with expo-av
- Basic error/loading states

## Open Questions

All resolved for MVP:

| Question | Decision |
|---|---|
| Deck size default | 30 cards |
| Finish early behavior | Drop to review screen (passive) |
| Monetization plans | None for MVP |
| History scope | Recent themes only (last 10, local storage) |
| Backend cache type | In-memory Map |
| Backend runtime | Express |
| UI direction | Spotify-themed (dark, green/black/white) |
| Language | TypeScript (frontend + backend) |
| State management | Zustand |
| Project structure | Monorepo (app/ + server/) |
| Testing framework | Jest |
| Backend hosting | Railway |
| Font | Inter (custom) |
| LLM provider | OpenRouter (free model for MVP, default: deepseek/deepseek-chat) |
| Spotify API cost | Free |
| iTunes Search API cost | Free |

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo | app/ + server/ in one repo | Shared types, simpler orchestration, single version control |
| No database | None (in-memory cache only) | MVP doesn't need persistence beyond on-device storage |
| Zustand over Context | Zustand | Cleaner API, no provider nesting tree, better perf with selectors |
| Express over Fastify | Express | Larger ecosystem, more community resources, sufficient for MVP |
| In-memory cache over Redis | In-memory Map | Zero infra to set up, ideal for single-process MVP on Railway |
| Inter font | Custom font bundle | More consistent cross-platform appearance |
| OpenRouter free model | deepseek/deepseek-chat (configurable) | Zero cost for MVP; upgrade path to paid model if quality needs improvement |
| Skipped endpoints | No spotify recommendations, audio features, or preview URLs | These are permanently unavailable for new Spotify apps (Nov 2024+) |
| iTunes lookup batch size | 5 concurrent requests per batch | Balances speed vs. not hammering the iTunes API |
| Spotify search throttle | 350ms between requests | Stays under ~3 req/sec rate limit with headroom |
| Deck auto-broaden | Drop era → reduce keywords, max 3 attempts | Implements FR-8 from PRD |

## Session Notes

- Session 1: PRD review, context files defined
- Session 2: Backend built in full — OAuth → theme pipeline → preview lookup → playlist save
- Preview coverage rate validation is still needed (milestone 3 risk) — test with 5–10 diverse themes once the frontend can display results or via direct API calls
- `.env` file has placeholder values — user needs to provide `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `OPENROUTER_API_KEY` for the server to start
