# Authentication System Testing Guide

**Version:** 1.7.0  
**Updated:** 2025-12-21T13:36:32.549Z

## ✅ What's Implemented So Far

### Backend Infrastructure (Complete)
- ✅ User management system (`src/lib/users.ts`)
- ✅ Session token authentication (`src/lib/auth.ts`)
- ✅ Page password management (`src/lib/pagePassword.ts`)
- ✅ Admin login API (`POST/DELETE /api/admin/login`)
- ✅ Auth check API (`GET /api/auth/check`)
- ✅ Page password API (`POST/PUT /api/page-passwords`)

### Admin User Created
```
📧 Email: admin@doneisbetter.com
👤 Name: Admin User
🔑 Role: super-admin
🆔 User ID: 68de6223a16a8d10fde94cb8
🔐 Password: 753f54954c5b09718890ef5f5d16fe4a
```

**⚠️ SAVE THIS PASSWORD!** It won't be shown again.

---

## 🧪 Testing Instructions

### Step 1: Start the Development Server

```bash
npm run dev
```

Server will start on `http://localhost:4000`

### Step 2: Test Login API (Using Script)

```bash
node scripts/test-login.mjs admin@doneisbetter.com 753f54954c5b09718890ef5f5d16fe4a
```

This will test:
- ✅ POST /api/admin/login (login)
- ✅ GET /api/auth/check (verify session)
- ✅ DELETE /api/admin/login (logout)

### Step 3: Test Login API (Using curl)

**Login:**
```bash
curl -X POST http://localhost:4000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@doneisbetter.com","password":"753f54954c5b09718890ef5f5d16fe4a"}' \
  -c cookies.txt -v
```

**Check Auth Status:**
```bash
curl http://localhost:4000/api/auth/check \
  -b cookies.txt
```

**Logout:**
```bash
curl -X DELETE http://localhost:4000/api/admin/login \
  -b cookies.txt
```

### Step 4: Test Page Password API

**Create a page password (requires admin login first):**
```bash
curl -X POST http://localhost:4000/api/page-passwords \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "pageId": "YOUR_BOARD_UUID",
    "pageType": "tagger",
    "organizationUUID": "YOUR_ORG_UUID"
  }'
```

**Validate a page password:**
```bash
curl -X PUT http://localhost:4000/api/page-passwords \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "YOUR_BOARD_UUID",
    "pageType": "tagger",
    "password": "GENERATED_PASSWORD"
  }'
```

---

## 🚧 What's NOT Yet Implemented

### UI Components (Next Phase)
- ❌ PasswordGate component (password prompt screen)
- ❌ Tagger page integration (protect board access)
- ❌ Admin login UI page

### Server Enforcement (Next Phase)
- ❌ Protected boards API (require auth for GET /api/v1/organizations/[org]/boards/[board])
- ❌ Protected cards API (require auth for GET /api/v1/organizations/[org]/cards)

---

## 📝 Understanding "Tagger Integration"

**Current State:**
- Tagger page loads board and card data **without any authentication**
- Anyone with the URL can view the board

**After Integration:**
1. **Non-admin visitors** see a password prompt screen
2. **They must enter the correct page password** to proceed
3. **Admin users (logged in)** skip the prompt automatically
4. All API requests include auth headers

**Example Flow:**
```
User visits: /{orgUUID}/{boardUUID}/tagger
           ↓
      Is admin logged in?
           ↓
    YES ─────────→ Show board immediately
           ↓ NO
    Show password prompt
           ↓
  User enters password
           ↓
   Validate with PUT /api/page-passwords
           ↓
    Valid? → Show board
    Invalid? → Try again
```

---

## 🎯 Next Steps (After Testing)

1. **Test the APIs** using the scripts above
2. **Verify login works** and cookies are set correctly
3. **Let me know if tests pass**, then I'll implement:
   - PasswordGate component
   - Tagger page protection
   - Server-side API enforcement

---

## 🔧 Troubleshooting

**Can't connect to MongoDB?**
- Check `.env.local` has `MONGODB_URI`
- Ensure MongoDB is running

**Login fails with 401?**
- Double-check email is exactly: `admin@doneisbetter.com`
- Double-check password is exactly: `753f54954c5b09718890ef5f5d16fe4a`
- Emails are case-insensitive (stored lowercase)

**No cookie in response?**
- Check Next.js dev server is running on port 4000
- Verify you're using `http://localhost:4000` not `127.0.0.1`

---

## 🔐 Security Notes

- Passwords are 32-hex tokens (NOT hashed) per MessMass design
- Session cookies are HttpOnly (can't be accessed by JavaScript)
- Session expires after 7 days
- All timestamps are ISO 8601 with milliseconds (UTC)
