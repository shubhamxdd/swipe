# Code Standards

## General

- Keep modules small and single-purpose
- Use async/await over .then() chains
- Handle all error states explicitly — no silent failures
- Prefer pure functions where possible
- Do not mix unrelated concerns in one component or function
- Fix root causes, do not layer workarounds
- Write code for readability first, optimization second

## TypeScript

- Strict mode enabled throughout the project
- Avoid `any` — use explicit interfaces, types, or generics
- Validate external API responses at system boundaries before using them
- Share types between frontend and backend where possible in a shared `types/` directory
- Use branded types for domain primitives where it prevents bugs (e.g., `SpotifyTrackId`, `ISRC`)

## React Native / Expo

- Functional components with hooks — no class components
- Use `StyleSheet.create()` for all styles — no inline style objects
- Separate screen components (in `screens/`) from reusable UI components (in `components/`)
- Keep business logic in hooks or Zustand store actions, not inside components
- Use `React.memo` only when profiling proves a performance benefit
- Components that subscribe to Zustand stores should select the smallest slice needed to avoid unnecessary re-renders
- Use `useCallback` and `useMemo` only when profiling shows a render issue — not preemptively

## Backend (Express)

- Route handlers are thin — delegate all logic to service modules
- Consistent API response shapes:
  - Success: `{ data: T }`
  - Error: `{ error: string, code: string }`
- Validate and parse all request input before any logic runs (use zod)
- Enforce auth on all protected routes before any mutation
- Spotify rate limits (~3 req/sec) must be respected — use a throttle/queue utility in SpotifyService

## Styling

- Use theme tokens from `app/theme/` — no hardcoded colors, radii, or spacing values
- Follow the border radius scale defined in ui-context.md
- All colors, typography, spacing, and radii come from a single Theme object exported from `app/theme/index.ts`

## API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | /api/auth/url | No | Get Spotify OAuth authorization URL |
| POST | /api/auth/callback | No | Exchange OAuth code for tokens |
| POST | /api/auth/refresh | No | Refresh expired access token via refresh token |
| POST | /api/theme | Yes | Submit theme text, receive deck of track candidates |
| POST | /api/playlist | Yes | Save selected tracks as a Spotify playlist |

## File Organization

```
/ (monorepo root)
├── app/                          # React Native frontend
│   ├── components/               # Shared reusable UI components
│   │   ├── SwipeCard.tsx
│   │   ├── Deck.tsx
│   │   ├── PlayButton.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── ThemeInput.tsx
│   │   ├── TrackRow.tsx
│   │   ├── FunFact.tsx
│   │   ├── UndoButton.tsx
│   │   ├── NoPreviewBadge.tsx
│   │   └── ...
│   ├── screens/                  # Screen-level components (one per route)
│   │   ├── HomeScreen.tsx
│   │   ├── SwipeScreen.tsx
│   │   ├── ReviewScreen.tsx
│   │   └── ConfirmationScreen.tsx
│   ├── store/                    # Zustand stores
│   │   ├── authStore.ts
│   │   ├── deckStore.ts
│   │   └── themeStore.ts
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePreviewAudio.ts
│   │   └── useDeck.ts
│   ├── services/                 # API client (HTTP calls to backend)
│   │   └── api.ts
│   ├── theme/                    # Theme tokens
│   │   ├── index.ts              # Exports Theme object
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   └── types/                    # TypeScript types shared within app
│       └── index.ts
├── server/                       # Express backend
│   ├── src/
│   │   ├── routes/               # Express route handlers
│   │   │   ├── auth.ts
│   │   │   ├── theme.ts
│   │   │   └── playlist.ts
│   │   ├── services/             # Business logic
│   │   │   ├── openRouter.ts
│   │   │   ├── spotify.ts
│   │   │   ├── iTunes.ts
│   │   │   └── deck.ts          # Deck assembly, dedup, shuffle
│   │   ├── middleware/           # Express middleware
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   ├── cache/                # In-memory caching
│   │   │   └── index.ts
│   │   ├── types/                # TypeScript types for server
│   │   │   └── index.ts
│   │   └── index.ts             # Server entry point
│   └── tsconfig.json
├── shared/                       # Shared types between frontend and backend
│   └── types.ts
├── context/                      # Context files (this directory)
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-context.md
│   ├── code-standards.md
│   ├── ai-workflow-rules.md
│   └── progress-tracker.md
├── PRD.md
├── package.json                  # Monorepo root package.json (npm workspaces)
└── README.md
```

## Data and Storage

- Refresh tokens → expo-secure-store (encrypted at rest)
- Recent themes → AsyncStorage (non-sensitive)
- Swipe session progress → AsyncStorage (temporary, cleared on session complete)
- No server-side database in MVP
- Cache entries keyed by Spotify track ID
- Cache TTL: 30 days for preview URLs, 7 days for fun facts

## Testing

- Jest for both frontend and backend
- React Native Testing Library for component tests
- Backend services tested with mocked HTTP responses (nock or jest mocks)
- Critical paths to test: OAuth flow, theme→deck pipeline, preview lookup, fun fact generation, playlist save
