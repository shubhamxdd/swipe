# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Frontend reimplementation on Expo SDK 57 (fresh scaffold).

## Current Goal

All core SwipeMix frontend features wired into fresh SDK 57 template.

## Completed

- **App nuked & rebuilt**: Removed old SDK-52-based `app/`, recreated with `create-expo-app@latest` (SDK 57). Monorepo restructured — `app/` no longer a root workspace member.
- **Deps installed**: `expo-audio`, `expo-secure-store`, `expo-auth-session`, `expo-crypto`, `zustand`, `lucide-react-native`, `@react-native-async-storage/async-storage`
- **app.json**: Name/slug/scheme → SwipeMix, dark splash bg (#121212), added plugins
- **babel.config.js**: Added `react-native-worklets/plugin` for Reanimated 4
- **Theme system**: `colors.ts` (Spotify dark), `typography.ts`, `spacing.ts`
- **Types**: `SpotifyTrack`, `ThemeResponse`, `PlaylistSaveResponse`
- **API service**: `api.ts` — auth URL, token polling, theme submission, playlist save
- **PKCE utility**: `pkce.ts` — client-side code verifier/challenge generation (expo-crypto)
- **Stores**: `authStore.ts` (SecureStore-persisted tokens), `deckStore.ts` (swipe deck state + recent themes)
- **Components**: `SwipeCard.tsx` (Gesture.Pan() with spring physics, SKIP/KEEP labels), `ProgressBar.tsx`, `TrackRow.tsx`
- **Routes**:
  - `_layout.tsx` — GestureHandlerRootView + Stack navigator + StatusBar
  - `index.tsx` — Login (WebBrowser.openBrowserAsync + token polling via AppState), theme input, recent theme chips
  - `swipe.tsx` — Card swiping with undo, progress bar, keep/skip buttons, "all done" view
  - `review.tsx` — Kept-track list with remove, save to Spotify, start over
  - `confirmation.tsx` — Success screen with open-in-Spotify + new mix button
- **Cleaned up**: Removed all default Expo template components
- **OAuth flow**: Server-side PKCE + state-based token storage + polling endpoint (GET /api/auth/tokens)
- **Swipe gesture fix**: Gesture.Pan() with `.runOnJS(true)`, key-based component remounting
- **Playlist save fix**: Sends track.id (plain ID) not track.uri (full URI) to match backend contract
- **TypeScript**: `tsc --noEmit` passes cleanly for both app/ and server/
- **Fun facts integration**: Removed (scrapped by user)
- **Polish pass**:
  - Loading screen with theme-relevant animated text ("Digging through the crates for '{theme}'…" cycles through 4 messages)
  - "Finish early" button in swipe screen top bar to end before 30 cards
  - Swipe visual feedback — green (keep) / red (skip) tint overlays on card image that fade in as card is dragged past threshold
  - Card enter animation — opacity 0→1 + scale 0.95→1 with spring on mount
  - NoPreviewBadge — "No Preview" pill on cards without preview clips
  - EmptyDeckMessage — fallback UI with "Try Again" button when search returns zero tracks
  - Haptics — `expo-haptics` impact on swipe threshold cross (medium for keep, light for skip)
  - Accessibility labels & roles on all interactive elements across all screens
- **Components**: Added `NoPreviewBadge.tsx`, `EmptyDeckMessage.tsx`

## In Progress

- None.

## Next Up

Per build order (PRD §11):

1. ~~Wire OAuth end-to-end~~ ✅ Done
2. ~~Wire theme→deck pipeline~~ ✅ Done
3. ~~Playlist save~~ ✅ Done
4. ~~Audio preview~~ ✅ Done (expo-audio play button on album art)
5. ~~Fun facts integration~~ ❌ Scrapped
6. ~~Polish pass~~ ✅ Done
7. **Cross-device testing**: iOS + Android, internal dogfooding

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
