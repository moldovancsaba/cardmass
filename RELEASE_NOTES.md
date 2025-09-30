# RELEASE_NOTES

## [v0.14.0] — 2025-09-30T09:55:53.504Z
- (update notes here)

## [v0.14.0] — 2025-09-30T09:55:53.466Z
- (update notes here)

## [v0.14.0] — 2025-09-30T09:54:35.000Z
- Feature: Single Inbox “show/hide” toggle now controls hashtags and action buttons for all cards on the page (Inbox + board areas); preference persisted per organization.
- Fixed: Resolved hydration mismatch by deferring localStorage reads to useEffect, ensuring SSR and client initial render match.

## [v0.13.0] — 2025-09-30T08:41:22.000Z
- (update notes here)

## [v0.13.0] — 2025-09-30T08:47:00.133Z
- (update notes here)

## [v0.13.0] — 2025-09-30T08:41:22.000Z
- Docs: Added WARP.md (commands, architecture, governance for Warp usage) and linked it from README.
- Governance: Synchronized versions across docs; ensured ISO 8601 with milliseconds (UTC).

## [v0.12.0] — 2025-09-28T15:54:11.000Z
- Docs: Comprehensive documentation refresh and governance alignment
  - Added TECH_STACK.md and NAMING_GUIDE.md
  - Cleaned ROADMAP to be forward-looking only; grouped milestones with priorities and dependencies
  - Synchronized version/timestamps across README, ARCHITECTURE, ROADMAP, TASKLIST, LEARNINGS, and RELEASE_NOTES
  - Added version badge and governance notes to README (no tests; no breadcrumbs; timestamp policy)
  - Governance: Enforced ISO 8601 with milliseconds (UTC) across all documentation and followed Versioning & Release Protocol

## [v0.11.0] — 2025-09-28T10:39:23.000Z
- Changed: Tagger areas now align cards to the top-left. Inner grid containers use content-start, justify-start, and items-start to anchor rows and items, preserving uniform card width and multi-column packing without horizontal scroll.
- Docs: Synchronized version numbers and timestamps across README, ARCHITECTURE, ROADMAP, TASKLIST, and LEARNINGS.

## [v0.10.0] — 2025-09-27T17:19:16.000Z
- Fixed: Addressed Next.js warnings by adding display=optional to Google Font link and disabling no-page-custom-font for App Router root layout.
- Fixed: Type-checker stability by guarding useSearchParams nullability; ensured successful build.
- Fixed: Added /api/settings endpoint to stop 404s during app bootstrap; settings moved to a server-safe shared module.
- Note: Using App Router layout for fonts is intentional; loading icons via Google Fonts remains.

## [v0.9.0] — 2025-09-27T16:12:42.000Z
- Changed: Replaced card action labels with Material Symbols icons (pageview, archive, edit_note, delete) in Inbox and placed cards; loaded Google Fonts Material Symbols.
- Docs: Updated version stamps and delivery logs.

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
