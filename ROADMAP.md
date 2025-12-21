# ROADMAP

Version: 1.16.0

Updated: 2025-12-21T21:31:11.890Z

> Source: consult `HANDBOOK.md` §5 for the authoritative roadmap summary. This file expands each milestone.

## Milestone: v0.22.0 — Documentation Excellence
- Status: ✅ COMPLETED (2025-10-04T18:01:54.000Z)
- Priority: P0

### Items
- ✅ WARP.md comprehensive developer guide with admin scripts and authentication
- ✅ Full documentation audit and synchronization (TECH_STACK, NAMING_GUIDE, README, TASKLIST, ROADMAP)
- ✅ Password reset script fix (MD5 hashing alignment)
- ✅ Version consistency across all documentation files (0.22.0)

## Milestone: Q4 2025
- Dependencies:
  - v0.19.0 docs baseline

### Items
- ✅ Automate version/timestamp/doc synchronization (script + pre-commit hook)
  - Owner: ai
  - Priority: P0
  - Status: COMPLETED (2025-12-21T00:31:56.039Z)
  - Notes: Created sync-version-timestamps.mjs with automatic version bumping (--patch/--minor/--major). Added pre-commit hook and npm scripts. Prevents documentation drift and enforces versioning protocol automatically.

- ✅ Board placements keyed by boardUUID
  - Owner: ai
  - Priority: P0
  - Status: COMPLETED (2025-12-20T20:45:00.000Z)
  - Notes: Verified via migration script 002. All 23 active cards already use UUID keys. TaggerApp has been using UUID-based keys since implementation. Migration script created and validated. Documentation updated to reflect UUID-first architecture.

- ✅ Add .nvmrc (Node 20) and reflect in TECH_STACK.md
  - Owner: csaba
  - Priority: P1
  - Status: COMPLETED (2025-12-21T08:55:00.000Z)
  - Notes: Created .nvmrc with Node 20.18.1 (LTS); updated TECH_STACK.md with Next.js 15.5.9 and .nvmrc reference

- Maintain and refresh WARP.md based on evolving workflows and scripts
  - Owner: ai
  - Priority: P2
  - Expected: 2025-10-20T12:00:00.000Z
  - Notes: Keep commands/architecture current and aligned with governance (ISO timestamps, version/doc sync).

- Masonry via CSS multicol for Tagger multi-column areas
  - Status: 🚫 DEFERRED (2025-10-04T18:01:54.000Z)
  - Owner: n/a
  - Priority: P3 (previously P0)
  - Notes: User decision to postpone masonry implementation indefinitely. Feature-flagged (ENABLE_MASONRY) approach was planned. Deferred to focus on core features and documentation.

- Zero-Trust Authentication & Access (admin-session + page passwords)
  - Owner: ai
  - Priority: P0
  - Status: ✅ COMPLETED (v0.19.0 - 2025-10-02T12:47:30.000Z)
  - Dependencies: MongoDB users/pagePasswords; cookie settings; Next.js API routes
  - Notes: Based on MessMass AUTHENTICATION_AND_ACCESS; enforce server-side checks; Tagger pages protected; build passes; dev server running
  - Deliverables:
    * Data models: users, pagePasswords collections with indexes
    * Helper libs: src/lib/users.ts, src/lib/auth.ts, src/lib/pagePassword.ts
    * API endpoints: POST/DELETE /api/auth/login, GET /api/auth/check, POST/PUT /api/page-passwords
    * UI components: PasswordGate.tsx, TaggerWithAuth.tsx
    * TaggerApp: 19 fetch calls updated with auth headers
    * Server enforcement: all boards/cards APIs with scope=tagger or X-Page-* headers
    * Operational scripts: create-user.mjs, update-password.mjs, test-login.mjs
    * Admin user created: admin@doneisbetter.com (super-admin)

## Milestone: Q1 2026 — SSO Integration (DoneIsBetter Authentication)
- Dependencies:
  - SSO service at https://sso.doneisbetter.com (v5.28.0+)
  - Current auth system (MD5-based) must remain operational during migration
- Priority: P0
- Owner: ai + csaba
- Target: 2026-02-28T23:59:59.000Z

### Overview

Migrate from custom MD5-based authentication to centralized SSO (Single Sign-On) using OAuth2/OIDC. This enables unified authentication across all DoneIsBetter applications and provides enterprise-grade security.

### Benefits

1. **Unified Authentication**: Single login across all DoneIsBetter apps (Camera, Launchmass, Messmass, etc.)
2. **Enhanced Security**: Replace MD5 with RS256 JWT tokens, PKCE, refresh token rotation
3. **Modern Auth Flows**: Magic links, social login (Facebook, Google), PIN verification
4. **Centralized User Management**: SSO admin UI for all user/role management
5. **App-Level Permissions**: Fine-grained role control (user, admin, superadmin) per app
6. **Session Management**: 30-day sliding sessions with automatic refresh
7. **Compliance**: OAuth2/OIDC standard compliance

### Current State Analysis

**Current Auth System** (src/lib/auth.ts):
- ✅ MD5-hashed passwords (NOT production-secure)
- ✅ HttpOnly cookies (admin_session)
- ✅ Base64-encoded session tokens
- ✅ 30-day expiry
- ✅ Server-side validation
- ✅ Page-level password protection
- ⚠️ No refresh tokens
- ⚠️ No OAuth support
- ⚠️ Single-app only

**Migration Strategy**: Parallel operation → gradual rollout → deprecation

### Implementation Phases

#### Phase 1: Infrastructure Setup (Week 1-2)

##### 1.1 Register OAuth Client with SSO
- **Task**: Create OAuth client in SSO admin UI
- **Location**: https://sso.doneisbetter.com/admin → OAuth Clients
- **Config**:
  ```
  Client Name: CardMass
  Description: Multi-dimensional card classification system
  Redirect URIs:
    - https://cardmass.com/api/auth/callback
    - https://cardmass.doneisbetter.com/api/auth/callback
    - http://localhost:6000/api/auth/callback (dev)
  Allowed Scopes: openid profile email offline_access
  Homepage URL: https://cardmass.com
  ```
- **Output**: client_id (UUID) + client_secret (UUID)
- **Deliverable**: Store credentials in .env.local (NEVER commit)

##### 1.2 Add SSO Environment Variables
- **File**: .env.local
- **Variables**:
  ```bash
  # SSO OAuth2/OIDC Configuration
  SSO_BASE_URL=https://sso.doneisbetter.com
  SSO_CLIENT_ID=<uuid-from-step-1.1>
  SSO_CLIENT_SECRET=<uuid-from-step-1.1>
  SSO_REDIRECT_URI=http://localhost:6000/api/auth/callback
  
  # Legacy auth (keep during migration)
  MONGODB_URI=<existing>
  MONGODB_DBNAME=cardmass
  ```
- **Security**: Add to .gitignore, use Vercel env vars for production

##### 1.3 Install SSO Client Libraries
- **Dependencies**:
  ```json
  {
    "jose": "^5.0.0",  // JWT verification (RS256)
    "openid-client": "^5.6.0"  // OAuth2/OIDC client (optional)
  }
  ```
- **Alternative**: Use native fetch (SSO provides REST API)

#### Phase 2: SSO Integration Implementation (Week 3-5)

##### 2.1 Create SSO Helper Library
- **File**: src/lib/sso/client.ts
- **Functions**:
  - `generatePKCE()` - Code verifier + challenge (S256)
  - `initiateOAuth()` - Redirect to SSO authorize endpoint
  - `exchangeCodeForTokens()` - Code → access/refresh/ID tokens
  - `parseIdToken()` - Extract user info from JWT
  - `refreshAccessToken()` - Refresh token rotation
  - `revokeTokens()` - Logout
  - `validateAccessToken()` - Verify JWT signature (RS256)

##### 2.2 Create SSO Permission Library
- **File**: src/lib/sso/permissions.ts
- **Functions**:
  - `getAppPermission(userId, accessToken)` - Query user's cardmass role
  - `requestAppAccess(userId, accessToken)` - Request pending approval
  - `hasAppAccess(permission)` - Check if user can access app
  - `isAppAdmin(permission)` - Check if user is admin/superadmin
  - `syncPermissions(session)` - Background permission refresh

##### 2.3 Implement OAuth2 Endpoints

**API Route**: app/api/auth/sso/login/route.ts
- **Method**: GET
- **Flow**:
  1. Generate PKCE (code_verifier + code_challenge)
  2. Store verifier in session
  3. Build state with CSRF token + return URL
  4. Redirect to SSO authorize endpoint
- **Query Params**: `?return_to=/settings` (optional)

**API Route**: app/api/auth/sso/callback/route.ts
- **Method**: GET
- **Flow**:
  1. Validate state parameter (CSRF + return URL)
  2. Exchange authorization code for tokens
  3. Parse user from ID token
  4. Query SSO for app permission
  5. Check if user has access:
     - No access → Request access → Redirect to /access-pending
     - Pending → Redirect to /access-pending
     - Approved → Create session → Redirect to return URL
  6. Store session with appRole (user/admin/superadmin)
- **Error Handling**: Graceful redirect to /login?error=auth_failed

**API Route**: app/api/auth/sso/logout/route.ts
- **Method**: POST
- **Flow**:
  1. Revoke refresh token with SSO
  2. Clear local session
  3. Redirect to SSO logout with post_logout_redirect_uri

##### 2.4 Create Session Management
- **File**: src/lib/sso/session.ts
- **Functions**:
  - `createSSOSession(user, tokens, permission)` - Store in MongoDB
  - `getSSOSession(sessionId)` - Retrieve session
  - `refreshSSOSession(sessionId)` - Refresh tokens + permissions
  - `destroySSOSession(sessionId)` - Cleanup
- **Schema** (MongoDB sessions collection):
  ```typescript
  {
    sessionId: string,
    userId: string,  // SSO user ID
    accessToken: string,
    refreshToken: string,
    idToken: string,
    appRole: 'user' | 'admin' | 'superadmin',
    appAccess: boolean,
    expiresAt: Date,
    createdAt: Date,
    lastRefreshedAt: Date
  }
  ```

##### 2.5 Create UI Components

**Component**: app/SSOLoginButton.tsx
- **Props**: `returnTo?: string`
- **Action**: Redirect to `/api/auth/sso/login?return_to={returnTo}`
- **UI**: "Sign in with DoneIsBetter" button

**Page**: app/access-pending/page.tsx
- **UI**: Waiting for admin approval message
- **Content**: Email support@cardmass.com for urgent access

**Page**: app/access-revoked/page.tsx
- **UI**: Access removed notification
- **Content**: Contact admin to restore access

#### Phase 3: Migration Strategy (Week 6-7)

##### 3.1 Dual Authentication Mode
- **Strategy**: Support BOTH legacy auth AND SSO simultaneously
- **Implementation**:
  ```typescript
  // Middleware: Check both auth methods
  async function authenticate(req) {
    // Try SSO first
    const ssoSession = await validateSSOSession(req);
    if (ssoSession.isValid) {
      return { user: ssoSession.user, method: 'sso' };
    }
    
    // Fallback to legacy
    const legacySession = await validateAdminToken(req);
    if (legacySession) {
      return { user: legacySession, method: 'legacy' };
    }
    
    return { user: null, method: null };
  }
  ```

##### 3.2 Migration UI
- **Location**: /settings/account (new page)
- **Features**:
  - Show current auth method (legacy/SSO)
  - "Migrate to SSO" button for legacy users
  - Link existing legacy account to SSO ID
- **Flow**:
  1. Legacy user logs in
  2. Sees banner: "Upgrade to SSO for unified login"
  3. Clicks "Migrate"
  4. Redirects to SSO OAuth
  5. On callback, link SSO ID to legacy account
  6. Future logins use SSO

##### 3.3 Data Migration Script
- **File**: scripts/migrate-to-sso.mjs
- **Purpose**: Link legacy users to SSO accounts
- **Logic**:
  ```javascript
  // For each legacy user:
  // 1. Search SSO for matching email
  // 2. If found, store SSO ID in legacy user record
  // 3. Mark as migrated
  // 4. Log results
  ```
- **Safety**: Dry-run mode, idempotent, rollback support

#### Phase 4: Role Mapping & Authorization (Week 8)

##### 4.1 Map Legacy Roles to SSO Roles
- **Mapping**:
  ```
  Legacy          → SSO App Role
  ------------------------------------
  super-admin     → superadmin
  admin           → admin  
  user            → user
  (none)          → none (request access)
  ```

##### 4.2 Update Authorization Checks
- **File**: src/lib/auth/middleware.ts
- **Changes**:
  ```typescript
  // Before
  if (session.role !== 'admin') { return 403; }
  
  // After
  if (session.appRole !== 'admin' && session.appRole !== 'superadmin') {
    return 403;
  }
  ```
- **Scope**: All protected routes, API endpoints, UI components

##### 4.3 Permission Sync Background Job
- **File**: src/lib/sso/sync-job.ts
- **Schedule**: Every 5 minutes for active sessions
- **Logic**:
  1. Get all active SSO sessions
  2. For each session, re-query SSO permission
  3. Update stored appRole and appAccess
  4. If access revoked, invalidate session
- **Deployment**: Vercel Cron or separate worker

#### Phase 5: Testing & Rollout (Week 9-10)

##### 5.1 Testing Checklist
- **OAuth Flow**:
  - [ ] Login redirects to SSO
  - [ ] PKCE verifier generated correctly
  - [ ] State parameter validated (CSRF)
  - [ ] Code exchange returns tokens
  - [ ] ID token parsed correctly
  - [ ] Return URL preserved through OAuth
- **Permission Check**:
  - [ ] New user → request access → pending page
  - [ ] Pending user → pending page
  - [ ] Approved user → dashboard
  - [ ] Admin user → sees admin UI
  - [ ] Revoked user → revoked page
- **Session Management**:
  - [ ] Access token refresh works
  - [ ] Refresh token rotation works
  - [ ] Logout revokes tokens
  - [ ] Expired sessions redirect to login
- **Migration**:
  - [ ] Legacy user can migrate to SSO
  - [ ] Migrated user logs in via SSO
  - [ ] Legacy auth still works during transition
- **Edge Cases**:
  - [ ] User logs out from SSO → cardmass session invalidated
  - [ ] Admin changes user role in SSO → cardmass syncs permission
  - [ ] User denied in SSO → cardmass shows access denied

##### 5.2 Rollout Strategy
- **Phase 1**: Internal testing (localhost + staging)
- **Phase 2**: Beta users (opt-in via /settings/account)
- **Phase 3**: All new users (default to SSO)
- **Phase 4**: Gradual migration of legacy users
- **Phase 5**: Deprecate legacy auth (6 months after SSO launch)

##### 5.3 Monitoring & Alerts
- **Metrics**:
  - SSO login success/failure rate
  - Token refresh success rate
  - Permission sync failures
  - Session invalidation reasons
- **Alerts**:
  - SSO service unreachable
  - Token exchange failures > 5%
  - Permission API failures

#### Phase 6: Documentation & Cleanup (Week 11-12)

##### 6.1 Update Documentation
- **Files to Update**:
  - AUTHENTICATION_AND_ACCESS.md - Add SSO section
  - WARP.md - Update auth commands
  - USER_GUIDE.md - "Sign in with DoneIsBetter" flow
  - ARCHITECTURE.md - SSO integration architecture
  - TECH_STACK.md - Add jose/openid-client

##### 6.2 Migration Guide for Users
- **Create**: docs/SSO_MIGRATION_GUIDE.md
- **Content**:
  - What is SSO and why we're migrating
  - Benefits for users
  - How to migrate your account
  - FAQ and troubleshooting

##### 6.3 Admin Workflow Documentation
- **Create**: docs/SSO_ADMIN_GUIDE.md
- **Content**:
  - Managing user permissions in SSO admin UI
  - Approving access requests
  - Changing user roles
  - Revoking access
  - Audit logs

##### 6.4 Deprecate Legacy Auth (After 6 Months)
- **Timeline**: 2026-08-31T23:59:59.000Z
- **Steps**:
  1. Email all remaining legacy users
  2. Force migration on next login
  3. Archive legacy auth code
  4. Remove MD5 dependencies
  5. Clean up MongoDB users collection

### Technical Decisions

#### Why OAuth2/OIDC (Not Cookie-Based SSO)?
- ✅ CardMass is NOT on *.doneisbetter.com subdomain
- ✅ OAuth2 works with any domain (cardmass.com)
- ✅ Standard protocol, widely supported
- ✅ Token-based, stateless auth
- ✅ Mobile-ready for future apps

#### Why App-Level Permissions?
- ✅ Centralized role management across all apps
- ✅ Single source of truth for permissions
- ✅ Admin approval workflow
- ✅ Real-time permission changes
- ✅ Audit trail via SSO

#### Why Parallel Auth During Migration?
- ✅ Zero downtime migration
- ✅ Gradual rollout reduces risk
- ✅ Rollback plan if SSO fails
- ✅ Users can choose when to migrate

### Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SSO service downtime | Low | High | Fallback to legacy auth during outage |
| Token refresh failures | Medium | Medium | Exponential backoff, user re-auth |
| Permission sync lag | Medium | Low | Cache permissions, sync every 5min |
| Migration data loss | Low | High | Backup before migration, dry-run testing |
| User confusion | High | Low | Clear migration UI, documentation, support |

### Success Criteria

- [ ] 100% of new users can sign up via SSO
- [ ] 95%+ of legacy users migrated within 3 months
- [ ] SSO login success rate > 99%
- [ ] Zero security incidents related to auth
- [ ] Average login time < 3 seconds
- [ ] Permission changes propagate within 5 minutes
- [ ] Documentation complete and accurate

### Resources

- **SSO Documentation**: https://sso.doneisbetter.com
- **Integration Guide**: /Users/moldovancsaba/Projects/sso/docs/THIRD_PARTY_INTEGRATION_GUIDE.md
- **OAuth 2.0 RFC**: https://tools.ietf.org/html/rfc6749
- **PKCE RFC**: https://tools.ietf.org/html/rfc7636
- **OIDC Core**: https://openid.net/specs/openid-connect-core-1_0.html
