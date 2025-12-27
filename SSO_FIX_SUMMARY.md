# SSO Authentication Fix Summary

## Root Causes Identified

### 1. **Status Value Mismatch (CRITICAL)**
**Problem:** SSO database stores permission status as `'active'` for approved users, but cardmass code was checking for `'approved'`. This caused `hasAppAccess()` to always return `false` even when users had valid access.

**Fix:** Updated `hasAppAccess()` and `isSessionValid()` to accept both `'active'` and `'approved'` status values.

**Files Changed:**
- `src/lib/sso/permissions.ts` - Updated `hasAppAccess()` function
- `src/lib/sso/session.ts` - Updated `isSessionValid()` function
- `src/lib/sso/permissions.ts` - Updated `PermissionStatus` type to include `'active'`

### 2. **Redirect URI Mismatch (LIKELY)**
**Problem:** The redirect URI in cardmass `.env.local` (`http://localhost:3000/api/auth/sso/callback`) may not be registered in SSO OAuth client settings. SSO requires EXACT match of redirect URIs.

**Fix:** 
- Updated SSO fix script to include `localhost:3000` redirect URIs
- Created diagnostic and fix scripts to help identify and resolve redirect URI issues

**Files Changed:**
- `/Users/moldovancsaba/Projects/sso/scripts/fix-cardmass-redirects.mjs` - Added `localhost:3000` URIs
- `scripts/diagnose-sso-issue.mjs` - New diagnostic tool
- `scripts/fix-sso-redirect-uri.mjs` - New fix guide
- `scripts/update-sso-redirect-uris.mjs` - New automated fix script

### 3. **Error Handling Improvements**
**Problem:** Generic "Authentication failed" error made it difficult to diagnose the actual issue.

**Fix:** Enhanced error logging with specific error codes and detailed diagnostics.

**Files Changed:**
- `app/api/auth/sso/callback/route.ts` - Enhanced error logging
- `app/page.tsx` - Added new error messages

## Required Actions

### Immediate Actions

1. **Fix Redirect URI in SSO:**
   ```bash
   # Option 1: Via SSO Admin UI (Recommended)
   # Go to: https://sso.doneisbetter.com/admin/oauth-clients
   # Find CardMass client (ID: da8ad396-5bb2-41ea-8404-3c4203cd8c0d)
   # Add these redirect URIs:
   #   - http://localhost:3000/api/auth/sso/callback
   #   - http://localhost:3000/api/auth/callback
   #   - http://localhost:6000/api/auth/sso/callback
   #   - http://localhost:6000/api/auth/callback
   #   - https://cardmass.doneisbetter.com/api/auth/sso/callback
   #   - https://cardmass.doneisbetter.com/api/auth/callback
   
   # Option 2: Via Script (if you have MongoDB access)
   cd /Users/moldovancsaba/Projects/sso
   node scripts/fix-cardmass-redirects.mjs
   ```

2. **Verify User Permissions:**
   - Go to SSO admin: https://sso.doneisbetter.com/admin
   - Find user: moldovancsaba@gmail.com
   - Check CardMass app permissions
   - Ensure status is `'active'` or `'approved'` and role is `'user'`, `'admin'`, or `'owner'`

3. **Test SSO Login:**
   - Try logging in again
   - Check server logs for detailed error messages
   - Run diagnostic: `node scripts/diagnose-sso-issue.mjs`

## Diagnostic Tools

### Run Diagnostics
```bash
# Check SSO configuration
node scripts/diagnose-sso-issue.mjs

# Get fix instructions
node scripts/fix-sso-redirect-uri.mjs

# Update redirect URIs via API (requires admin credentials)
node scripts/update-sso-redirect-uris.mjs <email> <password>
```

## Testing Checklist

- [ ] Redirect URIs are registered in SSO
- [ ] User permissions are set correctly (status: 'active' or 'approved')
- [ ] Environment variables are set correctly
- [ ] SSO service is accessible
- [ ] Test login with moldovancsaba@gmail.com
- [ ] Check server logs for any errors

## Expected Behavior After Fix

1. User clicks "Login with SSO"
2. Redirected to SSO login page
3. User authenticates
4. SSO redirects back to cardmass callback
5. Cardmass exchanges code for tokens
6. Cardmass checks user permissions (now correctly handles 'active' status)
7. User is logged in and redirected to home page

## Notes

- The status mismatch was the primary issue - SSO uses `'active'` internally but the API may return either `'active'` or `'approved'`
- Redirect URI must EXACTLY match between `.env.local` and SSO client settings
- Enhanced error logging will help diagnose any remaining issues

