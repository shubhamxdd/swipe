# SwipeMix

## Overview

SwipeMix is a mobile app (iOS/Android via React Native) that lets users build Spotify playlists by describing a theme or mood in natural language, then swiping through AI-curated song candidates in a Tinder-style card interface. Swipe right to add a song to the playlist, swipe left to skip. At the end of a session, the app creates the playlist directly on the user's Spotify account.

Building a themed playlist manually is slow — searching track by track, second-guessing whether a song fits. Spotify's own auto-generated playlists are formulaic and don't let users curate. SwipeMix makes curation fast and game-like.

## Goals

1. Let a user go from typed theme to saved Spotify playlist in under 5 minutes
2. Make the curation step fast and enjoyable, not tedious
3. Produce playlists that feel genuinely well-matched to the stated theme
4. Ship a working cross-platform MVP quickly

## Core User Flow

1. Launch app
2. Log in with Spotify (OAuth, one-time; token refresh thereafter)
3. Home screen: text input — "What's the vibe?"
4. User types theme, taps "Build my deck"
5. Loading state with theme-relevant copy
6. Swipe deck appears:
   - Card = album art + track title + artist + preview play button + fun fact
   - Swipe right = add to "keep" pile
   - Swipe left = skip
   - Tap card = expand fun fact / replay preview
7. Deck runs out (or user taps "Finish early")
8. Review screen: list of kept tracks, reorderable, removable
9. User names the playlist and taps "Save to Spotify"
10. Confirmation screen + "Open in Spotify" deep link
11. Return to home; theme saved to recent list

## Features

### Authentication
- Spotify OAuth 2.0 Authorization Code Flow with PKCE
- Refresh token stored securely in expo-secure-store
- Server-side token exchange (client secret never reaches the app)
- Silent refresh mid-session without disrupting swipe progress

### Theme Input & Interpretation
- Free-text input (up to 200 chars)
- Backend sends theme to LLM via OpenRouter (free model for MVP) requesting: 3–6 genre tags, 5–10 mood/keyword descriptors, optional era/year range, optional representative artist seeds, and a playlist name suggestion
- Response returned as strict JSON for reliable parsing
- Loading state shows engaging theme-relevant copy
- Auto-broadening fallback if search yields too few results

### Track Sourcing
- Backend fans out multiple Spotify `/v1/search` queries in parallel (by genre, keyword, artist seed, era)
- Results deduplicated by track ID and normalized title+artist
- Deck shuffled and capped at 30 cards
- Rate-limit aware (~3 req/sec sustained)
- Server-side queuing/throttling for Spotify requests

### Preview Audio
- Backend cross-references each track against iTunes Search API by artist+track name (or ISRC where available) to retrieve a 30-second preview URL
- Preview URL lookups cached in-memory (30-day TTL)
- Tracks without previews still render as swipeable cards with a "no preview available" indicator

### Fun Facts
- Backend batches 10–20 tracks at a time to LLM via OpenRouter for one short (<2 sentence) fun fact per track
- Facts degrade gracefully for obscure tracks (stylistic note instead of hallucinated claims)
- Fetched asynchronously — loading shimmer on fact area, not blocking spinner

### Swipe Interface
- Right = keep, left = skip with visual feedback (color tint, icon) at drag threshold
- Tap card to expand fun fact and enlarge album art
- Single-level undo via explicit button
- Progress indicator ("12 of 30") always visible
- "Finish early" control always accessible
- Non-gesture equivalents (buttons) for accessibility

### Review & Save
- List of kept tracks in swipe order; remove or reorder via drag
- Editable playlist name field (pre-filled from LLM suggestion)
- Playlist created on user's Spotify account with all kept tracks in order
- Confirmation screen with deep link to open in Spotify app
- Recent themes stored locally (last 10) for quick restart

## Scope

### In Scope
- Mobile app on iOS and Android via React Native/Expo (managed workflow)
- Spotify-only music integration
- Preview clips via iTunes Search API cross-reference
- LLM-powered theme interpretation and fun facts via OpenRouter
- In-memory caching on backend for preview URLs and fun facts
- Local device storage for auth tokens and recent themes

### Out of Scope
- Social features (sharing decks, collaborative swiping, following)
- Full-track playback (preview clips only)
- Offline mode
- Support for other music services (Apple Music, YouTube Music, etc.)
- Desktop/web client
- User account system (identity delegated to Spotify)
- Deduplication against existing playlists (v1.1 candidate)
- Monetization

## Success Criteria

1. A user can go from typed theme to saved Spotify playlist without hitting a dead end, on both iOS and Android
2. At least 70% of cards in a typical deck have an available preview
3. Fun facts read as genuinely interesting more often than generic in informal testing
