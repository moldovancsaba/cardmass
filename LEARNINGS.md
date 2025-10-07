# LEARNINGS

Version: 1.2.1

Updated: 2025-10-06T19:59:00.000Z

- Architecture: Adopted UUID-first, organization-scoped model. All org/board/card IDs are UUID v4. Slugs are metadata only.
  Why: Enables centralized development with strict tenant scoping and hashed routes.
- Access control: Enforced X-Organization-UUID header matching org path segment via middleware + per-route validation.
  Why: Defense-in-depth and clarity for data scoping.
- Migration: Fully removed legacy endpoints and UI routes; UUID-first org-scoped APIs are the only surface now.
  Why: Eliminate drift and complexity; enforce one clear integration path.
- Next.js nuance: In this codebase, PageProps.params is typed as Promise in server components under App Router; adjusted signatures accordingly.
  Why: Type alignment avoids implicit any and improves DX.
- TypeScript hygiene: Eliminated explicit any by introducing small types and safer globalThis guards.
  Why: Keep production builds lint-clean and improve maintainability.
- Timestamp standard: All timestamps across code and docs must be ISO 8601 with milliseconds in UTC (non-negotiable).
  Why: Consistency, precision, and interoperability.
- Grid alignment nuance: For CSS grid, explicitly set content-start and items-start (and justify-start as needed) on grid containers to ensure items anchor to the top-left.
  Why: Prevents vertical centering or space-around artifacts so boards remain predictable and dense at a glance.

- Independent styling: Area bgColor must not derive from hashtag color; maintain separate fields and apply only bgColor tint in Tagger.
  Why: Visual clarity and per-area theming flexibility.
- Page background parsing: Restrict to background-* declarations when applying user-provided CSS.
  Why: Safety and predictability.
- ESLint hygiene: Avoid any by shaping response types and guarding optional fields.
  Why: Maintain clean builds and readability.

- Process: Documentation governance enforcement
  Why: Consolidated docs, synchronized version/timestamps, and planned automation to prevent drift and ensure compliance.

- Authentication: MessMass zero-trust implementation with dual gates (admin session + page passwords)
  Why: Secure access to Tagger without complex user management; admin bypass for operational efficiency; 32-hex tokens for MessMass parity.
- Cookie vs Edge runtime: runtime='nodejs' required for crypto.randomBytes in page-passwords route
  Why: Edge runtime doesn't support Node.js crypto module; crypto.getRandomValues would require different token generation approach.
- Header propagation in TaggerApp: All 19 fetch calls required auth header spreading via getAuthHeaders()
  Why: Consistent enforcement across load/create/update/delete operations; render prop pattern provides clean separation.
- File system cache issues: Next.js build cache persisted old file contents despite tool-based edits
  Why: File system operations via tools may be cached; bash heredoc (`cat > file << 'EOF'`) forces immediate write to disk.
- Render prop pattern: PasswordGate provides authentication context to children via function-as-children pattern
  Why: Clean separation of concerns; auth logic encapsulated; TaggerApp receives only what it needs (getAuthHeaders function).

- Card background color inheritance: Cards inherit area hashtag color (Area.color) at 70% opacity via inline styles
  Why: Tailwind cannot generate dynamic runtime rgba values for arbitrary hex colors; inline style with computed rgba provides the flexibility needed while maintaining visual consistency with area identity.
  Approach: hexToRgba70() helper converts hex to rgba with 0.7 alpha; supports #RGB and #RRGGBB; fallback to neutral gray.
  Impact: Enhanced spatial recognition—cards visually belong to their area; text-black preserved for readability across all area colors.

- Password regeneration API inconsistency: Organization users endpoint initially only supported role updates, not password updates
  Why: /api/admin/users endpoint had password update logic, but /api/v1/organizations/[orgUUID]/users did not
  Solution: Added password parameter support to org users endpoint; both role and password can be updated independently or together; super-admin password changes blocked for org admins (403); unified hashPassword implementation using crypto.pbkdf2Sync
  Impact: Org admins can now successfully regenerate passwords for their organization members; consistent API behavior across admin and org contexts.

- User ID field naming mismatch: Organization users GET endpoint returned `id` but component expected `_id`
  Why: Inconsistent field naming between API response and frontend component interface; /api/admin/users returns `_id` directly from MongoDB
  Error: "BSONError: input must be a 24 character hex string" when userId was undefined in DELETE/POST operations
  Solution: Changed API response from `{ id: ... }` to `{ _id: ... }` and added `isSuperAdmin` boolean for clarity
  Impact: User removal, password regeneration, and role changes all work correctly; unified field naming across all user management endpoints.

- Button styling fragmentation: Initial button standardization (v0.19.3) only covered admin panel tabs, missed 15+ other pages
  Why: Dashboard overview, organization pages, board management UI had inconsistent colors (indigo, purple, gray gradients) with poor contrast
  Pages affected: Dashboard quick actions, tabs, card links; Organization main page; Board list actions; Org settings; Organizations selector
  Solution: Comprehensive update to sky-600 (primary), gray-300 bordered (secondary), red-600 (destructive); added font-medium and white text throughout
  Impact: Professional, consistent, accessible button styling across entire application; all text readable with proper contrast.

- Global anchor tag styling override: Link and <a> tags styled as buttons had dark blue text instead of white due to globals.css rule
  Why: `a { color: #0369a1; }` in globals.css (line 51) overrides Tailwind's `text-white` utility on Link/anchor components
  Affected: 8 button-styled links (Dashboard Quick Actions, Organization Creator/Admin Panel, Board Tagger/Edit)
  Solution: Used Tailwind !important modifier (!text-white and hover:!text-white) to override global anchor styling with higher specificity
  Impact: All button-styled links now display proper white text on blue backgrounds; maintains global link color for actual text links.

- MessMass-style board password UI: Implemented UI-based password generation directly from board list instead of API-only approach
  Why: User requested MessMass-pattern: generate per-board passwords from UI, not via API endpoints; logged-in users bypass automatically
  Implementation: Added 🔑 Password button to each board in OrgAdminPanel; calls POST /api/page-passwords; displays modal with password + shareable link
  Features: Copy-to-clipboard for both password and URL with ?pw= parameter; regenerate option; admin bypass already existed in PasswordGate
  Pattern: Follows MessMass stat pages - password gate on page load, admin session check first, URL param validation second, password prompt third
  Impact: Enables board sharing without user accounts while maintaining security; admins never see password gates.

- Maintenance script alignment with authentication: Password reset script must hash passwords identically to auth system
  Why: update-password.mjs stored plaintext passwords while src/lib/auth.ts expected MD5 hashes, causing login failures
  Root cause: Script generated random password but stored it directly without hashing (line 72: { $set: { password: newPassword } })
  Solution: Added hashPassword() function matching auth.ts; store hashPassword(newPassword) in DB while displaying plaintext to operator
  Key insight: Maintenance scripts that modify auth-related data MUST mirror the exact hashing/validation logic used by the runtime authentication system
  Pattern: Import createHash from crypto; create identical hashPassword helper; hash before storing; display unhashed value for operator use
  Impact: Password reset now works correctly; establishes pattern for all future auth-related maintenance scripts; prevents authentication mismatches
  Security note: MD5 hashing is MVP-only (NOT cryptographically secure for production); consider bcrypt/argon2 for production deployment.

- Server Component API fetches + notFound() = Silent 404 Bug: Settings page returned 404 despite existing on server
  Why: Server component attempted server-side fetch to API endpoint during render; fetch failed on Vercel (baseUrl misconfiguration); code called notFound() when orgData was null; this happened AFTER authentication redirect() calls; React Server Components sent BOTH redirect (307) and notFound (404) in same response stream; 404 won the render race
  Symptoms: curl showed HTTP 307 redirect headers (auth working) but HTML body contained 404 page; browser displayed cached 404; happened consistently across all organizations; local builds worked but Vercel production failed
  Root cause: Triple fault: (1) Server-side fetch failed silently due to VERCEL_URL env var issues (2) No error handling for failed fetch (3) Called notFound() instead of gracefully degrading
  Solution: Removed server-side API fetch entirely; pass minimal org object with UUID only; let client-side component fetch full data with proper loading states; never call notFound() after authentication checks
  Pattern established: Server components should ONLY handle authentication/authorization; data fetching belongs in client components with proper error boundaries
  Prevention rules:
    1. NEVER call notFound() after redirect() in same component - causes race condition
    2. NEVER fetch API data in server components unless absolutely critical and properly error-handled
    3. Server component pattern: auth check → redirect if unauthorized → render minimal shell → let client fetch data
    4. Client component pattern: useEffect data fetch → loading state → error state → success render
    5. Always test: (a) local build (b) Vercel preview (c) Vercel production - each has different baseUrl behavior
  Impact: Settings page now works reliably in all environments; established pattern prevents similar issues across all protected pages; documented for team knowledge.
