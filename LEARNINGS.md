# LEARNINGS

Version: 0.19.3

Updated: 2025-10-04T09:34:13.000Z

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
