# Product Requirements Document

## SwipeMix — Theme-Based Playlist Builder

**Version:** 1.0 (Draft)
**Date:** July 23, 2026
**Status:** Pre-development
**Owner:** [Your name]

---

## 1. Overview

### 1.1 Summary
SwipeMix is a mobile app (iOS/Android via React Native) that lets users build Spotify playlists by describing a theme or mood in natural language, then swiping through AI-curated song candidates in a Tinder-style card interface. Swipe right to add a song to the playlist, swipe left to skip. At the end of a session, the app creates the playlist directly on the user's Spotify account.

### 1.2 Problem Statement
Building a themed playlist manually is slow: searching track by track, second-guessing whether a song fits, and losing momentum halfway through. Spotify's own auto-generated playlists are formulaic and don't let users curate. There's no fast, tactile, game-like way to *discover and curate* music around a specific vibe in one sitting.

### 1.3 Solution
Combine an LLM's ability to interpret a loosely-described theme ("rainy day coding," "breakup but make it hopeful," "90s road trip") with a fast swipe interface, sourcing real, playable tracks from Spotify and enriching each card with audio preview, artwork, and a short AI-generated fun fact — turning playlist curation into something closer to a quick, satisfying game than a chore.

### 1.4 Goals
- Let a user go from "typed theme" to "finished, saved Spotify playlist" in under 5 minutes
- Make the curation step (deciding what's in/out) fast and enjoyable, not tedious
- Produce playlists that feel genuinely well-matched to the stated theme, not generic
- Ship a working cross-platform MVP quickly, built on tooling that will remain supported

### 1.5 Non-Goals (v1)
- No social features (sharing decks, collaborative swiping, following other users)
- No full-track playback (preview clips only — see §5.4 and Appendix A for why)
- No offline mode
- No support for music services other than Spotify (Apple Music, YouTube Music, etc.)
- No desktop/web client — mobile only

---

## 2. Background & Critical Technical Constraints

This section exists because it materially shapes the product and must be read before scoping any feature. Spotify significantly restricted its Web API for new applications, and this directly affects what SwipeMix can and cannot do out of the box.

### 2.1 Spotify API changes (effective for any app registered after Nov 27, 2024)
Permanently unavailable to new apps:
- `GET /v1/recommendations` — no more "songs like this" from Spotify directly
- Audio Features / Audio Analysis — no more energy/valence/danceability/tempo data
- Related Artists
- Get Featured Playlists / Get Category's Playlists
- `preview_url` — **returns `null` for essentially all tracks** on new API credentials

Additionally, as of the February 2026 changelog, further endpoints and fields were removed (artist top-tracks, new-releases browse, several track object fields including `popularity` and `external_ids`).

### 2.2 What still works
- OAuth 2.0 Authorization Code with PKCE (login flow)
- `GET /v1/search` (full-text search with genre/year/keyword filters)
- `GET /v1/me/top/tracks`, `GET /v1/me/top/artists` (user's own history, usable as seeds)
- Playlist creation and track-adding endpoints
- Track metadata: title, artist(s), album art, ISRC (in most cases), duration

### 2.3 Implication for product design
Because Spotify no longer provides recommendations, audio features, or preview URLs, SwipeMix's core mechanics must be built around a workaround architecture:

| Need | Old approach (no longer available) | SwipeMix approach |
|---|---|---|
| "Songs matching a mood" | `/recommendations` + audio features | LLM interprets theme → search seeds → `/v1/search` |
| Preview audio for swipe cards | `preview_url` from Spotify | Cross-reference track via ISRC/title+artist against Apple's iTunes Search API (still returns 30-sec previews, no auth required) |
| Filtering by "sounds like X" | Audio Features (valence, energy) | LLM-driven keyword/genre/era search terms; no numeric audio filtering in v1 |

This is a known, common workaround in the current developer community (confirmed via Spotify Community forum threads, Feb 2026) — not a novel or fragile hack, but it does mean:
- Not every track will have an available preview clip (iTunes coverage isn't 100%); the UI must handle this gracefully (see §5.4)
- Song matching quality now depends heavily on prompt design for the LLM's theme-interpretation step, not on Spotify's own similarity engine

---

## 3. Target User & Use Cases

### 3.1 Primary user
Someone who listens to music via Spotify, enjoys curating playlists, and wants a fast/fun way to build one around a specific moment, mood, or event rather than scrolling and searching manually.

### 3.2 Core use cases
1. **Mood-based session:** "I want a playlist for studying late at night" → swipe → save
2. **Event-based session:** "Road trip with friends this weekend" → swipe → save
3. **Nostalgia/era session:** "2000s pop-punk" → swipe → save
4. **Emotional processing:** "songs for getting over a breakup" → swipe → save
5. **Iteration:** User doesn't love the first batch of cards, tweaks the theme text, gets a fresh deck

### 3.3 User stories
- As a user, I want to type a theme in plain language so I don't have to think in genres or artist names.
- As a user, I want to swipe quickly through songs so building a playlist feels fast and fun, not like data entry.
- As a user, I want to hear a preview before deciding, so I'm not adding songs blind.
- As a user, I want a small fun fact per song, so the experience feels rewarding beyond just utility.
- As a user, I want the finished playlist to land in my actual Spotify account so I can listen to it anywhere, with anyone.
- As a user, I want to review and adjust my "liked" pile before final save, in case I swiped too fast.

---

## 4. User Flow

```
1. Launch app
2. Log in with Spotify (OAuth, one-time; token refresh thereafter)
3. Home screen: text input — "What's the vibe?"
   (optional: recent/past themes shown as quick-restart chips)
4. User types theme, taps "Build my deck"
5. Loading state (see §5.2 for copy/animation direction)
6. Swipe deck appears:
   - Card = album art + track title + artist + preview waveform/play button + fun fact
   - Swipe right = add to "keep" pile (subtle haptic + visual confirmation)
   - Swipe left = skip
   - Tap card = expand fun fact / replay preview
7. Deck runs out (or user taps "Finish early")
8. Review screen: list of all "kept" tracks, reorderable, removable
9. User names the playlist (default: auto-suggested name from theme) and taps "Save to Spotify"
10. Confirmation screen + "Open in Spotify" deep link
11. Return to home; theme saved to recent list
```

### 4.1 Edge cases to handle in flow
- Deck runs dry (too few results): show message, offer to broaden the theme or auto-expand search seeds
- No preview available for a track: show art + "no preview available" state, still swipeable
- User swipes right on 0 songs: block save, prompt to swipe on more
- Spotify token expired mid-session: silent refresh; if refresh fails, prompt re-login without losing the current deck's swipe progress (cache client-side)
- User closes app mid-deck: persist swipe progress locally, offer to resume on relaunch

---

## 5. Functional Requirements

### 5.1 Authentication
- **FR-1:** App must authenticate users via Spotify OAuth 2.0 Authorization Code Flow with PKCE (required for mobile/public clients — no client secret embedded in-app).
- **FR-2:** Store refresh token securely on-device (Expo SecureStore / Keychain / Keystore).
- **FR-3:** Backend must never expose the Spotify client secret to the client; all token exchange happens server-side.
- **FR-4:** Silent token refresh on expiry without interrupting an active swipe session.

### 5.2 Theme Input & Interpretation
- **FR-5:** Free-text input field, no character limit imposed artificially (reasonable cap e.g. 200 chars).
- **FR-6:** On submit, backend sends the theme to Claude (via Anthropic API) with a structured prompt requesting:
  - 3–6 genre tags
  - 5–10 mood/keyword descriptors
  - Optional era/year range
  - Optional list of representative artist names (as search seeds, not guarantees)
  - A short playlist name suggestion
  - Response must be returned as strict JSON for reliable parsing.
- **FR-7:** Loading state must show engaging, theme-relevant copy (e.g., "Digging through the crates for 'rainy day coding'…") while the search pipeline runs.
- **FR-8:** If Claude's interpretation yields too few usable search results, backend should auto-broaden (drop era filter first, then reduce keyword specificity) before surfacing an empty-deck error to the user.

### 5.3 Track Sourcing
- **FR-9:** Backend fans out multiple `/v1/search` queries (by genre, keyword, artist seed, era) in parallel, respecting Spotify rate limits (~3 req/sec sustained).
- **FR-10:** Deduplicate results by track ID and by (normalized title + primary artist) to catch remasters/duplicates.
- **FR-11:** Shuffle and cap the deck at a sensible size for a session (recommend 30–50 cards; configurable).
- **FR-12:** Filter out tracks already present in the user's existing playlists if a "avoid duplicates" preference is enabled (v1.1 candidate, not required for MVP — flag as stretch).

### 5.4 Preview Audio
- **FR-13:** For each candidate track, backend queries the iTunes Search API (`https://itunes.apple.com/search`) by artist + track name (or ISRC cross-reference where available) to retrieve a `previewUrl`.
- **FR-14:** Cache preview URL lookups (track ID → preview URL, TTL e.g. 30 days) to avoid redundant lookups across sessions/users.
- **FR-15:** If no preview is found, the card must still render and be swipeable — show album art, metadata, and a "no preview available" indicator instead of a play button.
- **FR-16:** Preview audio should auto-play when a card becomes active (top of deck) and stop when swiped away; user can pause/replay via tap.

### 5.5 Fun Facts
- **FR-17:** Backend batches a request to Claude for the current deck (e.g., 10–20 tracks at a time) asking for one short (≤ 2 sentence) fun fact per track — chart trivia, writing/recording backstory, cultural reference, etc.
- **FR-18:** Facts must degrade gracefully — if Claude has no confident fact for an obscure track, return a short, honest, non-fabricated stylistic note instead (explicitly instructed in the prompt to avoid hallucinating specific claims like chart positions or awards).
- **FR-19:** Facts are fetched asynchronously and can lag slightly behind card display (show a lightweight loading shimmer on the fact area, not a blocking spinner).

### 5.6 Swipe Interface
- **FR-20:** Standard swipe-card mechanic: right = keep, left = skip, with clear visual feedback (color tint, icon) as the drag threshold is crossed.
- **FR-21:** Support tap-to-expand for full fun fact text and larger album art.
- **FR-22:** Support undo of the last swipe (single-level undo, e.g., shake gesture or an explicit "undo" button).
- **FR-23:** Progress indicator (e.g., "12 of 40") visible during the session.
- **FR-24:** "Finish early" control always accessible, taking the user to the review screen with whatever's been kept so far.

### 5.7 Review & Save
- **FR-25:** Review screen lists all kept tracks in swipe order; user can remove tracks or reorder via drag.
- **FR-26:** Playlist name field, pre-filled with Claude's suggested name, editable.
- **FR-27:** On save, backend creates a new playlist on the user's Spotify account and adds all kept tracks in order (batched, respecting the 100-tracks-per-request Spotify limit).
- **FR-28:** Confirmation screen with a deep link to open the new playlist directly in the Spotify app.
- **FR-29:** Theme text is stored locally (simple recent-list, last 10) for quick restart — no account/server-side history required for MVP.

### 5.8 Error Handling
- **FR-30:** All Spotify API failures must degrade to a user-legible message, never a raw error dump.
- **FR-31:** Network loss mid-session: swipe state preserved locally; resume on reconnect.
- **FR-32:** Rate-limit backoff handled server-side with exponential retry; user-facing effect should just be a slightly longer loading state, not a failure, up to a reasonable timeout.

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Initial deck should begin populating within 4–6 seconds of theme submission (streaming results in as they resolve is preferred over one big blocking wait) |
| Scalability | Backend should support concurrent sessions without per-user API key coupling (all Spotify calls scoped to the logged-in user's token; Claude/iTunes calls stateless) |
| Security | Client secrets (Spotify, Anthropic) live only on backend; no secrets bundled in the mobile app |
| Privacy | No playlist or theme data shared across users; theme history stored locally on-device only in v1 |
| Platform | iOS 15+, Android 10+ (adjust based on Expo/React Native current support matrix at build time) |
| Accessibility | Swipe actions must have non-gesture equivalents (buttons) for accessibility; standard screen-reader labels on all interactive elements |
| Cost control | Cache aggressively (preview URL lookups, fun facts by track ID) to control Anthropic API and iTunes lookup volume at scale |

---

## 7. Technical Architecture

### 7.1 High-level diagram
```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│  Mobile App      │◄───────►│  Backend Server       │◄───────►│  Spotify Web API │
│  (React Native/  │         │  (Node/Express)       │         │                  │
│  Expo)           │         │                       │         └─────────────────┘
└─────────────────┘         │  - OAuth token mgmt   │         ┌─────────────────┐
                             │  - Theme→seed (Claude)│◄───────►│  Anthropic API   │
                             │  - Search orchestration│         └─────────────────┘
                             │  - Preview lookup      │         ┌─────────────────┐
                             │  - Fun fact generation │◄───────►│  iTunes Search   │
                             │  - Caching layer       │         │  API (public)    │
                             └──────────────────────┘         └─────────────────┘
```

### 7.2 Frontend
- **Framework:** React Native + Expo (managed workflow for MVP speed; eject later only if a native module demands it)
- **Swipe mechanic:** `react-native-gesture-handler` + `react-native-reanimated`, or a maintained swipe-deck library if one fits without fighting its constraints
- **Audio:** `expo-av` for preview playback
- **Navigation:** `react-navigation`
- **Secure storage:** `expo-secure-store` for refresh tokens
- **State management:** React Context or Zustand (lightweight — this app's client state is not complex enough to justify Redux)

### 7.3 Backend
- **Runtime:** Node.js + Express (or Fastify)
- **Responsibilities:**
  - Spotify OAuth code exchange & refresh (holds client secret)
  - Theme interpretation via Anthropic API (Claude)
  - Search orchestration & result merging/deduping
  - iTunes preview lookup + caching
  - Fun-fact batch generation via Anthropic API
  - Playlist creation/track-adding proxy to Spotify (or client calls Spotify directly with its own user token for this step — either is valid; recommend backend-proxied for consistent error handling)
- **Caching:** Redis or a simple persistent key-value store for preview-URL cache and fun-fact cache (keyed by Spotify track ID)
- **Hosting:** Any standard Node-friendly host (Render, Railway, Fly.io, etc. — no unusual infra needs for MVP scale)

### 7.4 Data model (minimal, MVP)

**No user account system required for MVP** — auth is entirely delegated to Spotify OAuth; the backend does not need its own persistent user database beyond token storage for refresh handling if a longer-lived session is desired. If a lightweight persistence layer is used:

```
User
  - spotify_user_id (PK)
  - refresh_token (encrypted at rest)
  - created_at

TrackPreviewCache
  - spotify_track_id (PK)
  - preview_url (nullable)
  - looked_up_at

TrackFactCache
  - spotify_track_id (PK)
  - fun_fact (text)
  - generated_at
```

### 7.5 Key API sequences

**Theme → Deck:**
1. Client → Backend: `POST /api/theme` `{ theme: "rainy day coding" }`
2. Backend → Claude: structured prompt → JSON seeds
3. Backend → Spotify: parallel `/v1/search` calls per seed
4. Backend: dedupe, shuffle, cap deck size
5. Backend → iTunes Search API: preview lookup per track (parallelized, cached)
6. Backend → Client: stream/return deck (tracks + art + preview URLs; fun facts may follow async)
7. Backend → Claude (batched): fun facts for the deck
8. Backend → Client: fun facts pushed/polled in as ready

**Save Playlist:**
1. Client → Backend: `POST /api/playlist` `{ name, track_ids: [...] }`
2. Backend → Spotify: create playlist, batch-add tracks
3. Backend → Client: playlist URL / URI for deep link

---

## 8. Design Direction (MVP)

- **Tone:** playful, fast, low-friction — this should feel closer to a quick game than a utility screen
- **Primary interaction:** the card stack is the star; chrome around it should be minimal
- **Card content hierarchy:** album art (dominant) → track/artist → play control → fun fact (secondary, tappable to expand)
- **Motion:** swipe feedback should be immediate and satisfying (spring physics, subtle haptics on like/skip)
- Detailed visual system (color, type, spacing) to be defined at implementation time — flag for a dedicated design pass before building screens, using the frontend-design conventions for the chosen stack.

---

## 9. Metrics & Success Criteria

### 9.1 MVP success criteria (qualitative, pre-launch)
- A user can go from typed theme to saved Spotify playlist without hitting a dead end, on both iOS and Android
- At least 70% of cards in a typical deck have an available preview (rough quality bar for the ISRC/iTunes matching approach — validate early, this is a real risk, see §10)
- Fun facts read as genuinely interesting more often than generic, in informal testing

### 9.2 Post-launch metrics (if/when there are real users)
- Theme submissions per session
- Swipe-through completion rate (% of deck swiped vs. abandoned)
- Right-swipe rate (like-ratio) — signals whether theme interpretation is producing good matches
- Playlist save rate (decks completed → playlists actually saved)
- Session length
- Return usage (do people come back to build a second playlist)

---

## 10. Risks & Open Questions

| Risk | Impact | Mitigation |
|---|---|---|
| iTunes preview coverage may be lower than expected for niche/non-US-market tracks | Core "swipe on a preview" experience degrades for some themes | Validate coverage rate early with real searches across several themes before committing further design time; have a solid no-preview card state ready regardless |
| Spotify may further restrict API access (pattern of ongoing deprecations) | Sourcing pipeline could break again post-launch | Keep the search/seed logic modular and behind a clean interface so a swap (e.g., to a different metadata provider) doesn't require a rewrite |
| LLM-generated search seeds may sometimes produce narrow or repetitive results | Deck feels stale on some themes | Add the auto-broadening fallback (FR-8); tune prompt with real usage over time |
| Fun-fact hallucination risk (LLM confidently wrong about trivia) | Erodes trust in the feature | Prompt explicitly for honesty/uncertainty; avoid specific verifiable claims (chart positions, awards, dates) unless the model is confident; consider a lightweight fact-checking pass or simply keeping facts stylistic/subjective rather than factual-claim-heavy |
| Spotify Developer app review / extended access | Public release to app stores likely fine on standard access tier for this use case (search + playlist write are not restricted), but confirm current Spotify Developer Terms compliance before submission | Review Spotify's current Developer Policy at build time; this document does not constitute legal confirmation |
| App store review (both platforms have rules about third-party music integrations) | Possible review friction | Research current App Store / Play Store guidelines for music-API-integrated apps before submission |

### 10.1 Open questions for you to decide before/during build
- Deck size default (30? 50?) — affects session length and API cost per session
- Should "finish early" auto-prompt a save, or just drop to review passively?
- Any monetization plans for later (affects whether to build usage tracking now vs. retrofit)?
- Should recent themes be the only history, or is a "past playlists built with SwipeMix" list worth it even without a full account system?

---

## 11. Milestones (suggested build order)

1. **Spotify OAuth working end-to-end** (login → token → basic API call) — foundational, do first
2. **Backend theme→search pipeline** (Claude seed generation → Spotify search → merged deck), testable via API calls/Postman before any UI exists
3. **Preview lookup + caching layer** (iTunes integration) — validate coverage rate here, early, since it's the biggest open risk
4. **Swipe UI** wired to a static/mock deck first, then connected to the real pipeline
5. **Fun facts** integration (can slot in after swipe UI is functional)
6. **Review screen + playlist save**
7. **Polish pass:** loading states, error states, empty-deck handling, undo
8. **Cross-device testing** (iOS + Android), then internal dogfooding before any wider release

---

## Appendix A: Why Preview Clips Require a Workaround

Spotify's `preview_url` field, previously populated for most tracks via the Web API, now returns `null` for all applications registered after November 27, 2024. This is confirmed across multiple threads on Spotify's own developer community forum and is described by Spotify moderators as an intentional (if not fully documented) restriction rather than a bug. There is no official Spotify-provided replacement. The community-suggested workaround — cross-referencing tracks against another catalog that still exposes preview clips, such as Apple's public iTunes Search API — is the approach this PRD adopts. This should be treated as a dependency risk (§10) rather than a guaranteed-stable foundation, since it also relies on a third party's API remaining available and unauthenticated in its current form.

## Appendix B: Glossary
- **ISRC:** International Standard Recording Code — a unique identifier for a specific recording, usable to match the same track across different music catalogs/APIs.
- **PKCE:** Proof Key for Code Exchange — an OAuth extension required for public clients (like mobile apps) that can't securely store a client secret.
- **Deck:** The set of swipeable song cards generated for a single theme session.
