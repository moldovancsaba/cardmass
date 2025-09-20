# ARCHITECTURE

Version: v3.1.0
Generated: 2025-09-20T15:45:39.720Z

1. Glossary (universal references)
- card: a single element that has content (the thing you drag, edit, archive).
- area: a specific territory on a board, identified by a label (canonical, lowercase). When a card is placed into an area on a given board, that area’s label becomes the card’s placement for that board.
- board: a page defined by a grid of areas around the same initiative.
- slug: the unique name of a board (string), used in routes and in per-board placements.
- hashtag: a label that refers to an N-dimensional position (derived from placements on other boards and shown as #label). Hashtags are not stored as a separate field; they are computed from placements (see below).
- placement: the per-board assignment of a card to an area on a specific board (persisted in boardAreas[boardSlug] = areaLabel).
- spock: a virtual inbox area per board. It is used only for display when a card has no placement on that board. It is never persisted to a card.

2. Data model
- Collection: cards
- Type: CardDoc (server) / Card (client)
  - id/_id: string/ObjectId
  - text: string
  - status: 'delegate' | 'decide' | 'do' | 'decline'
  - order: number
  - createdAt / updatedAt: Date (server) / ISO string (client)
  - boardSlug?: string (legacy creation source, optional)
  - areaLabel?: string (deprecated; legacy single label)
  - boardAreas?: Record<string, string>
    Why: Enables N-dimensional classification by allowing each card to have a placement on each board independently.
    Rule: Never persist 'spock'. Clearing a placement is represented by deleting boardAreas[boardSlug].

3. Core behavior
- Rendering on a board (GridBoard):
  - Build the set of areas for the current board (boxes) and detect whether 'spock' exists.
  - For each card:
    - If boardAreas[currentBoardSlug] exists and matches an area on this board → render under that area.
    - Else, if 'spock' exists on this board → render under 'spock'.
    - Else → do not render this card on this board (hidden here).
  - Hashtags for a card on board X are all placements from other boards (values of boardAreas for slugs != X), prefixed with '#', excluding spock (not persisted).

- DnD on a board (GridBoard):
  - Drop into a non-spock area: PATCH /api/cards/:id with { boardArea: { boardSlug, areaLabel } } and order.
  - Drop into spock: PATCH /api/cards/:id with { boardArea: { boardSlug, areaLabel: '' } } and order (clears placement for that board).

- Creation (SpockBar):
  - POST /api/cards without areaLabel. New cards start unplaced; they appear in 'spock' on boards that have it or are hidden on boards without it.

4. Files and responsibilities
- src/app/use/[slug]/page.tsx
  - Loads the board, computes merged area boxes per label, passes boxes to the client GridBoard.
- src/app/use/[slug]/GridBoard.tsx
  - Client renderer for the board grid with DnD.
  - Fetches all cards (GET /api/cards) and computes per-board grouping.
  - Sends PATCH with boardArea payload on drops.
- src/app/use/[slug]/SpockBar.tsx
  - Bottom SPOCK bar (primary navigation on boards): shows up to 3 direct board links (alphabetical) + Admin, with a hamburger overflow for more; preserves card creation; never persists 'spock'.
- src/app/api/cards/route.ts (GET, POST)
  - Returns Card with boardAreas; accepts POST without areaLabel/spock.
- src/app/api/cards/[id]/route.ts (PATCH, DELETE)
  - PATCH supports { boardArea: { boardSlug, areaLabel } } semantics and avoids persisting 'spock'.
- src/lib/types.ts
  - Declares CardDoc/Card with boardAreas; areaLabel marked deprecated.
- src/components/SpockNav.tsx
  - Server minimal top nav: brand + Admin only (no version badge, no Creator).

5. Naming & casing
- Area labels are canonicalized by Creator and stored lowercase; code treats labels case-insensitively and uses canonical labels from the board definition when making updates.
- Hashtags display using the stored/canonical label value (#label).

6. Non-goals and constraints
- No tests (MVP policy).
- No breadcrumbs (Navigation policy).
- Back-compat: areaLabel remains for legacy; new UI logic ignores it.

7. Operational scripts
- scripts/maintenance/clear-spock-area.mjs: clears any legacy 'spock' persisted in areaLabel.

8. Version
- Surfaced to the client via NEXT_PUBLIC_APP_VERSION for metadata alignment. Not shown in the UI navigation. Keep package.json and docs in sync per Versioning and Release Protocol.
