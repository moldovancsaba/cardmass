# Authentication and Access Control

**Version**: 2.0.0  
**Last Updated**: 2025-01-XX

> **IMPORTANT**: CardMass now uses SSO (Single Sign-On) for all user authentication and management. Legacy user management has been removed.

> Summary guidance lives in `HANDBOOK.md` §3. This document dives into full authentication specs.

## Overview

CardMass implements a zero-trust authentication and access control system using SSO (Single Sign-On). The system enables:

- **SSO Authentication**: All users authenticate via SSO (OAuth2/OIDC)
- **App Permissions**: User access and roles are managed in SSO
- **Page Passwords**: Per-board password protection for non-admin viewers
- **Shareable Links**: Auto-login via URL password parameters

## Architecture

### Zero-Trust Model

The zero-trust rule: **No content is accessible without valid authentication.**

Authentication paths:
1. **SSO Session** (primary - all users authenticate via SSO)
2. **Valid Page Password** (grants access to specific board)

### Components

#### 1. Data Models

**UnifiedUser** (`src/lib/unified-auth.ts`)
```typescript
interface UnifiedUser {
  id: string;                    // SSO user ID (UUID)
  email: string;                 // Email address
  name: string;                  // Full name
  role: AppRole;                 // 'none' | 'guest' | 'user' | 'admin' | 'owner'
  authSource: 'sso';             // Authentication source (SSO only)
  ssoUserId?: string;            // SSO user ID
}
```

**PagePasswordDoc** (`src/lib/types.ts`)
```typescript
interface PagePasswordDoc {
  _id?: ObjectId;
  pageId: string; // boardUUID
  pageType: 'tagger';
  password: string; // 32-char hex token
  createdAt: string;
  usageCount: number;
  lastUsedAt?: string;
  expiresAt?: string;
}
```

#### 2. MongoDB Collections

- **ssoSessions**: SSO session tokens and user data (30-day expiry)
- **pagePasswords**: Page-level access passwords

**Note**: Legacy `users` and `sessions` collections have been removed. All user management is handled by SSO.

#### 3. Authentication Library

**`src/lib/unified-auth.ts`** (SSO-only)
- `getAuthenticatedUser(cookies)` - Validates SSO session and returns user
- `hasAccess(user)` - Checks if user has any access
- `isAdmin(user)` - Checks if user is admin or owner
- `isOwner(user)` - Checks if user is owner

**`src/lib/pagePassword.ts`** (MessMass-style)
- `getOrCreatePagePassword(pageId, pageType, regenerate)` - Idempotent password creation
- `validatePagePassword(pageId, pageType, password)` - Validates and tracks usage
- `generateShareableLink(...)` - Creates password-embedded URLs

#### 4. API Endpoints

**SSO Authentication**
- `GET /api/auth/sso/login` - Initiate SSO OAuth flow
- `GET /api/auth/sso/callback` - SSO OAuth callback (handles token exchange)
- `GET /api/auth/check` - SSO session status check

**Page Passwords**
- `POST /api/page-passwords` - Create/retrieve board password (admin-only)
  - Body: `{ pageId, pageType, organizationUUID, regenerate? }`
  - Returns: `{ password, shareableLink, ... }`
- `PUT /api/page-passwords` - Validate password with admin bypass
  - Body: `{ pageId, pageType, password }`
  - Returns: `{ isValid, isAdmin }`
- `POST /api/page-passwords/validate` - Public validation endpoint
  - Body: `{ pageId, pageType, password }`
  - Sets cookie on success

#### 5. UI Components

**PasswordGate** (`src/components/PasswordGate.tsx`)
- Client-side access control wrapper
- Admin bypass check on mount
- URL password parameter auto-validation (?pw=xxx)
- Password prompt UI for non-admin users
- Cookie-based session persistence

**Admin Login** (`app/admin/login/page.tsx`)
- Admin authentication UI
- Email/password form
- Session cookie management

## Usage

### Bootstrap: SSO Setup

**Note**: CardMass no longer manages users locally. All users must be created in the SSO system.

1. Configure SSO environment variables:
   - `SSO_BASE_URL` - SSO service URL
   - `SSO_CLIENT_ID` - OAuth client ID
   - `SSO_CLIENT_SECRET` - OAuth client secret
   - `SSO_REDIRECT_URI` - OAuth callback URL

2. Create users in SSO system (not in CardMass)

3. Grant app permissions in SSO for users who need access to CardMass

### SSO Login

1. Navigate to CardMass homepage
2. Click "Sign in with SSO"
3. Redirected to SSO login page
4. After authentication, redirected back to CardMass
5. SSO session cookie (`sso_session`) set for 30 days
6. All protected pages accessible based on SSO permissions

### Generate Page Password

**Via API** (SSO authenticated users only):
```bash
curl -X POST http://localhost:3000/api/page-passwords \
  -H "Content-Type: application/json" \
  -b "sso_session=<token>" \
  -d '{
    "pageId": "board-uuid-here",
    "pageType": "tagger",
    "organizationUUID": "org-uuid-here"
  }'
```

Response:
```json
{
  "success": true,
  "pagePassword": {
    "pageId": "...",
    "pageType": "tagger",
    "password": "a1b2c3...",
    "createdAt": "2025-10-02T11:20:26.123Z",
    "usageCount": 0
  },
  "shareableLink": {
    "url": "https://example.com/org-uuid/board-uuid/tagger?pw=a1b2c3...",
    "pageType": "tagger",
    "password": "a1b2c3..."
  }
}
```

### Share Board Access

**Option 1: Share Password**
- Copy password from API response
- Share 32-char hex string with viewer
- Viewer enters at password gate

**Option 2: Share Link**
- Copy `shareableLink.url` from API response
- Send link to viewer
- Password auto-validates from URL parameter
- URL param removed after validation for security

### Access Protected Board

**For Non-Admin Viewers:**
1. Navigate to board URL: `/{orgUUID}/{boardUUID}/tagger`
2. PasswordGate checks:
   - Admin session? → Grant access
   - URL password param? → Validate and grant access
   - Stored cookie? → Validate and grant access
   - None? → Show password prompt
3. Enter password and submit
4. Password validated server-side
5. Cookie set for future visits

**For SSO Authenticated Users:**
- Sign in via SSO
- All boards accessible based on SSO permissions

## Security Considerations

### Password Storage
- **User passwords**: Managed by SSO (not stored in CardMass)
- **Page passwords**: 32-char hex tokens (crypto.randomBytes)
- **SSO session tokens**: Stored in MongoDB `ssoSessions` collection

### Session Management
- **httpOnly cookies**: Prevents XSS attacks
- **SameSite=Lax**: CSRF protection
- **Secure flag**: HTTPS-only in production
- **30-day expiry**: Auto-cleanup of old sessions

### Password Validation
- Server-side only (never client-side)
- Usage tracking (count, lastUsedAt)
- Optional expiration (expiresAt field)

### SSO Authentication
- SSO sessions checked first
- Page passwords secondary fallback
- User permissions managed by SSO

## Future Enhancements

### Phase 4 (Not Yet Implemented)
- [ ] Server-side API enforcement on protected endpoints
- [ ] Middleware-based access control
- [ ] Admin UI for password management
- [ ] Password regeneration/revocation
- [ ] Password expiration enforcement
- [ ] Multi-password support per board
- [ ] Audit logs for access attempts

### Recommended Security Upgrades
- Replace MD5 with bcrypt/argon2 for admin passwords
- Add JWT signing for session tokens
- Implement rate limiting on login/validation endpoints
- Add 2FA for admin accounts
- Add password complexity requirements
- Add session timeout/idle detection

## Troubleshooting

### Admin Can't Login
- Verify user exists: Check `users` collection in MongoDB
- Verify password: Re-create user with `scripts/create-admin.mjs`
- Check session cookie: Clear browser cookies and retry

### Password Gate Shows Even for Admin
- Check `/api/auth/check` returns `authenticated: true`
- Verify `admin_session` cookie exists
- Check cookie domain and path settings

### Shareable Link Doesn't Work
- Verify password parameter in URL: `?pw=...`
- Check password length (must be 32 chars)
- Validate password hasn't expired
- Check pageId matches boardUUID

### Password Validation Fails
- Verify password format (32 lowercase hex)
- Check password exists for pageId+pageType combination
- Ensure password not expired (check expiresAt)
- Validate MongoDB connection

## Related Files

- **Data Models**: `src/lib/types.ts`
- **Auth Library**: `src/lib/auth.ts`
- **Page Passwords**: `src/lib/pagePassword.ts`
- **API Routes**: `app/api/auth/*`, `app/api/page-passwords/*`
- **UI Components**: `src/components/PasswordGate.tsx`, `app/admin/login/page.tsx`
- **Scripts**: `scripts/create-admin.mjs`
- **Integration**: `app/[organizationUUID]/[boardUUID]/tagger/page.tsx`

## References

- MessMass Authentication Model: [messmass/AUTHENTICATION_AND_ACCESS.md](https://github.com/moldovancsaba/messmass/blob/main/AUTHENTICATION_AND_ACCESS.md)
- Zero-Trust Architecture: Industry standard security model
- ISO 8601 Timestamps: Governance rule for all date/time fields
