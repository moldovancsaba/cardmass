# TASKLIST

Version: 1.4.0

Updated: 2025-12-20T20:45:00.000Z

> Source: `HANDBOOK.md` §5 lists the canonical active workstreams; this file tracks granular tasks.

- P2 — Plan automation for doc sync (future)
  - Owner: csaba
  - Expected: 2025-10-15T18:00:00.000Z

- P2 — Add .nvmrc and update TECH_STACK.md
  - Owner: csaba
  - Expected: 2025-10-10T16:00:00.000Z

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

- P1 — ⏳ PENDING Manual QA against acceptance criteria
  - Owner: csaba
  - Expected: 2025-10-07T18:00:00.000Z
  - Notes: Test non-admin access, admin bypass, API enforcement, cookie properties

- P3 — 🚫 DEFERRED CSS Masonry layout for Tagger
  - Owner: n/a
  - Deferred: 2025-10-04T18:01:54.000Z
  - Notes: User decision to postpone masonry implementation indefinitely

