# cardmass

Version: 0.2.0

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
3) Run development server
   - npm run dev (http://localhost:4000)

Core concepts (universal references)
- card: single element with content; drag, edit, archive
- area: labeled territory on a board; placement label per board
- board: a page that has areas around the same initiative
- slug: the board name (unique)
- hashtag: label derived from placements on other boards (display-only)
- spock: virtual inbox area for unplaced cards on that board; never persisted

Notes
- No tests (MVP policy)
- No breadcrumbs (Navigation policy)
- Version is surfaced via NEXT_PUBLIC_APP_VERSION for metadata alignment; it is not shown in the UI navigation
