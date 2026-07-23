# UI Context

## Theme

Spotify-inspired dark theme. Near-black backgrounds with the signature Spotify green accent. Clean, minimal chrome — album art is the star. The experience should feel fast and tactile, closer to a quick game than a utility.

No light mode in MVP.

## Colors

| Role | Token | Value | Usage |
|---|---|---|---|
| Page background | bg.base | #121212 | Top-level screen backgrounds |
| Surface | bg.surface | #1E1E1E | Cards, input fields, list rows |
| Elevated surface | bg.elevated | #282828 | Modals, dropdowns, pressed states |
| Card highlight | bg.cardHighlight | #333333 | Active card top layer |
| Primary text | text.primary | #FFFFFF | Headings, track titles, primary labels |
| Secondary text | text.secondary | #B3B3B3 | Artist names, secondary info |
| Muted text | text.muted | #727272 | Captions, timestamps, disabled states |
| Spotify green | accent.primary | #1DB954 | Primary accent, buttons, active elements |
| Green hover | accent.hover | #1ED760 | Button pressed/hover states |
| Like (right swipe) | state.like | #1DB954 | Right-swipe tint, liked indicator |
| Skip (left swipe) | state.skip | #FF3B30 | Left-swipe tint |
| Border | border.default | rgba(255,255,255,0.08) | Card borders, dividers |
| Overlay | overlay | rgba(0,0,0,0.6) | Modal backdrops |
| Fun fact bg | surface.fact | #282828 | Fun fact card area |

## Typography

| Role | Font | Weight | Size | Usage |
|---|---|---|---|---|
| Display | Inter | 700 (Bold) | 24px | Screen titles |
| Track title | Inter | 700 (Bold) | 18px | Track name on card |
| Artist name | Inter | 400 (Regular) | 14px | Artist name on card |
| Body | Inter | 400 (Regular) | 14px | Descriptions, fun facts |
| Caption | Inter | 500 (Medium) | 12px | Progress indicator, small labels |
| Button label | Inter | 600 (SemiBold) | 14px | Button text |
| Input text | Inter | 400 (Regular) | 16px | Theme input field text |

## Border Radius

| Context | Value |
|---|---|
| Small UI (buttons, chips, badges) | 8px |
| Cards | 12px |
| Modals / overlays | 16px |
| Album art | 4px |
| Input field | 12px |

## Component Library

Custom React Native components built with StyleSheet.create and theme tokens from `app/theme/`. Key components:

| Component | Description |
|---|---|
| `SwipeCard` | Individual swipeable track card — album art, title, artist, play button, fun fact |
| `Deck` | Card stack manager — handles swipe gestures, progress, deck lifecycle |
| `PlayButton` | Preview audio control — circular play/pause icon |
| `ProgressBar` | "X of 30" progress with thin green bar |
| `ThemeInput` | Home screen text input with "What's the vibe?" placeholder |
| `RecentChip` | Tappable recent theme chip for quick restart |
| `TrackRow` | Review screen list item with drag handle and remove button |
| `FunFact` | Expandable fun fact area with shimmer loading state |
| `UndoButton` | Single-level undo — subtle pill near bottom of swipe screen |
| `NoPreviewBadge` | "No preview available" badge on cards without clips |
| `SaveButton` | Primary "Save to Spotify" CTA button (green filled) |
| `FinishEarlyButton` | Text button in swipe screen header |
| `EmptyDeckMessage` | Fallback UI when no tracks found for a theme |

## Layout Patterns

- **Home screen**: Full viewport. Centered vertically. Large "What's the vibe?" label, then the ThemeInput below. Horizontal row of RecentChip components beneath. Spotify-branded wordmark top-left.
- **Swipe screen**: Full viewport. ProgressBar top-left, FinishEarlyButton top-right. Card stack centered (single visible card with peek of next card behind). UndoButton near bottom center. No distracting chrome.
- **Review screen**: Scrollable vertical list of TrackRow components with drag handles. Playlist name TextInput at top. SaveButton fixed at bottom.
- **Confirmation screen**: Centered card with playlist artwork, name, track count, "Open in Spotify" green button. Smaller "Back to home" text link below.
- **Loading screen**: Centered spinner + theme-relevant text ("Digging through the crates for 'rainy day coding'…"), looping subtle animation on album art silhouette.

## Icons

Use lucide-react-native. Stroke-based, 1.5px stroke width. Standard sizes:

| Context | Size |
|---|---|
| Inline with text | 16px |
| Button icons | 20px |
| Large buttons | 24px |

Required icon set: Check, X, Play, Pause, Undo, Music, Save, ExternalLink, ChevronLeft, GripVertical, Sparkles (fun fact), RefreshCw, Search, Clock.

## Motion & Haptics

- Swipe cards use spring physics (not linear) — bouncy feel at threshold crossing
- Right-swipe: green tint overlay fades in as card is dragged past threshold; subtle haptic on threshold cross
- Left-swipe: red/gray tint overlay; subtle haptic on threshold cross
- Cards exit with scale-down + fade on swipe completion
- New card enters from bottom with slight spring bounce
- Fun fact expand/collapse: smooth height animation
- Undo: card flies back in from off-screen with spring

## Accessibility

- Every swipe action has a button equivalent (no gesture-only interactions)
- Screen reader labels on all interactive elements
- Sufficient color contrast ratios (WCAG AA minimum)
- Focus indicators on all tappable elements
- Reduced motion setting respected (disable spring animations)
