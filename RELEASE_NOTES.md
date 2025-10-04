# RELEASE_NOTES

## [v0.19.6] — 2025-10-04T10:35:18.000Z
- Fixed: Complete button standardization across ALL pages and components
  - Dashboard Quick Actions: All 4 buttons now use sky-600 bg with white text
  - Dashboard Tabs: Active tab color changed from indigo to sky-600/700
  - Dashboard Card Links: Changed from indigo to sky-600 for consistency
  - Organization Page: Creator, Admin Panel buttons now sky-600 with white text
  - Organization Page: Back to Orgs button now secondary bordered style
  - Board List Actions: Tagger, Edit buttons now sky-600 with white text
  - Board List Actions: Rename button now secondary bordered style
  - Board Rename Modal: Save button sky-600, Cancel button secondary bordered
  - Organization Settings: Save button sky-600, Delete button red-600
  - Organizations List: Logout button red-600, card hover border sky-400
  - All primary action buttons: sky-600 background, white text, font-medium
  - All secondary buttons: border-2 border-gray-300, gray-700 text
  - All destructive buttons: red-600 background, white text
- Rationale: Previous v0.19.3 only updated admin panel components, missed dashboard overview, organization pages, and board management UI
- Impact: Consistent, readable, professional button styling across entire application
- Build: Clean Next.js compilation with zero warnings or errors

## [v0.19.5] — 2025-10-04T10:15:22.000Z
- Fixed: User removal in organization admin now works correctly
  - Changed API response field from `id` to `_id` to match component expectations
  - Added `isSuperAdmin` boolean field to user response for clarity
  - Root cause: Frontend component expected `user._id` but API returned `user.id`
  - Error was: "BSONError: input must be a 24 character hex string" (userId was undefined)
- Technical: Unified field naming across all user management APIs (_id for consistency)
- Build: Clean Next.js compilation with zero warnings or errors

## [v0.19.4] — 2025-10-04T09:55:37.000Z
- Fixed: Password regeneration for organization users now works correctly
  - Added password update support to `/api/v1/organizations/[orgUUID]/users` endpoint
  - Org admins can now regenerate passwords for their organization members
  - Super-admin passwords cannot be changed by org admins (security protection)
  - API now accepts both `role` and `password` parameters independently or together
  - Added secure password hashing using Node's crypto module with PBKDF2
- Technical: Unified password hashing implementation across admin and org APIs
- Rationale: Organization admins were getting "Failed to regenerate password" error because the API endpoint only supported role updates, not password updates
- Build: Clean Next.js compilation with zero warnings or errors

## [v0.19.3] — 2025-10-04T09:34:13.000Z
- Changed: Standardized button styling across all admin pages based on design system
  - Primary actions: bg-sky-500 (brand color) with hover:bg-sky-600
  - Secondary actions: border-2 border-gray-300 with hover:bg-gray-50
  - Destructive actions: bg-red-600 with hover:bg-red-700 (unchanged)
  - Text/link buttons: text-sky-600 with hover:text-sky-800 and underline
  - All buttons include proper disabled states (opacity-50, cursor-not-allowed)
- Updated pages:
  - /admin/dashboard - quick action buttons now use brand color
  - /admin/login - login button uses brand color
  - /admin/dashboard components (OrganizationsTab, SystemUsersTab)
  - /organization/admin - Back button is now secondary style
  - /organization/admin components (UsersTab, BoardsTab)
  - All modal Cancel buttons now use bordered secondary style
  - All modal primary action buttons use brand color
  - "Open Creator" button changed to secondary style for visual hierarchy
- Rationale: Improved contrast and readability; consistent use of brand color for primary actions; clear visual hierarchy between primary and secondary actions
- Build: Clean Next.js compilation with zero warnings or errors

## [v0.19.2] — 2025-10-04T08:43:25.000Z
- Fixed: Card width recalculation when SPOCK sidebar is collapsed
  - Cards now properly expand to use full available width when inbox is hidden
  - spockWidth resets to 0 when spockCollapsed=true, triggering area width recalculation
  - useEffect now depends on spockCollapsed state to trigger resize logic
- Rationale: Hidden elements with `display: none` retain their pre-collapse dimensions, preventing ResizeObserver from detecting layout changes. Explicit width reset ensures card layout responds to sidebar visibility.
- Build: Clean Next.js compilation with zero warnings or errors

## [v0.19.1] — 2025-10-04T08:36:01.000Z
- Changed: Tagger card backgrounds now inherit area hashtag color at 70% opacity
  - Cards placed in areas display with the area's hashtag/label color (Area.color) at 70% transparency
  - Applied to both stacked view (<1200px) and desktop grid view (≥1200px)
  - Inbox cards remain white (unchanged)
  - Fallback: neutral gray (rgba(229, 231, 235, 0.7)) for invalid/missing colors
- Added: hexToRgba70() helper function in TaggerApp.tsx
  - Converts hex color (#RGB or #RRGGBB) to rgba with 0.7 alpha
  - Robust validation with graceful fallback
  - Supports both 3-digit and 6-digit hex formats
- Rationale: Visual consistency between area identity (hashtag color) and card appearance within that area
  - Enhances spatial recognition: cards visually "belong" to their area
  - 70% opacity maintains text readability (text-black preserved)
  - Inline style used because Tailwind cannot generate dynamic runtime rgba values
- Build: Clean Next.js compilation with zero warnings or errors

## [v0.19.0] — 2025-10-03T17:30:00.000Z
- Added: Comprehensive three-level admin CRUD system
  - System-level user management (super-admin only): create/update/delete users and super-admins; role changes; password regeneration with 32-hex tokens
  - Organization CRUD: create/edit/delete organizations; toggle active status; full metadata management (name, slug, description, UUID)
  - Organization-level user management: enhanced existing org user admin with memoized data loaders
- Added: Tabbed admin dashboard (/admin/dashboard)
  - Overview tab: Card-based navigation to all admin functions with quick actions
  - Organizations tab: Full org CRUD interface with list, create, edit, delete, and status toggle
  - System Users tab: Full user CRUD with role management, password reset, and delete (super-admin only)
- Added: API routes for system user management
  - GET /api/admin/users: List all system users (excludes password/token fields)
  - POST /api/admin/users: Create new users or update existing (role, password)
  - DELETE /api/admin/users/[userId]: Delete user with last-super-admin guard
  - Authorization: Super-admin only (403 for non-super-admins)
  - Password hashing: PBKDF2 with 10000 iterations, SHA-512, salted
- Added: API routes for organization management
  - PATCH /api/v1/organizations/[orgUUID]: Update org details (name, slug, description, isActive)
  - DELETE /api/v1/organizations/[orgUUID]: Delete organization
- Changed: Admin dashboard quick action buttons now use consistent dark gray background (bg-gray-700) with white text
- Fixed: React hooks exhaustive-deps warnings
  - Memoized loadBoards and loadUsers functions with useCallback in BoardsTab.tsx and UsersTab.tsx
  - Updated useEffect dependency arrays to include memoized loaders
  - Zero ESLint warnings in build output
- Security: Guards implemented
  - Super-admin-only routes with session validation
  - Last super-admin deletion prevention (403 error)
  - Password strength enforcement (minimum 8 characters)
  - Secure password generation using crypto.getRandomValues
- UX: Toast notifications, modal workflows, copy-to-clipboard for passwords, confirmation dialogs for destructive actions
- Docs: Updated ARCHITECTURE.md with complete admin system documentation (sections 10.6 and 11)
- Build: Clean compilation with zero warnings or errors

## [v0.19.0] — 2025-10-03T16:37:24.000Z
- Added: Complete organization admin panel with full user and board management
  - Organization context provider (src/lib/org-context.tsx): URL query-first (?org=uuid) with localStorage fallback; automatic UUID v4 validation
  - Toast notification system (src/components/ToastProvider.tsx): auto-dismissing toasts with success/error/info variants
- Added: User Management tab (app/organization/admin/_components/UsersTab.tsx)
  - List all users with organization access (email, name, role, actions)
  - Add new users with auto-generated 32-hex passwords (MessMass convention); copy-to-clipboard workflow
  - Edit user roles inline via dropdown (org-admin ↔ member); idempotent POST for add/update
  - Regenerate passwords with secure display modal; warn "won't be shown again"
  - Remove users with super-admin guard (cannot remove super-admins from orgs)
  - Real-time feedback via toast notifications; error handling with retry
- Added: Board Management tab (app/organization/admin/_components/BoardsTab.tsx)
  - List boards with metadata (slug, grid size, version, ISO 8601 updated timestamp with milliseconds UTC)
  - Quick create inline (name, rows, cols) + link to full Creator
  - Edit board name/slug via modal
  - Delete boards with confirmation dialog
  - Direct links to open board in Tagger
- Changed: Organization page (app/[organizationUUID]/page.tsx) now passes org UUID to admin panel link: /organization/admin?org={orgUUID}
- Changed: Admin panel page (app/organization/admin/page.tsx) integrated with OrgContextProvider, ToastProvider, and new tab components
- Security: All API calls include X-Organization-UUID header matching path segment (middleware guard compliance)
- Security: Password generation uses crypto.getRandomValues; 32-char hex tokens (128-bit entropy)
- Security: Super-admin protection prevents unauthorized user removals
- UX: Loading states, error states with retry, confirmation dialogs for destructive actions, disabled states during API calls
- Build: Clean Next.js build; 2 non-breaking ESLint warnings (useEffect dependencies)

## [v0.18.0] — 2025-10-02T12:47:30.000Z
- Added: Zero-trust authentication system (MessMass specification)
  - Admin session: HttpOnly cookie 'admin-session' with base64 JSON token (sub, email, role, exp); 7-day expiry; SameSite=Lax, Secure in production
  - Page passwords: 32-hex tokens per pageId/pageType stored in MongoDB pagePasswords collection; idempotent generation; usage tracking (usageCount, lastUsedAt)
  - Server rule: Protected endpoints allow access IFF (valid admin-session cookie) OR (valid page password headers)
- Added: Authentication API endpoints
  - POST/DELETE /api/auth/login — admin login/logout with 800ms timing delay
  - GET /api/auth/check — session presence check for admin bypass
  - POST /api/page-passwords — create/retrieve page password + shareable link (admin-only)
  - PUT /api/page-passwords — validate page password with admin bypass
- Added: UI components for access control
  - PasswordGate.tsx — client component with 3 states (checking/locked/unlocked); admin bypass; URL param ?pw= support; render prop pattern
  - TaggerWithAuth.tsx — wrapper integrating PasswordGate with TaggerApp
- Changed: TaggerApp accepts getAuthHeaders prop; all 19 fetch calls spread auth headers (X-Page-Id, X-Page-Type, X-Page-Password)
- Added: Server-side enforcement on protected APIs
  - GET/POST/PATCH/DELETE boards/cards APIs: enforce when scope=tagger or X-Page-* headers present
  - enforceAdminOrPagePassword() function validates admin session OR page password headers
- Added: Data models and collections
  - users: { email (unique), name, role, password (32-hex), createdAt, updatedAt }
  - pagePasswords: { pageId, pageType, password, createdAt, usageCount, lastUsedAt }
  - Both collections include unique indexes
- Added: Operational scripts
  - scripts/admin/create-user.mjs — create admin user with generated password
  - scripts/admin/update-password.mjs — rotate admin password  
  - scripts/test-login.mjs — automated auth flow testing
- Security: All timestamps ISO 8601 with milliseconds (UTC); admin user created (admin@doneisbetter.com); cookies secure; no client-readable secrets
- Build: Resolved Next.js cache issues with bash heredoc file operations; npm run build passes; dev server running on port 4000

## [v0.17.0] — 2025-10-01T12:34:55.000Z
- Added: Board-level background CSS field
  - Creator: new "Board background (CSS)" textarea under Slug; accepts multiline background-* declarations (e.g., background-color, background-image with url and linear-gradient, background-repeat/size/position)
  - Org page: InlineCreateBoard now includes a "Board background (CSS)" textarea
  - API: Boards create/patch now accept/return background; GET returns background
  - Tagger: applies board.background on the page main container (whitelisted background-* only)
- Changed: Area styling refinements
  - Area background is fully independent from hashtag color; Tagger uses bgColor tint only (neutral fallback when not set)
  - Removed area border (“stroke”) and added 4px top padding before grid starts; increased inter-area gap on desktop
- Fixed: Build blockers
  - Corrected accidental Cyrillic 'ok' typo in TaggerApp
  - Resolved ESLint no-explicit-any by typing API responses and background parse path
- Docs: Synchronized versions and timestamps across README, ARCHITECTURE, ROADMAP, TASKLIST, LEARNINGS, WARP, TECH_STACK, NAMING_GUIDE
  - README: added example snippet for Board background (CSS) and where to set it

## [v0.16.0]
- Added: Per-area row-first (dense) packing option. When enabled for an area, the card grid uses row-dense flow to keep cards next to each other in rows where possible.
- Added: Separate Area background color alongside Hashtag color in Creator. Background tint in Tagger uses the new bgColor (with opacity), while hashtag chips keep the hashtag color.
- Creator: Area list now shows a small background swatch next to the hashtag chip; per-area toggles include BLACK text and Row-first.
- Tagger: Area background tint prefers bgColor; gridAutoFlow respects per-area rowFirst.

## [v0.15.0] — 2025-09-30T13:34:38.000Z
- Fix: Resolved build failure caused by mismatched JSX in TaggerApp stacked (<1200px) layout. Added a proper grid content wrapper, closed map blocks, and ensured correct nesting.
- Changed: Multi-column wrapping now packs cards side-by-side by removing per-card full-width slots in multi-column areas. Kept top-of-area slot and introduced an end-of-grid slot. Per-card slot-after is rendered only for single-column areas.
- Result: npm run build succeeds; UI maintains uniform card width with correct wrapping.

## [v0.14.1] — 2025-09-30T10:55:35.000Z
- Dev: Start local dev cycle for stacked single-column mobile layout and interactions.

## [v0.14.0] — 2025-09-30T09:54:35.000Z
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
