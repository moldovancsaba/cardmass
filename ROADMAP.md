# ROADMAP

Version: 0.11.0

Updated: 2025-09-28T10:39:23.000Z

## Milestone (Q4 2025): UUID-first multi-tenant foundation
- Priority: High
- Dependencies:
  - Organizations collection and indexes
  - Org-scoped APIs with header enforcement
  - Hashed routes by UUID

### Items

- Log 2025-09-28T10:39:23.000Z: Tagger area grid alignment delivered — cards are top-left anchored (v0.11.0).

9) Card Details UX consistency and link behavior standardization

10) Global minimum text size baseline
   - Owner: ai
   - Expected: 2025-09-27T16:10:00.000Z
   - Notes: Enforce minimum font size equal to Inbox card content (text-sm ~ 14px) across all UI, including hashtags and admin microcopy.

11) Iconify card actions with Material Symbols
   - Owner: ai
   - Expected: 2025-09-27T16:30:00.000Z
   - Notes: Replace 'open, archive, edit, del' with 'pageview, archive, edit_note, delete' icons in Tagger cards; load Google Fonts Material Symbols.
   - Owner: ai
   - Expected: 2025-09-27T14:00:00.000Z
   - Notes: Simplify Card view (no title/status/order; split timestamps; remove actions); ensure all Card page links open in a new tab with rel="noopener noreferrer". Forward-looking: centralize URL helper for Card links.

0) Per-area label text color (Creator → Tagger)
2) Drag from areas back to Inbox (Tagger)
   - Owner: ai
   - Expected: 2025-09-26T15:00:00.000Z
   - Notes: Enable Inbox as a drop target; empty areaLabel unsets placement for current board.
7) Colored hashtags on Card page
   - Owner: ai
   - Expected: 2025-09-27T12:00:00.000Z
   - Notes: Fetch board areas for referenced boards and render colored/tagged labels.
8) SPOCK nav: hamburger + 3 recent boards
   - Owner: ai
   - Expected: 2025-09-27T12:00:00.000Z
   - Notes: Store recents per org in localStorage; render hamburger + top 3; full overlay menu covers Inbox when opened.
   - Owner: ai
   - Expected: 2025-09-26T12:00:00.000Z
   - Notes: Remove Tagger global toggle; persist area.textBlack in Creator; apply text color to Tagger area labels and hashtags.
1) Complete data backfill to organizations
   - Owner: ai
   - Expected: 2025-09-24T12:00:00.000Z
   - Notes: Run migration to set uuid and organizationId on boards/cards.


3) Board placements by boardUUID (follow-up)
   - Owner: ai
   - Expected: 2025-10-15T12:00:00.000Z
   - Notes: Migrate boardAreas to be keyed by boardUUID; update API and UI.

4) Documentation automation
- Owner: ai
- Expected: 2025-10-05T12:00:00.000Z
- Notes: Add scripts to sync version and timestamps across docs.

5) Card archive (hide across boards, keep in DB)
   - Owner: ai
   - Expected: 2025-09-26T14:00:00.000Z
   - Notes: Add Card.isArchived flag; filter lists to exclude archived; add archive control in Tagger (Inbox + placed).

6) Dedicated Card page + Open button
   - Owner: ai
   - Expected: 2025-09-26T14:00:00.000Z
   - Notes: Ensure server page exists at /{orgUUID}/cards/{cardUUID}; add "open" button in Tagger to link; shareable URL.
