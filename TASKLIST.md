# TASKLIST

Version: 1.8.0

Updated: 2025-12-21T18:31:24.915Z

> Source: `HANDBOOK.md` §5 lists the canonical active workstreams; this file tracks granular tasks.

- P2 — ✅ COMPLETED Add .nvmrc and update TECH_STACK.md
  - Owner: csaba
  - Completed: 2025-12-21T08:55:00.000Z
  - Notes: Created .nvmrc with Node 20.18.1 (LTS); updated TECH_STACK.md with Next.js 15.5.9 and .nvmrc reference

- P2 — ✅ COMPLETED Plan automation for doc sync
  - Owner: csaba
  - Completed: 2025-12-21T08:55:00.000Z
  - Notes: Automation already comprehensive via sync-version-timestamps.mjs, pre-commit hook, and npm scripts; no additional work required

- P0 — ✅ COMPLETED Auth: Data models & helpers (users, pagePasswords, lib/auth.ts, lib/pagePassword.ts)
  - Owner: ai
  - Completed: 2025-10-02T12:00:00.000Z

- P0 — ✅ COMPLETED Auth: API endpoints (POST/DELETE /api/auth/login, GET /api/auth/check, POST/PUT /api/page-passwords)
  - Owner: ai
  - Completed: 2025-10-02T12:15:00.000Z

- P0 — ✅ COMPLETED Auth: PasswordGate component and integrate on Tagger page (pageType 'tagger', pageId boardUUID)
  - Owner: ai
  - Completed: 2025-10-02T12:30:00.000Z

- P0 — ✅ COMPLETED Auth: Server enforcement on protected APIs (admin session or X-Page-Password headers)
  - Owner: ai
  - Completed: 2025-10-02T12:40:00.000Z

- P1 — ✅ COMPLETED Auth: Minimal admin user management (create/update password)
  - Owner: ai
  - Completed: 2025-10-02T12:35:00.000Z

- P0 — ✅ COMPLETED WARP.md creation and comprehensive documentation audit
  - Owner: ai
  - Completed: 2025-10-04T18:01:54.000Z
  - Notes: Updated WARP.md with admin scripts and auth details; synchronized all doc versions to 0.22.0

- P0 — ✅ COMPLETED Fix password reset script (hash with MD5)
  - Owner: ai
  - Completed: 2025-10-04T13:25:56.000Z
  - Notes: Fixed update-password.mjs to hash passwords with MD5 before storing; reset super-admin password

- P0 — ✅ COMPLETED Board UUID Migration (boardAreas rekey from slug to UUID)
  - Owner: ai
  - Completed: 2025-12-20T20:45:00.000Z
  - Notes: Created migration script 002; verified all 23 active cards already use UUID keys; documented UUID-first architecture

- P0 — ✅ COMPLETED Automate version/timestamp/doc synchronization
  - Owner: ai
  - Completed: 2025-12-21T00:31:56.039Z
  - Notes: Created sync-version-timestamps.mjs, pre-commit hook, install script, and npm scripts; enforces versioning protocol automatically

- P1 — ⏳ PENDING Manual QA against acceptance criteria
  - Owner: csaba
  - Expected: 2025-10-07T18:00:00.000Z
  - Notes: Test non-admin access, admin bypass, API enforcement, cookie properties

- P3 — 🚫 DEFERRED CSS Masonry layout for Tagger
  - Owner: n/a
  - Deferred: 2025-10-04T18:01:54.000Z
  - Notes: User decision to postpone masonry implementation indefinitely

## SSO Integration (Q1 2026)

> Full implementation plan in ROADMAP.md → "Q1 2026 — SSO Integration (DoneIsBetter Authentication)"

- P0 — ⏳ PLANNED SSO Phase 1.1: Register OAuth Client
  - Owner: csaba + ai
  - Expected: 2026-01-15T18:00:00.000Z
  - Notes: Create CardMass OAuth client in SSO admin UI; obtain client_id + client_secret; configure redirect URIs

- P0 — ⏳ PLANNED SSO Phase 1.2: Configure Environment Variables
  - Owner: csaba + ai
  - Expected: 2026-01-15T18:00:00.000Z
  - Notes: Add SSO_BASE_URL, SSO_CLIENT_ID, SSO_CLIENT_SECRET to .env.local and Vercel; keep legacy MONGODB_URI during migration

- P0 — ⏳ PLANNED SSO Phase 1.3: Install SSO Libraries
  - Owner: ai
  - Expected: 2026-01-15T18:00:00.000Z
  - Notes: Install jose (JWT verification) and optionally openid-client; update TECH_STACK.md

- P0 — ⏳ PLANNED SSO Phase 2.1: Create SSO Helper Library
  - Owner: ai
  - Expected: 2026-01-22T18:00:00.000Z
  - Notes: src/lib/sso/client.ts with PKCE generation, OAuth flow, token management, JWT parsing

- P0 — ⏳ PLANNED SSO Phase 2.2: Create SSO Permission Library
  - Owner: ai
  - Expected: 2026-01-22T18:00:00.000Z
  - Notes: src/lib/sso/permissions.ts with app permission queries, access requests, role checks, sync logic

- P0 — ⏳ PLANNED SSO Phase 2.3: Implement OAuth2 API Routes
  - Owner: ai
  - Expected: 2026-01-29T18:00:00.000Z
  - Notes: Create /api/auth/sso/login, /api/auth/sso/callback, /api/auth/sso/logout routes with full OAuth flow + permission checks

- P0 — ⏳ PLANNED SSO Phase 2.4: Create Session Management
  - Owner: ai
  - Expected: 2026-01-29T18:00:00.000Z
  - Notes: src/lib/sso/session.ts with MongoDB sessions collection; store tokens + app permissions

- P0 — ⏳ PLANNED SSO Phase 2.5: Create SSO UI Components
  - Owner: ai
  - Expected: 2026-02-05T18:00:00.000Z
  - Notes: SSOLoginButton, /access-pending page, /access-revoked page

- P0 — ⏳ PLANNED SSO Phase 3: Implement Dual Auth Mode
  - Owner: ai
  - Expected: 2026-02-12T18:00:00.000Z
  - Notes: Support both legacy and SSO auth simultaneously; fallback logic; migration UI at /settings/account

- P0 — ⏳ PLANNED SSO Phase 4: Role Mapping & Authorization Updates
  - Owner: ai
  - Expected: 2026-02-19T18:00:00.000Z
  - Notes: Map legacy roles to SSO roles; update all auth checks; implement permission sync background job

- P0 — ⏳ PLANNED SSO Phase 5: Testing & Rollout
  - Owner: csaba + ai
  - Expected: 2026-02-26T18:00:00.000Z
  - Notes: Complete testing checklist; internal testing; beta rollout; gradual migration of legacy users

- P0 — ⏳ PLANNED SSO Phase 6: Documentation & Cleanup
  - Owner: ai
  - Expected: 2026-02-28T18:00:00.000Z
  - Notes: Update all docs (AUTHENTICATION_AND_ACCESS.md, WARP.md, USER_GUIDE.md, etc.); create SSO_MIGRATION_GUIDE.md

