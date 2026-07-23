# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Frontend implementation — Expo SDK upgraded 52→57, expo-av → expo-audio

## Current Goal

Expo SDK upgraded to latest version with all migration steps applied.

## Completed

- **Expo SDK upgrade 52→57**: `expo@~52.0.0` → `^57.0.8`, React 18.3.1 → 19.2.3, React Native 0.76.7 → 0.86.0
- **Package updates**: All Expo packages updated to SDK 57 compatible versions, `lucide-react-native` 0.460→1.26 (React 19 support), TypeScript 5.3→6.0
- **expo-av → expo-audio migration**: SwipeScreen now uses `useAudioPlayer` + `useAudioPlayerStatus` hooks instead of `Audio.Sound.createAsync`
- **Reanimated 3→4**: Babel plugin changed from `react-native-reanimated/plugin` to `react-native-worklets/plugin`
- **app.json**: Removed `newArchEnabled` (default), added `experiments.reactCompiler: true`, replaced `expo-av` plugin with `expo-audio`
- **Removed deprecated packages**: `expo-av`, `expo-constants` removed from dependencies
- **TypeScript**: Updated tsconfig to match Expo SDK 57 base, all TS errors resolved
- **All expo-doctor checks pass** (20/20)
- **Fix Expo Go crash**: Wrapped root layout in `GestureHandlerRootView` (required by react-native-gesture-handler v2)

## In Progress

- None.

## Next Up

**OAuth deep-link integration**
- Wire the Spotify OAuth PKCE flow to the mobile app (generate PKCE on-device, open browser, handle redirect via expo-linking)
- Test end-to-end flow on actual device
- Fun facts async integration
- Edge case handling (empty deck, no preview, network errors)
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
