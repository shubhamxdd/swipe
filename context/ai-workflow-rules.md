# AI Workflow Rules

## Approach

Build incrementally following the build order defined in PRD §11 (and replicated below). Context files define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior not defined in the context files.

## Scoping Rules

- Work on one milestone unit at a time
- Prefer small, verifiable increments over large speculative changes
- Do not combine unrelated system boundaries in a single implementation step
- Each unit must be testable/verifiable before moving on

## When to Split Work

Split an implementation step if it combines:

- Frontend and backend changes in the same step (build and verify the backend route first via API tests, then wire the frontend)
- Multiple unrelated API routes (each route is its own unit)
- Behavior not clearly defined in the context files (resolve ambiguity first)
- A change that cannot be verified end to end quickly

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files
- If a requirement is ambiguous, resolve it in the relevant context file before implementing
- If a requirement is missing entirely, add it as an open question in `progress-tracker.md` before continuing

## Protected Files

Do not modify the following unless explicitly instructed:

- `.agents/skills/*` — skill definitions and workflows
- `node_modules/*` — third-party dependencies
- Generated config files outside the project's scope

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

| Change | File |
|---|---|
| System architecture or boundaries | architecture.md |
| Storage model decisions | architecture.md |
| Code conventions or standards | code-standards.md |
| Feature scope or goals | project-overview.md |
| UI conventions, colors, components | ui-context.md |
| Any completed work | progress-tracker.md |

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope
2. No invariant defined in `architecture.md` was violated
3. `progress-tracker.md` reflects the completed work
4. The project builds without errors (npm run build or equivalent passes)

## Build Order (from PRD §11)

1. **Spotify OAuth end-to-end**: Login → token → basic `/v1/me` API call. Includes backend OAuth routes, PKCE flow on frontend, secure token storage.
2. **Backend theme→search pipeline**: LLM seed generation (OpenRouter) → Spotify `/v1/search` → merged, deduplicated, shuffled deck. Testable via API calls before any UI exists.
3. **Preview lookup + caching layer**: iTunes Search API integration + in-memory cache. Validate preview coverage rate early.
4. **Swipe UI**: Wire to a static/mock deck first, then connect to the real backend pipeline.
5. **Fun facts integration**: Batched LLM call for deck tracks, async delivery to client.
6. **Review screen + playlist save**: Track review, reorder, remove, name, and save to Spotify.
7. **Polish pass**: Loading states, error states, empty-deck handling, undo, edge cases.
8. **Cross-device testing**: iOS + Android, internal dogfooding.
