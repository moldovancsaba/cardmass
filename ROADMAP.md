# ROADMAP

Version: v3.2.0

Updated: 2025-09-20T16:14:59.417Z

## Milestone: N-dimensional card placements
- Priority: High
- Dependencies:
  - Types and API support for boardAreas
  - UI changes in GridBoard and SpockBar

### Items
1) Implement per-board placements (boardAreas)
   - Owner: ai
   - Expected: 2025-09-21T12:00:00.000Z
   - Notes: Includes API PATCH for boardArea and client DnD changes.

2) Spock virtual inbox semantics
   - Owner: ai
   - Expected: 2025-09-21T12:00:00.000Z
   - Notes: Never persist 'spock'; fallback rendering only.

3) Hashtag computation from cross-board placements
   - Owner: ai
   - Expected: 2025-09-21T12:00:00.000Z
   - Notes: Exclude current board and any spock.

4) Documentation overhaul (glossary + architecture)
   - Owner: ai
   - Expected: 2025-09-21T13:00:00.000Z
   - Notes: ARCHITECTURE.md, README, governance docs.

5) Data hygiene: clear legacy 'spock' areaLabel
   - Owner: ai
   - Expected: 2025-09-21T14:00:00.000Z
   - Notes: Run scripts/maintenance/clear-spock-area.mjs
