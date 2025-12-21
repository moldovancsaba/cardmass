# Multi-Tenant Access Control Implementation

**Version:** 1.7.0  
**Updated:** 2025-12-21T13:36:32.549Z  
**Status:** ✅ Complete and Ready for Testing

---

## 🎯 Overview

CardMass now implements a comprehensive multi-tenant access control system with role-based routing and organization-level permissions.

### User Flow

**Super-Admins:**
- Login → `/admin/dashboard`
- Access to all organizations globally
- Cannot be removed from any org

**Organization Admins:**
- Login → `/organizations` (org selector)
- Select org → `/{orgUUID}` (board list)
- Access **Admin Panel** → `/organization/admin`
  - Manage users (grant/revoke access)
  - Manage boards
  - Generate access passwords

**Regular Members:**
- Login → `/organizations` (org selector)
- Select org → `/{orgUUID}` (board list)
- Select board → `/{orgUUID}/{boardUUID}/tagger` (work)

---

## 📦 What Changed

### 1. Data Model Updates

**UserDoc** (`src/lib/types.ts`):
```typescript
interface UserDoc {
  _id?: ObjectId
  email: string
  name: string
  role: 'user' | 'super-admin'  // Changed from 'admin'
  password: string  // MD5 hash
  organizationAccess?: Array<{  // NEW
    organizationUUID: string
    role: 'org-admin' | 'member'
  }>
  createdAt: string
  updatedAt: string
}
```

### 2. Authentication Helpers

**New Functions** (`src/lib/auth.ts`):
- `checkOrgAccess(userId, orgUUID)` - Returns user's role in org
- `getUserOrganizations(userId)` - Returns list of accessible orgs
- Updated `createAdminUser()` to accept `organizationAccess`

### 3. Routes & Pages

| Route | Purpose | Access Level |
|-------|---------|--------------|
| `/` | Smart router (auth → role-based redirect) | Public |
| `/admin/login` | Login page | Public |
| `/admin/dashboard` | Super-admin control panel | Super-admin only |
| `/organizations` | Organization selector | Authenticated |
| `/{orgUUID}` | Board selector | Org members |
| `/{orgUUID}/{boardUUID}/tagger` | Board workspace | Org members |
| `/organization/admin` | Org admin panel | Org-admin + Super-admin |

### 4. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/organizations` | GET | List user's accessible orgs |
| `/api/v1/organizations/{orgUUID}/users` | GET | List org users |
| `/api/v1/organizations/{orgUUID}/users` | POST | Add/update user access |
| `/api/v1/organizations/{orgUUID}/users/{userId}` | DELETE | Revoke org access |

---

## 🚀 Migration Guide

### For Existing Super-Admin Users

Your existing admin user needs to be updated in the database:

```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "admin@cardmass.com" },
  {
    $set: {
      role: "super-admin",  // Changed from "admin"
      organizationAccess: []
    }
  }
)
```

### Creating a New Organization Admin

**Option 1: Via Script**
```bash
node scripts/create-admin-quick.mjs
# Email: orgadmin@example.com
# Password: your-password
# Name: Org Admin
# Role: user
```

Then grant org access via API:
```bash
curl -X POST http://localhost:3000/api/v1/organizations/{orgUUID}/users \
  -H "Content-Type: application/json" \
  -b "admin_session=YOUR_TOKEN" \
  -d '{
    "userId": "USER_ID_FROM_MONGODB",
    "role": "org-admin"
  }'
```

**Option 2: Direct MongoDB**
```javascript
// Create user
db.users.insertOne({
  email: "orgadmin@example.com",
  password: "MD5_HASH_HERE",
  name: "Org Admin",
  role: "user",
  organizationAccess: [
    {
      organizationUUID: "your-org-uuid-here",
      role: "org-admin"
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})
```

### Creating a Regular Member

Same as org admin but use `role: "member"` in organizationAccess.

---

## 🧪 Testing Flows

### Flow 1: Super-Admin

1. Visit `http://localhost:3000`
2. Redirects to `/admin/login`
3. Login with super-admin credentials
4. Redirects to `/admin/dashboard`
5. Access global admin functions
6. Navigate to `/organizations` to see all orgs
7. Select any org → access granted automatically

### Flow 2: Organization Admin

1. Visit `http://localhost:3000`
2. Login
3. Redirects to `/organizations`
4. See only assigned organizations
5. Select organization
6. See "Admin Panel" button
7. Click Admin Panel → `/organization/admin`
8. Manage users, boards, passwords for that org

### Flow 3: Regular Member

1. Login
2. Redirects to `/organizations`
3. See only assigned organizations (no admin badge)
4. Select organization
5. No "Admin Panel" button (only "Creator" and "Back to Orgs")
6. See boards list
7. Click board → work in tagger

### Flow 4: Org Access Validation

1. Login as user with org A access
2. Try to access `/{orgB-UUID}` directly in URL
3. Should redirect to `/organizations` (access denied)

---

## 🔐 Security Features

✅ **Authentication Required**
- All routes check for valid session
- Unauthenticated users redirected to login

✅ **Organization-Level Isolation**
- Users only see orgs they have access to
- Direct URL access blocked if no permission

✅ **Role-Based Access Control**
- Super-admins: Global access
- Org-admins: Manage their organization
- Members: View and work on boards

✅ **Session Management**
- HttpOnly cookies (JS cannot access)
- 30-day expiry
- Stored in MongoDB sessions collection

---

## 📝 Known Limitations

### UI Placeholders

The following features have placeholder UIs (working APIs, UI needs implementation):

1. **User Management Table** (`/organization/admin` → Users tab)
   - API works: `GET/POST /api/v1/organizations/{orgUUID}/users`
   - UI shows "coming soon" message

2. **Password Regeneration** (`/organization/admin` → Passwords tab)
   - API exists: `POST /api/page-passwords`
   - UI shows API instructions

### Migration Required

- Existing `admin` role users must be updated to `super-admin` or `user`
- Existing users have no `organizationAccess` → need to be granted access

---

## 🛠️ Developer Guide

### Check User's Org Access (Server-Side)

```typescript
import { validateAdminToken, checkOrgAccess } from '@/lib/auth'
import { cookies } from 'next/headers'

const cookieStore = await cookies()
const token = cookieStore.get('admin_session')?.value

if (token) {
  const user = await validateAdminToken(token)
  if (user && user._id) {
    const orgRole = await checkOrgAccess(user._id.toString(), orgUUID)
    // Returns: 'super-admin' | 'org-admin' | 'member' | null
  }
}
```

### Check User's Org Access (Client-Side)

```typescript
// Fetch user's organizations
const res = await fetch('/api/auth/organizations')
const data = await res.json()
// data.organizations contains [{organizationUUID, role}, ...]
```

### Add User to Organization (Org Admin)

```typescript
const res = await fetch(`/api/v1/organizations/${orgUUID}/users`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'mongodb-user-id',
    role: 'org-admin' // or 'member'
  })
})
```

### Remove User from Organization

```typescript
const res = await fetch(
  `/api/v1/organizations/${orgUUID}/users/${userId}`,
  { method: 'DELETE' }
)
```

---

## 🎨 UI Component Patterns

### Protected Page Pattern

```typescript
// Server component
import { cookies, redirect } from 'next/headers'
import { validateAdminToken, checkOrgAccess } from '@/lib/auth'

export default async function ProtectedPage({ params }) {
  const { orgUUID } = await params
  
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  
  if (!token) {
    redirect('/admin/login')
  }
  
  const user = await validateAdminToken(token)
  if (!user?.id) {
    redirect('/admin/login')
  }
  
  const orgRole = await checkOrgAccess(user._id.toString(), orgUUID)
  if (!orgRole) {
    redirect('/organizations')  // No access
  }
  
  // Render page...
}
```

### Client-Side Auth Check Pattern

```typescript
'use client'

useEffect(() => {
  fetch('/api/auth/check')
    .then(res => res.json())
    .then(data => {
      if (!data.authenticated) {
        router.push('/admin/login')
      }
    })
}, [])
```

---

## 📊 Database Collections

### users
```json
{
  "_id": ObjectId,
  "email": "string",
  "name": "string",
  "role": "user | super-admin",
  "password": "MD5-hash",
  "organizationAccess": [
    {
      "organizationUUID": "uuid-v4",
      "role": "org-admin | member"
    }
  ],
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

### sessions
```json
{
  "token": "32-char-hex",
  "userId": ObjectId,
  "email": "string",
  "createdAt": "ISO-8601",
  "expiresAt": "ISO-8601"
}
```

---

## 🐛 Troubleshooting

### "Invalid session" on login
- Check MongoDB connection
- Verify user exists in database
- Check password hash matches MD5 format

### Redirected to /organizations but no orgs shown
- User has no `organizationAccess` entries
- Use API or MongoDB to grant org access

### Can't access /organization/admin
- User role in org must be `org-admin` or global `super-admin`
- Check `organizationAccess` array in user document

### Build errors after update
- Run `rm -rf .next && npm run build`
- Check all imports use correct auth functions

---

## 🎯 Next Steps (Future Enhancements)

- [ ] Full user management UI (table, add, edit, delete)
- [ ] Board-level permissions (granular access per board)
- [ ] Invitation system (email invites with auto-signup)
- [ ] Audit log (track who did what when)
- [ ] Production-grade password hashing (bcrypt/argon2)
- [ ] Session refresh/revocation UI
- [ ] Bulk user operations
- [ ] CSV import/export for users

---

## 📚 Related Documentation

- `AUTHENTICATION_AND_ACCESS.md` - Auth system overview
- `ARCHITECTURE.md` - System architecture
- `WARP.md` - Development guide
- `scripts/create-admin-quick.mjs` - User creation script
- `scripts/debug-users.mjs` - User inspection script

---

**Implementation completed:** 2025-10-03T09:22:23Z  
**Ready for testing and deployment** ✅
