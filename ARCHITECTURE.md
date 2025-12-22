# ARCHITECTURE

Version: 1.22.0
Updated: 2025-12-22T20:46:41.077Z

> Reference: `HANDBOOK.md` is the canonical source; this file provides deep-dive appendices for architecture topics.

1. Overview
- Single-DB, multi-tenant architecture with strict organization scoping.
- UUID-first design: organizations, boards, and cards are identified by UUID v4.
- Hashed routes only in the UI: /{organizationUUID}/{boardUUID}. Slugs are metadata and never used for routing.
- All timestamps must be ISO 8601 with milliseconds in UTC.
- No tests (MVP policy) and no breadcrumbs (Navigation policy).

2. Glossary
- organization: top-level tenant. All data is scoped under organizationId (UUID v4) and enforced at API boundaries.
- board: a page defined by a grid of areas around the same initiative. Identified by uuid (UUID v4). slug is metadata.
- area: a labeled territory on a board. Area labels are canonical (lowercase) and drive per-board placements. Each area includes independent styling fields: bgColor? (fill tint), textBlack? (label readability), rowFirst? (dense packing hint).
- card: a single element with content. Cards are classifiable across boards via per-board placements.
- placement: per-board assignment of a card to an area on a specific board (persisted in boardAreas[boardUUID] = areaLabel, keyed by board UUID v4). Never persist 'spock'.
- spock: a virtual inbox area per board, used for display when a card has no placement on that board. Never persisted.

3. Data model (MongoDB)
- organizations
  - uuid: string (v4, unique)
  - name: string
  - slug: string (unique; admin UX only)
  - description?: string
  - isActive: boolean
  - createdAt / updatedAt: ISO string (server emits ISO with ms, UTC)
  - Indexes: { uuid: 1 } unique, { slug: 1 } unique

- boards
  - uuid: string (v4, unique)
  - organizationId: string (org uuid; required; indexed)
  - slug?: string (metadata only)
  - rows: number
  - cols: number
  - areas: Area[]
  - background?: string (multiline CSS with background-* declarations applied on Tagger page)
  - version: number
  - createdAt / updatedAt: Date (server) / ISO (client)
  - Indexes: { uuid: 1 } unique, { organizationId: 1 }, { organizationId: 1, updatedAt: -1 }

- cards
  - uuid: string (v4, unique)
  - organizationId: string (org uuid; required; indexed)
  - text: string
  - status: 'delegate' | 'decide' | 'do' | 'decline'
  - order: number
  - createdAt / updatedAt: Date (server) / ISO (client)
  - boardSlug?: string (legacy; creation source, optional)
  - areaLabel?: string (deprecated; legacy single label)
  - boardAreas?: Record<string, string> (keys are board UUIDs, NOT slugs)
  - Indexes: { uuid: 1 } unique, { organizationId: 1, status: 1, updatedAt: -1 }

4. API surface (App Router)
- Organizations
  - GET /api/v1/organizations — list (public)
  - POST /api/v1/organizations — create (public); generates uuid; ISO timestamps
  - GET /api/v1/organizations/[orgUUID] — fetch by uuid (validate v4)
  - PATCH /api/v1/organizations/[orgUUID] — update (name, slug, description, isActive); ISO timestamps
  - DELETE /api/v1/organizations/[orgUUID] — delete organization
  - GET /api/v1/organizations/slug/[slug] — admin UX by slug (not for scoping)

- Boards (org scoped; requires X-Organization-UUID header to match path)
  - GET /api/v1/organizations/[orgUUID]/boards — list for org
  - POST /api/v1/organizations/[orgUUID]/boards — create under org; generates uuid; ISO timestamps
  - GET /api/v1/organizations/[orgUUID]/boards/[boardUUID] — fetch within org
- PATCH /api/v1/organizations/[orgUUID]/boards/[boardUUID] — update allowed fields (slug, rows, cols, areas, background); bumps version; ISO timestamps
  - DELETE /api/v1/organizations/[orgUUID]/boards/[boardUUID] — delete within org

- Cards (org scoped; requires X-Organization-UUID header)
  - GET /api/v1/organizations/[orgUUID]/cards?status=&boardUUID= — list for org; optional filters
  - POST /api/v1/organizations/[orgUUID]/cards — create; inserts at top (min(order) - 1); ISO timestamps
  - GET /api/v1/organizations/[orgUUID]/cards/[cardUUID] — fetch within org
  - PATCH /api/v1/organizations/[orgUUID]/cards/[cardUUID] — partial update; ISO timestamps
  - DELETE /api/v1/organizations/[orgUUID]/cards/[cardUUID] — delete within org


5. Routing
- Hashed board URL: /{organizationUUID}/{boardUUID}
- Organization admin by slug (metadata): /organization/[slug]
- Organization admin panel (org-scoped): /organization/admin?org={orgUUID}
- Slugs never appear in routing for the main board view.

6. Access guard (middleware)
- Middleware enforces that for org-scoped paths, the X-Organization-UUID header exists, is a UUID v4, and matches the path segment.
- Defense-in-depth: handlers also validate ids and organizationId ownership before reads/writes.

7. Current limitations and next steps
- boardAreas are keyed by board UUID (verified via migration 002). All active cards use UUID-based keys.
- Legacy GridBoard (src/app/use/[slug]/) may still write slug-based keys but is deprecated.
- Legacy routes remain until Sunset; main UI (TaggerApp) uses UUID-first architecture exclusively.

8. Operational scripts
- scripts/migrations/001-add-organizations-and-backfill-uuids.mjs — creates organizations collection, backfills uuids and organizationId on boards/cards, and ensures indexes. Supports MIGRATE_DRY_RUN.
- scripts/maintenance/clear-spock-area.mjs — clears any legacy 'spock' in areaLabel.

9. Version & governance
- Follow Versioning and Release Protocol. Ensure version is consistent in package.json and all docs. All timestamps are ISO 8601 with ms, UTC.

9.1 Server/Client Component Pattern (MANDATORY)
- Golden Rule: "Server components authenticate, client components hydrate"
- Enforced: 2025-10-07 after comprehensive audit (commits 4d4e04a, b49baae)
- Status: 100% compliance across all 10 page components

9.1.1 Pattern Definition
- Server components (page.tsx files): ONLY handle authentication and authorization
  - Validate URL parameters (isUUIDv4, etc.)
  - Check authentication token from cookies
  - Validate user access (validateAdminToken, checkOrgAccess)
  - Redirect if unauthorized
  - Pass ONLY IDs to client components
  - NEVER fetch API data
  - NEVER call notFound() after redirect()

- Client components: Handle ALL data fetching with proper error handling
  - Marked with 'use client'
  - Use useState for data, loading, error states
  - Fetch data in useEffect
  - Display loading state while fetching
  - Display error state with retry button
  - Display success state when data loaded

9.1.2 Why This Pattern
- Prevents 404 bugs: React Server Components can send BOTH redirect() and notFound() in same response stream
- Prevents silent failures: Server-side fetches fail unpredictably on Vercel due to baseUrl/networking issues
- Enables proper error handling: Client components can show loading states, error messages, and retry buttons
- Separates concerns: Auth logic separate from data fetching logic

9.1.3 Compliant Pages (All 10)
1. app/page.tsx - Root login (server auth only)
2. app/organizations/page.tsx - Org selector (client component)
3. app/admin/dashboard/page.tsx - Admin dashboard (client component)
4. app/[organizationUUID]/settings/page.tsx - Settings (server auth, client tabs fetch data)
5. app/[organizationUUID]/creator/page.tsx - Creator (server auth only, added 2025-10-07)
6. app/[organizationUUID]/cards/[cardUUID]/page.tsx - Card details (server auth, CardDetailsClient fetches)
7. app/[organizationUUID]/hashtags/[hashtagUUID]/page.tsx - Hashtag (server auth, HashtagDetailsClient fetches)
8. app/organization/[slug]/page.tsx - Slug redirect (graceful error handling)
9. app/[organizationUUID]/page.tsx - Org main (server auth, OrgHeader + OrgBoardList fetch data)
10. app/[organizationUUID]/[boardUUID]/tagger/page.tsx - Tagger (server auth, TaggerWithAuth fetches)

9.1.4 Security Fixes (2025-10-07)
Fixed 3 pages that had NO authentication (anyone could access):
- creator/page.tsx - Added token + org access validation
- cards/[cardUUID]/page.tsx - Added token + org access validation
- hashtags/[hashtagUUID]/page.tsx - Added token + org access validation

9.1.5 Client Components Created
- CardDetailsClient.tsx - Fetches card + board area styling
- HashtagDetailsClient.tsx - Fetches hashtag + card list + board styling
- OrgHeader.tsx - Fetches org name for display
- TaggerWithAuth.tsx - Updated to fetch board data itself

9.1.6 Documentation
- docs/SERVER_CLIENT_PATTERNS.md - Complete pattern guide
- docs/AUDIT_SERVER_CLIENT_PATTERN.md - Detailed violation analysis
- docs/AUDIT_SUMMARY.md - Executive summary
- LEARNINGS.md - Comprehensive audit entry

9.1.7 Enforcement
- Code review checklist: "Follows server/client pattern?"
- All new pages MUST follow this pattern
- Test in 3 environments: local dev + Vercel preview + Vercel production
- NEVER mix auth and data fetching in server components
- Reference: docs/SERVER_CLIENT_PATTERNS.md for examples

10. Authentication & Access (MessMass zero-trust implementation)

10.1 Overview
- Zero-trust model: every protected page requires authentication via EITHER admin session OR valid page password
- Based on MessMass AUTHENTICATION_AND_ACCESS.md specification
- Implemented: v0.19.0
- Scope (initial): Tagger pages /{organizationUUID}/{boardUUID}/tagger

10.2 Admin Session
- Cookie name: 'admin-session'
- Format: base64-encoded JSON with structure:
  ```json
  {
    "sub": "<userId>",      // MongoDB _id as string
    "email": "user@example.com",
    "role": "admin" | "super-admin",
    "exp": "2025-10-09T12:47:30.000Z"  // ISO 8601 with ms, UTC
  }
  ```
- Cookie properties:
  - HttpOnly: true (not accessible via JavaScript)
  - SameSite: 'Lax' (CSRF protection)
  - Secure: true in production (HTTPS only)
  - Path: '/'
  - Max-Age: 604800 seconds (7 days)
- Validation:
  - On each protected request, decode cookie and verify exp > now
  - Fetch user from MongoDB to confirm still exists and has correct role
  - If validation fails, treat as unauthenticated

10.3 Page Passwords
- Model: 32-character lowercase hexadecimal tokens (MD5-style format for compatibility)
- Generation: crypto.randomBytes(16).toString('hex')
- Storage: pagePasswords collection in MongoDB
- Schema:
  ```javascript
  {
    _id: ObjectId,
    pageId: string,        // boardUUID for Tagger pages
    pageType: 'tagger',    // extensible for future page types
    password: string,       // 32-hex token
    createdAt: string,     // ISO 8601 with ms, UTC
    usageCount: number,    // incremented on each validation
    lastUsedAt?: string,   // ISO 8601 with ms, UTC
    expiresAt?: string     // Optional, not enforced (future)
  }
  ```
- Index: { pageId: 1, pageType: 1 }, unique
- Client behavior: PasswordGate stores validated password in component state only (no localStorage)
- Rotation: Admin can regenerate password via POST /api/page-passwords with regenerate=true

10.4 Collections (MongoDB)

a) users
- Fields:
  - _id: ObjectId
  - email: string (unique, lowercase)
  - name: string
  - role: 'admin' | 'super-admin'
  - password: string (32-hex token, NOT hashed - MessMass parity)
  - createdAt: string (ISO 8601 with ms, UTC)
  - updatedAt: string (ISO 8601 with ms, UTC)
- Indexes: { email: 1 } unique
- Note: Password is stored as plaintext-equivalent 32-hex token (MessMass design)

b) pagePasswords
- See schema in section 10.3 above

10.5 API Endpoints (Auth & Page Passwords)

a) POST /api/auth/login
- Body: { email: string, password: string }
- Response: { success: true, user: { name, role } }
- Side effect: Sets admin-session cookie
- Timing: 800ms delay for timing attack mitigation
- Errors:
  - 400: Invalid request body
  - 401: Invalid credentials

b) POST|DELETE /api/auth/logout
- Response: { success: true }
- Side effect: Clears admin-session cookie (Max-Age=0)

c) GET /api/auth/check
- Response: { authenticated: boolean, user?: { name, role } }
- Always returns 200; used by PasswordGate for admin bypass detection

d) POST /api/page-passwords
- Authorization: Admin-only (401 if not admin)
- Body: { pageId: string, pageType: 'tagger', organizationUUID: string, regenerate?: boolean }
- Response: { success: true, pagePassword: { pageId, pageType, password, ... }, shareableLink: string }
- Runtime: 'nodejs' (requires crypto.randomBytes)
- Behavior: Idempotent unless regenerate=true
- Example shareableLink: https://example.com/{orgUUID}/{boardUUID}/tagger?pw=32hextoken

e) PUT /api/page-passwords
- Body: { pageId: string, pageType: 'tagger', password: string }
- Response: { success: true, isValid: true, isAdmin: boolean }
- Admin bypass: If authenticated as admin, returns success immediately without DB check
- Validation: Checks password format (32 lowercase hex), then validates against DB
- Side effect: On successful validation, increments usageCount and updates lastUsedAt
- Errors:
  - 400: Invalid body or password format

10.6 Admin Management API (Super-Admin Only)

a) GET /api/admin/users
- Authorization: Super-admin only (403 if not super-admin)
- Response: { users: Array<User> }
- Returns: All system users (excluding password and token fields)
- Used by: System Users tab in admin dashboard

b) POST /api/admin/users
- Authorization: Super-admin only (403 if not super-admin)
- Body (create): { email: string, name: string, password: string, role?: 'user' | 'super-admin' }
- Body (update): { userId: string, role?: 'user' | 'super-admin', password?: string }
- Response (create): { success: true, message: 'User created', user: { email, name, role } }
- Response (update): { success: true, message: 'User updated' }
- Password hashing: PBKDF2 (10000 iterations, SHA-512) with salt
- Minimum password length: 8 characters
- Errors:
  - 400: Missing required fields or invalid password length
  - 409: User with email already exists (create only)

c) DELETE /api/admin/users/[userId]
- Authorization: Super-admin only (403 if not super-admin)
- Response: { success: true, message: 'User deleted' }
- Guard: Prevents deleting the last super-admin (returns 403)
- Errors:
  - 403: Cannot delete last super-admin
  - 404: User not found

11. Admin Dashboard (v0.19.0)

11.1 Structure
- Location: /admin/dashboard
- Access: Requires admin session (redirects to /admin/login if not authenticated)
- Interface: Tabbed layout with three main tabs
  1. Overview: Card-based navigation to all admin functions
  2. Organizations: Full CRUD for organization management
  3. System Users: Full CRUD for user management (super-admin only)

11.2 Organizations Tab
- Components: app/admin/dashboard/_components/OrganizationsTab.tsx
- Features:
  - List all organizations with metadata (UUID, slug, description, active status, timestamps)
  - Create new organizations (name, slug, description)
  - Edit organization details (name, slug, description)
  - Toggle active/inactive status
  - Delete organizations (with confirmation)
  - Open organization directly from list
- API: Uses /api/v1/organizations routes
- Permissions: All authenticated admins

11.3 System Users Tab
- Components: app/admin/dashboard/_components/SystemUsersTab.tsx
- Features:
  - List all system users with role display
  - Create new users/super-admins with auto-generated 32-hex passwords
  - Change user roles (user ↔ super-admin) via dropdown
  - Regenerate passwords with copy-to-clipboard
  - Delete users (with last super-admin guard)
  - Display super-admin and user counts
- API: Uses /api/admin/users routes
- Permissions: Super-admin only
- Password generation: crypto.getRandomValues + hex encoding (32 chars)

11.4 Organization Users Management
- Location: /organization/admin → User Management tab
- Components: app/organization/admin/_components/UsersTab.tsx
- Features:
  - List users with access to specific organization
  - Add users with org-admin or member roles
  - Change user roles within organization
  - Regenerate user passwords
  - Remove users from organization (with super-admin guard)
- API: Uses /api/v1/organizations/[orgUUID]/users routes
- Permissions: Org-admins and super-admins
- Context: OrgContextProvider (requires ?org=<orgUUID> query param)

11.5 UI Components
- Toast notifications: Integrated ToastProvider for all user feedback
- Modals: Create/Edit modals for organizations and users
- Password modals: Display regenerated passwords with copy-to-clipboard
- Tables: Sortable lists with inline actions
- Forms: Validated inputs with error handling
- Guards: Client-side and server-side permission checks
  - 403: Password mismatch

10.6 UI Components

a) src/components/PasswordGate.tsx
- Client component wrapping protected pages
- Props:
  - pageId: string (boardUUID)
  - pageType: 'tagger'
  - organizationUUID: string
  - children: render prop receiving { getAuthHeaders, isAdmin }
- States: 'checking' | 'locked' | 'unlocked'
- Flow:
  1. On mount: Check admin via GET /api/auth/check
     - If authenticated → unlock immediately
  2. Check URL param ?pw=32hex
     - If present → validate via PUT /api/page-passwords
     - If valid → unlock and store password in state
  3. Show password prompt form
     - On submit → validate via PUT /api/page-passwords
     - If valid → unlock and store password in state
- Admin banner: Shows green banner when admin bypass active
- Auth headers provider: getAuthHeaders() returns { 'X-Page-Id', 'X-Page-Type', 'X-Page-Password' }

b) app/[organizationUUID]/[boardUUID]/tagger/TaggerWithAuth.tsx
- Wrapper component integrating PasswordGate with TaggerApp
- Uses Suspense boundary for useSearchParams
- Passes getAuthHeaders to TaggerApp

c) TaggerApp integration
- Accepts optional prop: getAuthHeaders?: () => Record<string, string>
- All 19 fetch calls spread auth headers:
  ```typescript
  const headers = {
    'X-Organization-UUID': orgUUID,
    ...(getAuthHeaders ? getAuthHeaders() : {})
  }
  ```

10.7 Server-Side Enforcement

Rule: Protected endpoints allow access IFF (valid admin-session cookie) OR (valid page password headers)

a) Enforcement function: src/lib/auth.ts → enforceAdminOrPagePassword({ pageId, pageType })
- Returns: { allowed: boolean, reason?: string, status?: number }
- Logic:
  1. Check admin session via getAdminUser()
     - If authenticated → return { allowed: true }
  2. Read headers: X-Page-Id, X-Page-Type, X-Page-Password
     - If any missing → return { allowed: false, reason: 'Missing authentication', status: 401 }
  3. Validate header values match requested resource
     - If mismatch → return { allowed: false, reason: 'Page mismatch', status: 403 }
  4. Validate password format (32 lowercase hex)
     - If invalid → return { allowed: false, reason: 'Invalid password format', status: 400 }
  5. Call validateAnyPassword({ pageId, pageType, password })
     - If valid → increment usageCount, update lastUsedAt, return { allowed: true }
     - If invalid → return { allowed: false, reason: 'Invalid password', status: 403 }

b) Protected API routes (Tagger scope)
- GET /api/v1/organizations/[orgUUID]/boards/[boardUUID]
  - Enforcement trigger: ?scope=tagger OR any X-Page-* header present
- GET /api/v1/organizations/[orgUUID]/cards
  - Enforcement trigger: ?scope=tagger OR any X-Page-* header present
- POST /api/v1/organizations/[orgUUID]/cards
  - Enforcement trigger: any X-Page-* header present
- PATCH /api/v1/organizations/[orgUUID]/cards/[cardUUID]
  - Enforcement trigger: any X-Page-* header present
- DELETE /api/v1/organizations/[orgUUID]/cards/[cardUUID]
  - Enforcement trigger: any X-Page-* header present

c) Error responses
- 401: Missing or expired authentication
- 403: Invalid password or page mismatch
- Format: { error: { code: string, message: string } }

10.8 Request Examples

Admin login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@doneisbetter.com","password":"753f54954c5b09718890ef5f5d16fe4a"}' \
  -c cookies.txt
```

Auth check:
```bash
curl http://localhost:3000/api/auth/check -b cookies.txt
```

Generate page password (admin):
```bash
curl -X POST http://localhost:3000/api/page-passwords \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"pageId":"<boardUUID>","pageType":"tagger","organizationUUID":"<orgUUID>"}'
```

Fetch board with password:
```bash
curl http://localhost:3000/api/v1/organizations/<orgUUID>/boards/<boardUUID>?scope=tagger \
  -H "X-Organization-UUID: <orgUUID>" \
  -H "X-Page-Id: <boardUUID>" \
  -H "X-Page-Type: tagger" \
  -H "X-Page-Password: <32hex>"
```

10.9 Operational Scripts

a) scripts/admin/create-user.mjs
- Purpose: Create admin user with generated 32-hex password
- Usage: node scripts/admin/create-user.mjs [email] [name] [role]
- Interactive prompts if args not provided
- Outputs password to stdout (store securely)

b) scripts/admin/update-password.mjs
- Purpose: Rotate admin user password
- Usage: node scripts/admin/update-password.mjs <email>
- Generates new 32-hex password and updates DB

c) scripts/test-login.mjs
- Purpose: Automated testing of auth flow
- Usage: node scripts/test-login.mjs <email> <password>
- Tests: login → auth check → logout

10.10 Security Considerations

a) Cookie security
- HttpOnly prevents XSS attacks from stealing session
- SameSite=Lax provides CSRF protection
- Secure flag in production enforces HTTPS
- Base64 JSON token is NOT signed (trade-off for simplicity)
  - Mitigated by: server-side user validation on each request

b) Password storage
- User passwords are 32-hex tokens, NOT hashed (MessMass parity)
- Page passwords are also 32-hex tokens
- Rationale: Simplicity for MVP; tokens have sufficient entropy (128 bits)
- Risk: Database breach exposes passwords
  - Mitigation: MongoDB access control, audit logging, rotation capability

c) Timing attacks
- Login endpoint includes 800ms delay for timing attack mitigation
- Password comparison uses direct string equality (acceptable for 32-hex tokens)

d) Shareable links
- Links contain password in query parameter (e.g., ?pw=32hex)
- Risk: URL logging, browser history, referrer leakage
- Mitigation: Admin can rotate password at any time; links are time-limited by board lifecycle

10.11 Flow Diagram

```
Visitor → Tagger Page
    |
    v
PasswordGate Component
    |
    +-- GET /api/auth/check
    |   ├── authenticated=true → UNLOCK (admin bypass)
    |   └── authenticated=false → continue
    |
    +-- Check URL param ?pw=32hex
    |   ├── present → PUT /api/page-passwords validate
    |   |   ├── valid → UNLOCK
    |   |   └── invalid → show prompt
    |   └── absent → show prompt
    |
    +-- Show password prompt
        └── User enters password → PUT /api/page-passwords validate
            ├── valid → UNLOCK
            └── invalid → show error

UNLOCKED STATE:
    |
    v
TaggerApp renders
    |
    v
Fetch board/cards with headers:
    - X-Organization-UUID: <orgUUID>
    - X-Page-Id: <boardUUID>
    - X-Page-Type: tagger
    - X-Page-Password: <32hex>
    |
    v
API Route Handler
    |
    +-- enforceAdminOrPagePassword({ pageId, pageType })
        |
        +-- Check admin-session cookie
        |   ├── valid → ALLOW
        |   └── invalid/missing → continue
        |
        +-- Check X-Page-* headers
        |   ├── missing → DENY (401)
        |   └── present → validate password
        |       ├── valid → ALLOW (increment usageCount)
        |       └── invalid → DENY (403)
        |
        v
    Return data or error
```

10.12 Governance
- All timestamps: ISO 8601 with milliseconds in UTC
- No tests (MVP policy)
- No breadcrumbs (Navigation policy)
- Version sync: package.json, all docs
- Build verification: npm run build must pass before commit

11. Organization Admin Panel (v0.19.0)

11.1 Overview
- Location: /organization/admin?org={orgUUID}
- Access: org-admin and super-admin roles only
- Purpose: Complete user and board management within organization scope
- Integration: OrgContextProvider + ToastProvider wrapping

11.2 Organization Context (src/lib/org-context.tsx)
- WHAT: Client-side context provider for organization UUID management
- WHY: Ensures consistent org scoping across admin panel; simplifies header injection
- Strategy:
  - Primary: Read orgUUID from URL query parameter ?org={uuid}
  - Fallback: Persist to/from localStorage (key: cardmass.lastOrg)
  - Validation: Only accepts valid UUID v4 format (via isUUIDv4)
  - Auto-redirect: Updates URL when org changes
- Hook: useOrg() returns { orgUUID, setOrgUUID, isLoading }
- Header enforcement: All API calls automatically include X-Organization-UUID matching path segment

11.3 Toast Notifications (src/components/ToastProvider.tsx)
- WHAT: Minimal toast notification system for user feedback
- WHY: No existing toast system found; required for async operation feedback
- Features:
  - Auto-dismiss after 5 seconds
  - Variants: success (green), error (red), info (blue)
  - Manual dismiss via close button
  - Accessible, keyboard-friendly
- Hook: useToast() returns { showToast(message, type?) }
- Position: Fixed bottom-right

11.4 User Management Tab (app/organization/admin/_components/UsersTab.tsx)

Features:
a) List Users
- Endpoint: GET /api/v1/organizations/{orgUUID}/users
- Display: table with email, name, role, actions
- Loading/error states with retry

b) Add User
- Modal form: email (required), name (required), role (member|org-admin)
- Password: auto-generated 32-hex token via crypto.getRandomValues()
- Copy-to-clipboard: "won't be shown again" warning
- Endpoint: POST /api/v1/organizations/{orgUUID}/users
- Payload: { email, name, role, password }

c) Edit User Role
- Inline dropdown: member ↔ org-admin
- Idempotent: POST /api/v1/organizations/{orgUUID}/users with { userId, role }
- Real-time feedback via toast

d) Regenerate Password
- Confirmation dialog → generate new 32-hex token client-side
- Endpoint: POST /api/v1/organizations/{orgUUID}/users with { userId, password }
- Secure modal display with copy button

e) Remove User
- Confirmation dialog
- Super-admin guard: disable for users with role='super-admin'
- Tooltip: "Super-admins cannot be removed from orgs"
- Endpoint: DELETE /api/v1/organizations/{orgUUID}/users/{userId}
- Handle 403 gracefully

11.5 Board Management Tab (app/organization/admin/_components/BoardsTab.tsx)

Features:
a) List Boards
- Endpoint: GET /api/v1/organizations/{orgUUID}/boards
- Display: table with slug, grid size (rows×cols), updated (ISO 8601 UTC), version, actions
- Direct link: Open in Tagger at /{orgUUID}/{boardUUID}/tagger

b) Quick Create Board
- Inline modal: name/slug (optional), rows (1-20), cols (1-20)
- Endpoint: POST /api/v1/organizations/{orgUUID}/boards
- Payload: { slug?, rows, cols, areas: [] }
- Alternative: "Open Creator" link to /{orgUUID}/creator

c) Edit Board
- Modal form: edit name/slug
- Display UUID (read-only)
- Endpoint: PATCH /api/v1/organizations/{orgUUID}/boards/{boardUUID}
- Payload: { slug }

d) Delete Board
- Confirmation dialog: "This cannot be undone"
- Endpoint: DELETE /api/v1/organizations/{orgUUID}/boards/{boardUUID}

11.6 Security & Compliance
- Header enforcement: All API calls include X-Organization-UUID matching path
- Password security: 32-hex tokens (128-bit entropy), client-side generation, ephemeral display
- Super-admin protection: Cannot be removed from organizations
- ISO 8601 timestamps: All dates displayed with milliseconds in UTC
- No breadcrumbs: Context-aware headers only
- Code comments: What + why for all major decisions

11.7 UX Patterns
- Loading states: spinners/skeletons during fetch
- Error states: inline messages with retry button
- Confirmation dialogs: for all destructive actions
- Toast feedback: success/error for all mutations
- Disabled states: during async operations
- Responsive tables: overflow-x-auto for mobile
- Accessible modals: click-outside-to-close, focus management

11.8 Integration Points
- Entry: Organization page (app/[organizationUUID]/page.tsx) → "Admin Panel" button with ?org={orgUUID}
- Visibility: Button only shown to org-admin and super-admin roles
- Tab state: maintained in component state (not URL)
- Context preservation: org query parameter persists across navigation
