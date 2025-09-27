# RELEASE_NOTES

## [v0.8.0] — 2025-09-27T15:47:28.000Z
- Changed: Enforced global minimum text size baseline equal to Inbox card content (text-sm: 14px) across the app, including hashtags and admin texts.
- Docs: Updated version stamps and roadmap/task references.

## [v0.7.0] — 2025-09-27T13:10:13.000Z
- Changed: Card Details UI simplified (removed page title and status/order; split created/updated lines; removed actions; hashtags consolidated and deduped).
- Changed: All Card page links now open in a new tab (target="_blank" rel="noopener noreferrer").
- Docs: Updated ROADMAP, TASKLIST, ARCHITECTURE, LEARNINGS, README to reflect v0.7.0 and timestamp policy.

## [v0.5.0] — 2025-09-26T11:31:31.110Z
- Added: Per-area label text color preference in Creator Areas (textBlack: BLACK/WHITE) with persistence.
- Changed: Tagger consumes per-board, per-label textBlack for area labels and all hashtag badges.
- Removed: Tagger global label text color toggle; configuration is per-area in Creator.
- Docs: ROADMAP/TASKLIST updated.

This file records completed releases only. New entries are added when tasks from TASKLIST.md are finished and verified.

## [v0.4.0] — 2025-09-25T16:13:14.000Z
- Removed: All legacy surfaces — /api/cards, /api/cards/[id], /api/boards/[slug], /use/*, /kanban/*, components/Board (legacy Kanban).
- Changed: BoardCanvas and TaggerApp now use card.uuid during DnD and PATCH org-scoped endpoint /api/v1/organizations/{orgUUID}/cards/{cardUUID} with header enforcement.
- Changed: SPOCK inbox drag now emits card.uuid for consistency.
- Docs: Purged legacy references from ARCHITECTURE, ROADMAP, TASKLIST, LEARNINGS; bumped versions to 0.4.0.

## [v0.3.0] — 2025-09-22T17:26:57.000Z
- Added: UUID-first, organization-scoped APIs for Organizations/Boards/Cards with header enforcement (X-Organization-UUID).
- Added: Hashed board route /{organizationUUID}/{boardUUID} and organization admin page by slug /organization/[slug].
- Added: Migration script to backfill uuid and organizationId and ensure indexes.
- Changed: Updated Board and Home flows to use org-scoped APIs and header wrapper.
- Changed: Legacy endpoints /api/cards and /api/boards/[slug] now include Deprecation and Sunset headers.
- Fixed: TypeScript and ESLint errors (no-explicit-any, PageProps typing, unused imports), enabling a clean Next.js build.
- Docs: ARCHITECTURE, README, ROADMAP, TASKLIST, LEARNINGS updated to reflect the new architecture and ISO 8601 with ms timestamps.

## [v0.2.0] — 2025-09-20T14:08:35.000Z
- Changed: SPOCK bottom bar shows up to 3 board links (alphabetical), with a hamburger overflow for more; Admin link kept; removed Creator/Pages from the bar.
- Changed: SpockNav converted to a server component; brand + Admin only; removed version badge from the UI.
- Docs: Enforced ISO 8601 with millisecond UTC timestamps across docs; updated ARCHITECTURE, ROADMAP, README.
