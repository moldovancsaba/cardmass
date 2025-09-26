# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-26T11:12:46.693Z
Author: ai

Plan summary — Per-area label text color (Creator → Tagger)
- Implement per-area text color preference (textBlack: true=BLACK, false=WHITE) in Creator’s Areas list.
- Persist textBlack in board.areas and ensure it round-trips via org-scoped boards API.
- Remove Tagger global label text toggle.
- In Tagger, cache per-board, per-label textBlack along with area colors; apply to area label pills and all hashtag badges across inbox and placed cards.
- Verify build remains stable. Update TASKLIST and ROADMAP accordingly.

---

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-25T16:13:14.000Z
Author: ai

Action summary — Purge legacy GridBoard/Kanban and endpoints
- Removed legacy UI routes and components: /use/*, /kanban/*, components/Board (legacy Kanban).
- Removed legacy endpoints: /api/cards, /api/cards/[id], /api/boards/[slug].
- Updated BoardCanvas and TaggerApp to use card.uuid for DnD and PATCH /api/v1/organizations/{orgUUID}/cards/{cardUUID} with header enforcement.
- Updated SPOCK inbox drag to emit uuid-based events.
- Updated docs and version to 0.4.0 (ISO timestamps with ms).

---

Previous entries retained below for context:

Timestamp: 2025-09-20T09:54:50.000Z
Author: ai

Plan summary
- Implement per-board placements via Card.boardAreas.
- Treat 'spock' as a virtual inbox; never persist it.
- GridBoard renders all cards; placement per current board; hashtags from other boards’ placements.
- PATCH /api/cards/:id supports { boardArea: { boardSlug, areaLabel } }.
- SpockBar creation omits areaLabel entirely.
- Documentation updated: ARCHITECTURE.md, ROADMAP.md, TASKLIST.md, LEARNINGS.md.
- Maintenance script to clear legacy 'spock' in areaLabel.

---

Update: 2025-09-20T13:26:40.000Z
Author: ai

Decision summary (Navigation & Timestamps)
- SPOCK bottom bar (boards only): show direct buttons for up to 3 boards (alphabetical), overflow via hamburger (vertical list), plus Admin. No other nav items.
- SpockNav (top): server component; brand + Admin only. Removed Creator link and version badge.
- Links target /use/{slug} for boards and /admin for admin.
- Documentation policy: ISO 8601 with milliseconds in UTC is enforced across all docs; removed CET/localized formats.

Files in scope
- src/app/use/[slug]/page.tsx — fetch board slugs server-side and pass to SPOCK bar
- src/app/use/[slug]/SpockBar.tsx — pass boardSlugs/current board to BottomBar
- src/components/BottomBar.tsx — render board links + overflow + Admin; preserve input
- src/components/SpockNav.tsx — convert to server; brand + Admin
- ROADMAP.md, README.md, ARCHITECTURE.md — updated to reflect ISO timestamps and nav changes
