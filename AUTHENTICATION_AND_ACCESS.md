# Authentication and Access Control

**Version**: 0.17.0  
**Last Updated**: 2025-10-02T11:20:26.000Z

> Summary guidance lives in `HANDBOOK.md` §3. This document dives into full authentication specs.

## Overview

CardMass implements a zero-trust authentication and access control system inspired by MessMass. The system enables:

- **Admin Sessions**: Full access bypass for authenticated administrators
- **Page Passwords**: Per-board password protection for non-admin viewers
- **Shareable Links**: Auto-login via URL password parameters

## Architecture

### Zero-Trust Model

The zero-trust rule: **No content is accessible without valid authentication.**

Two authentication paths:
1. **Admin Session** (bypasses all page passwords)
2. **Valid Page Password** (grants access to specific board)

### Components

#### 1. Data Models

**UserDoc** (`src/lib/types.ts`)
```typescript
interface UserDoc {
  _id?: ObjectId;
  email: string;
  name: string;
  role: 'admin' | 'super-admin';
  password: string; // MD5-style hash
  createdAt: string; // ISO 8601 with ms
  updatedAt: string; // ISO 8601 with ms
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

- **users**: Admin user accounts
- **sessions**: Active admin session tokens (30-day expiry)
- **pagePasswords**: Page-level access passwords

#### 3. Authentication Library

**`src/lib/auth.ts`**
- `loginAdmin(email, password)` - Creates session token
- `validateAdminToken(token)` - Verifies session validity
- `logoutAdmin(token)` - Invalidates session
- `createAdminUser(...)` - Creates new admin (super-admin only)
- `getAllAdmins()` - Lists all admin users
- `getAdminByEmail(email)` - Fetches admin by email

**`src/lib/pagePassword.ts`** (MessMass-style)
- `getOrCreatePagePassword(pageId, pageType, regenerate)` - Idempotent password creation
- `validatePagePassword(pageId, pageType, password)` - Validates and tracks usage
- `generateShareableLink(...)` - Creates password-embedded URLs

#### 4. API Endpoints

**Admin Authentication**
- `POST /api/auth/login` - Admin login (sets httpOnly cookie)
- `POST /api/auth/logout` - Session termination
- `GET /api/auth/check` - Session status check

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

### Bootstrap: Create First Admin

```bash
node scripts/create-admin.mjs
```

Prompts for:
- Email
- Name
- Password (will be MD5-hashed)
- Role (admin or super-admin)

### Admin Login

1. Navigate to `/admin/login`
2. Enter email and password
3. Session cookie (`admin_session`) set for 30 days
4. All protected pages accessible without passwords

### Generate Page Password

**Via API** (admin-only):
```bash
curl -X POST http://localhost:4000/api/page-passwords \
  -H "Content-Type: application/json" \
  -b "admin_session=<token>" \
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

**For Admin Users:**
- Login at `/admin/login`
- All boards accessible without passwords

## Security Considerations

### Password Storage
- **Admin passwords**: MD5-hashed (NOT cryptographically secure; MVP only)
- **Page passwords**: 32-char hex tokens (crypto.randomBytes)
- **Session tokens**: 32-char hex tokens (crypto.randomBytes)

### Session Management
- **httpOnly cookies**: Prevents XSS attacks
- **SameSite=Lax**: CSRF protection
- **Secure flag**: HTTPS-only in production
- **30-day expiry**: Auto-cleanup of old sessions

### Password Validation
- Server-side only (never client-side)
- Usage tracking (count, lastUsedAt)
- Optional expiration (expiresAt field)

### Admin Bypass
- Admin sessions checked first
- Page passwords secondary fallback
- No password required for admins

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
