# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-27T12:01:54.000Z
Author: ai

Fix — Allow drops into middle of lists reliably; bump to 0.6.9 (dev)
- Do not override slot hints at area level: removed setDropHint from area onDragOver.
- Stop event propagation on slot dragOver/drop so parent onDrop doesn’t hijack the drop.
- Result: Dropping between any two cards works consistently with correct insertion order.

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-27T13:10:13.000Z
Author: ai

Plan — Card Details simplification + new-tab open; prepare v0.7.0

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-27T15:47:28.000Z
Author: ai

Plan — Enforce global minimum text size baseline (text-sm)
- What: Override small text utilities (text-xs, text-[10px], text-[11px], text-[12px], small) to at least 0.875rem (14px) globally.
- Why: Product requirement to make hashtags, admin microcopy, and any small text legible and consistent with Inbox card content size.
- Governance: Bump to v0.8.0, update docs with ISO 8601 ms timestamps.

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-27T16:12:42.000Z
Author: ai

Plan — Replace card action labels with Material Symbols icons

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-27T17:19:16.000Z
Author: ai

Plan — Resolve Next.js font warnings and type-check path issues
- What: Keep Material Symbols link in app/layout.tsx with display=optional; disable @next/next/no-page-custom-font for this file.
- Why: App Router uses root layout; this avoids the page-only font warning while keeping font loading simple.
- Also: Guarded useSearchParams nullability in CreatorApp to satisfy strict TS checks.
- Governance: Bump to v0.10.0; update docs with ISO timestamps.
- What: Load Google Fonts Material Symbols and replace card action labels 'open, archive, edit, del' with icons 'pageview, archive, edit_note, delete' in both Inbox and placed cards.
- Why: Cleaner UI, consistent iconography.
- Governance: Bump version to v0.9.0, update docs and release notes with ISO timestamps.
- Card page: remove page title and status/order; split created/updated to separate lines; remove action buttons; render all hashtags as a single comma-separated list (deduped, lowercase, excluding 'spock').
- Global behavior: make all Card page links open in a new tab with target="_blank" and rel="noopener noreferrer".
- Governance: bump MINOR to 0.7.0 before commit, update README/ROADMAP/TASKLIST/ARCHITECTURE/LEARNINGS with ISO 8601 timestamps (ms).

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-27T11:49:59.000Z
Author: ai

Plan — Mobile/touch slot affordance + hover background; bump to 0.6.7 (dev)
- Slightly increase slot width on mobile by adding horizontal padding and negative margins at base breakpoint; keep default on sm+.
- Add subtle blue background in active slot while dragging for clearer targeting.
- Governance: bump patch to 0.6.7 and sync timestamps.

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-27T11:42:57.000Z
Author: ai

Plan — Reordering UX: taller slots + pulsing dashed guideline; bump to 0.6.6 (dev)
- Increase between-card slot height during drag for easier targeting.
- Replace solid line with centered, dashed, pulsing blue guideline for precise visual feedback.
- Governance: bump patch version to 0.6.6 and sync documentation timestamps.

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-27T10:56:14.000Z
Author: ai

Plan — Card fine-tuning: bottom action bar, no overlays on cards; bump to 0.6.5 (dev)
- Move card operation buttons to the bottom below hashtags in both Inbox and area cards: open, archive, edit, del.
- Remove absolute-positioned action overlays; ensure text and elements do not overlay card content.
- Governance: bump version to 0.6.5 and sync documentation (ISO 8601 timestamps with ms).

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-27T10:36:42.000Z
Author: ai

Plan update — Archive board semantics and visibility
- Server: cards list supports archived=only | include | default(exclude). Default keeps archived hidden from normal boards; "archive" board requests archived-only.
- Client: Tagger detects board slug 'archive' and fetches archived=only cards there. Archived cards keep previous hashtags; Archive board can have its own areas and cards default to Inbox there.
- Governance: bump dev version to 0.6.4 and sync docs.

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-27T10:28:03.000Z
Author: ai

Plan refinement — SPOCK hamburger opens a full overlay over Inbox
- Replace the small dropdown with an overlay that covers the Inbox column with a styled panel listing boards.
- Include Recent section and the full boards list; add backdrop and Escape-to-close.
- Governance: bump dev version to 0.6.3 and sync documentation.

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-27T10:09:46.000Z
Author: ai

Plan summary — Colored hashtags on Card page; SPOCK nav hamburger + 3 recents; bump to 0.6.2 (dev)
- Card page: Render colored hashtags by fetching board areas for referenced boards and applying per-area colors/textBlack.
- Tagger/SPOCK nav: Always show a hamburger first; display the 3 most recently visited boards next to it; show the rest in a dropdown when hamburger is clicked; track recents per org in localStorage.
- Governance: Bump version to 0.6.2 (pre-dev) and sync docs with ISO 8601 timestamps (ms).

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-26T13:28:43.000Z
Author: ai

Action plan — Fix Tagger type import; enable Inbox drop; add Archive on Card page; bump to 0.6.1 (dev)
- Fix: In tagger/page.tsx, import Area via `import type` to avoid runtime binding emission and Next.js module error.
- Feature: In TaggerApp, make Inbox a drop target; on drop, call placeCard(id, '', undefined) to unset placement for this board.
- Feature: Add Archive button on Card page to PATCH { isArchived: true } and redirect to /{orgUUID}.
- Governance: Bump version to 0.6.1 before dev; update README/ARCHITECTURE/ROADMAP/TASKLIST/LEARNINGS; ISO 8601 timestamps with ms.

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-26T12:32:16.000Z
Author: ai

Plan summary — Card archive + open page link
- Add Card.isArchived (boolean) to hide cards from all list views without deleting; filter GET list to exclude archived; PATCH supports toggling.
- Add archive controls to Tagger (Inbox items and placed items) to set isArchived=true and optimistically remove from UI.
- Ensure dedicated Card page at /{orgUUID}/cards/{cardUUID} for sharing; add "open" button to Tagger items linking there.
- Update ROADMAP and TASKLIST with ISO timestamps; bump docs version to 0.6.0 (minor feature).

---

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

# WARP.DEV_AI_CONVERSATION

Timestamp: 2025-09-28T10:39:23.000Z
Author: ai

Action — Tagger area top alignment; prepare v0.11.0
- What: Align cards to the top-left in Tagger areas using content-start, justify-start, items-start on the grid container.
- Why: Keeps areas visually anchored and dense; matches requested UX.
- Governance: Bump MINOR to 0.11.0, sync docs (ISO 8601 with ms), run build before commit.

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
