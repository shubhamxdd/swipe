# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Pre-development — context setup

## Current Goal

Establish project foundation: context files finalized, monorepo scaffolded, dependencies installed.

## Completed

- None yet.

## In Progress

- Context files written and committed

## Next Up

**Milestone 1 — Spotify OAuth end-to-end**
- Register a Spotify Developer application (get Client ID and Client Secret)
- Scaffold the monorepo (root package.json with npm workspaces, app/ and server/ directories)
- Set up Express server with TypeScript, basic health-check route
- Implement backend OAuth routes: `/api/auth/url`, `/api/auth/callback`, `/api/auth/refresh`
- Implement PKCE flow on the frontend (Expo)
- Store refresh token in expo-secure-store
- Verify: user can log in with Spotify, backend receives a valid access token, client can call `/v1/me`

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
| LLM provider | OpenRouter (free model for MVP) |
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
| OpenRouter free model | TBD (DeepSeek V3, Llama 3 70B, or Mistral) | Zero cost for MVP; upgrade path to paid model if quality needs improvement |
| Skipped endpoints | No spotify recommendations, audio features, or preview URLs | These are permanently unavailable for new Spotify apps (Nov 2024+) |

## Session Notes

- Initial session: read PRD.md, clarified open questions with product owner, defined all 6 context files
- Build strictly follows PRD §11 milestone order
- Key technical constraint: Spotify API restrictions for new apps (post-Nov 2024) force an LLM-mediated search pipeline and iTunes-based preview workaround
- Preview coverage rate for iTunes matching is the biggest open technical risk — milestone 3 is designed to validate this early
