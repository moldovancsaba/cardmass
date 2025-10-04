# LEARNINGS

Version: 0.19.6

Updated: 2025-10-04T10:35:18.000Z

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
