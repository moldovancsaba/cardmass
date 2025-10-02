# ARCHITECTURE

Version: 0.18.0
Generated: 2025-10-02T12:47:30.000Z

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
- placement: per-board assignment of a card to an area on a specific board (persisted in boardAreas[boardSlug] = areaLabel). Never persist 'spock'.
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
  - boardAreas?: Record<string, string>
  - Indexes: { uuid: 1 } unique, { organizationId: 1, status: 1, updatedAt: -1 }

4. API surface (App Router)
- Organizations
  - GET /api/v1/organizations — list (public)
  - POST /api/v1/organizations — create (public); generates uuid; ISO timestamps
  - GET /api/v1/organizations/[orgUUID] — fetch by uuid (validate v4)
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
- Slugs never appear in routing for the main board view.

6. Access guard (middleware)
- Middleware enforces that for org-scoped paths, the X-Organization-UUID header exists, is a UUID v4, and matches the path segment.
- Defense-in-depth: handlers also validate ids and organizationId ownership before reads/writes.

7. Current limitations and next steps
- boardAreas are still keyed by board slug (compat). A follow-up migration will introduce placements keyed by boardUUID.
- Legacy routes remain until Sunset; UI no longer depends on them.

8. Operational scripts
- scripts/migrations/001-add-organizations-and-backfill-uuids.mjs — creates organizations collection, backfills uuids and organizationId on boards/cards, and ensures indexes. Supports MIGRATE_DRY_RUN.
- scripts/maintenance/clear-spock-area.mjs — clears any legacy 'spock' in areaLabel.

9. Version & governance
- Follow Versioning and Release Protocol. Ensure version is consistent in package.json and all docs. All timestamps are ISO 8601 with ms, UTC.

10. Authentication & Access (MessMass zero-trust implementation)

10.1 Overview
- Zero-trust model: every protected page requires authentication via EITHER admin session OR valid page password
- Based on MessMass AUTHENTICATION_AND_ACCESS.md specification
- Implemented: v0.18.0
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

10.5 API Endpoints

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
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@doneisbetter.com","password":"753f54954c5b09718890ef5f5d16fe4a"}' \
  -c cookies.txt
```

Auth check:
```bash
curl http://localhost:4000/api/auth/check -b cookies.txt
```

Generate page password (admin):
```bash
curl -X POST http://localhost:4000/api/page-passwords \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"pageId":"<boardUUID>","pageType":"tagger","organizationUUID":"<orgUUID>"}'
```

Fetch board with password:
```bash
curl http://localhost:4000/api/v1/organizations/<orgUUID>/boards/<boardUUID>?scope=tagger \
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
