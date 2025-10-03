# Quick Start: Multi-Tenant Access Control

## 🚀 Get Started in 5 Minutes

### Step 1: Update Your Existing Admin User

Your existing `admin@cardmass.com` user needs role update:

```bash
# Open MongoDB shell or use Compass
```

```javascript
db.users.updateOne(
  { email: "admin@cardmass.com" },
  { 
    $set: { 
      role: "super-admin",
      organizationAccess: []
    } 
  }
)
```

### Step 2: Start the Server

```bash
npm run dev
```

### Step 3: Test Super-Admin Flow

1. Visit **http://localhost:4000**
2. You'll be redirected to `/admin/login`
3. Login with: `admin@cardmass.com` / `admin123`
4. You'll land on `/admin/dashboard`
5. Click "View Organizations" to see all orgs

### Step 4: Create an Org Admin User

**Option A: Quick Script (Recommended)**

```bash
node scripts/create-admin-quick.mjs
```

Enter:
- Email: `orgadmin@example.com`
- Password: `test123`
- Name: `Org Admin`
- Role: `user` (not super-admin)

**Then grant org access:**

1. Login to super-admin dashboard
2. Get an organization UUID from `/api/v1/organizations`
3. Get the new user's MongoDB `_id` from `scripts/debug-users.mjs`
4. Grant access via API:

```bash
# Replace YOUR_ORG_UUID and USER_ID
curl -X POST http://localhost:4000/api/v1/organizations/YOUR_ORG_UUID/users \
  -H "Content-Type: application/json" \
  -b "admin_session=YOUR_SESSION_COOKIE" \
  -d '{
    "userId": "USER_ID",
    "role": "org-admin"
  }'
```

**Or directly in MongoDB:**

```javascript
// Get user ID first
const user = db.users.findOne({ email: "orgadmin@example.com" })

// Update with org access
db.users.updateOne(
  { _id: user._id },
  {
    $set: {
      organizationAccess: [
        {
          organizationUUID: "your-org-uuid-here",
          role: "org-admin"
        }
      ]
    }
  }
)
```

### Step 5: Test Org Admin Flow

1. Logout from super-admin
2. Login as `orgadmin@example.com` / `test123`
3. You'll see `/organizations` page with ONLY the assigned org
4. Click the organization card
5. You'll see "Admin Panel" button
6. Click Admin Panel → Manage users/boards/passwords

### Step 6: Create a Regular Member

Same process as Org Admin, but use `role: "member"` instead of `"org-admin"` in the organizationAccess.

---

## 🧪 Testing Checklist

### Super-Admin Tests

- [ ] Login redirects to `/admin/dashboard`
- [ ] Can access all organizations
- [ ] Can view `/organization/admin` for any org
- [ ] Can't be removed from organizations

### Org-Admin Tests

- [ ] Login redirects to `/organizations`
- [ ] Only sees assigned organizations
- [ ] Sees "Admin" badge on assigned orgs
- [ ] Can access "Admin Panel" button in org
- [ ] Can view user list at `/api/v1/organizations/{orgUUID}/users`
- [ ] Cannot access orgs they're not assigned to

### Regular Member Tests

- [ ] Login redirects to `/organizations`
- [ ] Only sees assigned organizations
- [ ] No "Admin" badge visible
- [ ] No "Admin Panel" button
- [ ] Can view and work on boards
- [ ] Cannot access `/organization/admin`

### Security Tests

- [ ] Unauthenticated users redirected to login
- [ ] Direct URL to unassigned org redirects to `/organizations`
- [ ] Session expires after 30 days
- [ ] Logout clears session properly

---

## 🔍 Debug Commands

### List All Users
```bash
node scripts/debug-users.mjs
```

### Check Organizations
```bash
curl http://localhost:4000/api/v1/organizations | jq
```

### Check Who Has Access to an Org
```bash
curl http://localhost:4000/api/v1/organizations/YOUR_ORG_UUID/users \
  -b "admin_session=YOUR_TOKEN" | jq
```

### Check Your Session
```bash
curl http://localhost:4000/api/auth/check \
  -b "admin_session=YOUR_TOKEN" | jq
```

### Check Your Organizations
```bash
curl http://localhost:4000/api/auth/organizations \
  -b "admin_session=YOUR_TOKEN" | jq
```

---

## 📋 Common Operations

### Grant User Access to Organization

```javascript
// In MongoDB
db.users.updateOne(
  { email: "user@example.com" },
  {
    $push: {
      organizationAccess: {
        organizationUUID: "org-uuid-here",
        role: "member" // or "org-admin"
      }
    }
  }
)
```

### Revoke User Access from Organization

```javascript
// In MongoDB
db.users.updateOne(
  { email: "user@example.com" },
  {
    $pull: {
      organizationAccess: {
        organizationUUID: "org-uuid-here"
      }
    }
  }
)
```

### Promote Member to Org-Admin

```javascript
// In MongoDB
db.users.updateOne(
  { 
    email: "user@example.com",
    "organizationAccess.organizationUUID": "org-uuid-here"
  },
  {
    $set: {
      "organizationAccess.$.role": "org-admin"
    }
  }
)
```

---

## 🐛 Troubleshooting

### "No organizations found" after login

**Problem:** User has no `organizationAccess` entries

**Solution:**
```javascript
// Check user's access
db.users.findOne({ email: "user@example.com" })

// If organizationAccess is empty or missing, add access
db.users.updateOne(
  { email: "user@example.com" },
  {
    $set: {
      organizationAccess: [
        { organizationUUID: "org-uuid", role: "member" }
      ]
    }
  }
)
```

### Can't login - "Invalid email or password"

**Check:**
1. User exists: `db.users.findOne({ email: "..." })`
2. Password hash is MD5: `md5("yourpassword")` = stored hash
3. Use: `node scripts/debug-users.mjs` to verify

### Redirected to /organizations but want dashboard

**Problem:** User is not a super-admin

**Solution:**
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "super-admin" } }
)
```

### Build fails after changes

```bash
rm -rf .next
npm run build
```

---

## 🎯 Next Actions

Once you've tested the flows:

1. **Migrate existing users** - Update roles and add organizationAccess
2. **Create org admins** - Assign one admin per organization
3. **Invite members** - Grant access to users per organization
4. **Test with real data** - Create boards and verify access control
5. **Deploy** - Push to production once validated

---

## 📞 Need Help?

- Check `MULTI_TENANT_ACCESS_CONTROL.md` for full documentation
- Check `AUTHENTICATION_AND_ACCESS.md` for auth system details
- Run `node scripts/debug-users.mjs` to inspect user data
- Check MongoDB directly to verify data structure

---

**Ready to test!** 🚀
