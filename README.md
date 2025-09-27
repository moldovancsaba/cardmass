# cardmass

Version: 0.7.0

Cardmass lets you classify a shared set of cards across multiple boards (pages). Each board defines areas (labeled territories) for a specific dimension like importance, difficulty, impact, cost, resourcing, etc. A card can have one placement per board, forming an N-dimensional position. Unplaced cards fall into the board's spock area (if present) — a virtual inbox that is never persisted.

Links
- ARCHITECTURE.md — glossary, data model, and file map
- ROADMAP.md — forward-looking plan (grouped by milestone)
- TASKLIST.md — active tasks with owners and expected dates
- RELEASE_NOTES.md — completed releases
- LEARNINGS.md — decisions and migration notes

Quickstart
1) Install dependencies
   - npm install
2) Set up environment
   - .env.local must include MONGODB_URI and (optionally) MONGODB_DBNAME
   - Optional: NEXT_PUBLIC_BASE_URL (for server-side fetch to self)
3) Run development server
   - npm run dev (http://localhost:4000)

Core concepts (universal references)
- card: single element with content; drag, edit, archive
- area: labeled territory on a board; placement label per board
- organization: top-level tenant; all data is scoped by organizationId (UUID v4)
- board: a page that has areas around the same initiative; identified by uuid (UUID v4)
- slug: human-readable label for a board (metadata only; not used in routing)
- hashtag: label derived from placements on other boards (display-only)
- spock: virtual inbox area for unplaced cards on that board; never persisted
- uuid: globally unique identifier (v4) used for organizations, boards, and cards

Notes
- No tests (MVP policy)
- No breadcrumbs (Navigation policy)
- Version is surfaced via NEXT_PUBLIC_APP_VERSION for metadata alignment; it is not shown in the UI navigation
