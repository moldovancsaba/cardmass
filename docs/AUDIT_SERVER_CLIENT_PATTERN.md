# Server/Client Component Pattern Audit

**Date**: 2025-10-06T21:30:00.000Z  
**Version**: 1.2.1  
**Auditor**: AI Agent  
**Standard**: "Server components authenticate, client components hydrate"

---

## Executive Summary

Comprehensive audit of all page components to verify compliance with the mandatory server/client separation pattern documented in `SERVER_CLIENT_PATTERNS.md`.

### Results Overview

| Status | Count | Pages |
|--------|-------|-------|
| ✅ **COMPLIANT** | 3 | `/`, `/organizations`, `/admin/dashboard`, `/{org}/settings` |
| ⚠️ **VIOLATIONS** | 6 | See detailed findings below |
| 🔍 **NEEDS REVIEW** | 0 | - |

**Critical Issues Found**: 6 pages violating the pattern  
**Security Issues**: 2 pages with missing authentication  
**Risk Level**: HIGH (potential for 404 bugs like settings page)

---

## Detailed Findings

### ✅ COMPLIANT PAGES

#### 1. `app/page.tsx` - Root Login Page
- **Pattern**: Server component (auth only) ✅
- **Status**: COMPLIANT
- **Details**: 
  - Lines 14-24: Authentication check with `validateAdminToken`
  - Redirects to `/organizations` if authenticated
  - Renders `<UniversalLoginPage>` client component if not authenticated
  - No data fetching, no notFound() after redirect

#### 2. `app/organizations/page.tsx` - Organization Selector
- **Pattern**: Client component (data fetching) ✅
- **Status**: COMPLIANT
- **Details**:
  - Marked with `'use client'`
  - Lines 33-78: All data fetching in useEffect
  - Lines 89-111: Proper loading/error state handling
  - Auth check via API call (line 37)

#### 3. `app/admin/dashboard/page.tsx` - Admin Dashboard
- **Pattern**: Client component (data fetching) ✅
- **Status**: COMPLIANT
- **Details**:
  - Marked with `'use client'`
  - Lines 29-47: Auth check in useEffect
  - Lines 49-80: Data loading functions
  - Lines 91-101: Proper loading/error states

#### 4. `app/[organizationUUID]/settings/page.tsx` - Organization Settings
- **Pattern**: Server component (auth only) ✅
- **Status**: COMPLIANT (FIXED)
- **Details**:
  - Lines 15-36: Authentication and authorization checks only
  - Lines 44-48: Minimal board fetch (non-critical)
  - Lines 52-58: Passes minimal data to client component
  - **NOTE**: This was previously BROKEN and caused 404 bugs (see commit c807847)

---

### ⚠️ VIOLATIONS

#### 5. `app/[organizationUUID]/page.tsx` - Organization Main Page
- **Pattern**: Server component with data fetching ❌
- **Status**: **VIOLATION**
- **Risk Level**: MEDIUM
- **Issues**:
  - Lines 54-58: Fetches org data in server component
    ```typescript
    const res = await fetch(`${base}/api/v1/organizations/${org}`, { cache: 'no-store' })
    if (res.ok) orgData = await res.json()
    ```
  - Lines 59-61: Fetches boards data
  - No error handling beyond empty catch blocks
  - Same pattern that caused settings page 404 bug
  
- **Recommendation**: 
  - Keep auth checks (lines 19-37) ✅
  - Remove server-side data fetching
  - Pass only `org` UUID to client component
  - Let `<OrgBoardList>` client component fetch all data

---

#### 6. `app/[organizationUUID]/cards/[cardUUID]/page.tsx` - Card Details Page
- **Pattern**: Server component with data fetching ❌
- **Status**: **VIOLATION**
- **Risk Level**: HIGH
- **Issues**:
  - **NO AUTHENTICATION CHECKS** 🚨
  - Lines 54-58: Fetches card data in server component
    ```typescript
    const card = await fetchCard(org, cardUUID)
    const areaMaps = await fetchBoardsAreaMap(org, boardIds)
    ```
  - Lines 12-18: `fetchCard` throws on error (could cause 500 errors)
  - Anyone with card UUID can view card data without auth
  
- **Recommendation**:
  1. **URGENT**: Add authentication checks:
     ```typescript
     const token = cookieStore.get('admin_session')?.value
     if (!token) redirect('/?redirect=/...')
     const user = await validateAdminToken(token)
     const orgRole = await checkOrgAccess(user._id.toString(), org)
     if (!orgRole) redirect('/organizations')
     ```
  2. Remove server-side data fetching
  3. Create `<CardDetailsClient>` component to fetch data
  4. Pass only `org` and `cardUUID` to client component

---

#### 7. `app/[organizationUUID]/hashtags/[hashtagUUID]/page.tsx` - Hashtag Details Page
- **Pattern**: Server component with data fetching ❌
- **Status**: **VIOLATION**
- **Risk Level**: HIGH
- **Issues**:
  - **NO AUTHENTICATION CHECKS** 🚨
  - Lines 49-56: Fetches hashtag and board data in server component
    ```typescript
    const tag = await fetchHashtag(org, hashtagUUID)
    const areaMaps = await fetchBoardsAreaMap(org, Array.from(set))
    ```
  - Lines 12-17: `fetchHashtag` throws on error
  - Anyone with hashtag UUID can view data without auth
  
- **Recommendation**:
  1. **URGENT**: Add authentication checks (same as card page)
  2. Remove server-side data fetching
  3. Create `<HashtagDetailsClient>` component
  4. Pass only `org` and `hashtagUUID` to client component

---

#### 8. `app/organization/[slug]/page.tsx` - Slug Redirect Page
- **Pattern**: Server component with data fetching ❌
- **Status**: **VIOLATION**
- **Risk Level**: MEDIUM
- **Issues**:
  - Lines 14-18: Fetches org by slug, throws on error
    ```typescript
    async function fetchOrgBySlug(slug: string) {
      const res = await fetch(`${base}/api/v1/organizations/slug/${slug}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())  // ❌ Throws
      return res.json()
    }
    ```
  - Line 25: Calls fetch, could cause 500 error
  - No authentication check before redirect
  
- **Recommendation**:
  1. Add try-catch with notFound() fallback:
     ```typescript
     try {
       const org = await fetchOrgBySlug(slug)
       redirect(`/${org.uuid}`)
     } catch {
       return notFound()
     }
     ```
  2. Consider if this page needs auth check before redirect

---

#### 9. `app/[organizationUUID]/[boardUUID]/tagger/page.tsx` - Tagger Page
- **Pattern**: Server component with data fetching ❌
- **Status**: **VIOLATION**
- **Risk Level**: MEDIUM
- **Issues**:
  - Lines 46-57: Fetches board details in server component
    ```typescript
    const data = await fetchWithOrg<BoardDetails>(`${base}/api/v1/.../boards/${boardId}`, org, { cache: 'no-store' })
    rows = Number(data?.rows) || 0
    cols = Number(data?.cols) || 0
    areas = Array.isArray(data?.areas) ? data.areas : []
    ```
  - Has auth check (lines 22-35) ✅ but still violates pattern
  - Empty catch block (line 57) - silent failures
  
- **Recommendation**:
  - Keep auth checks ✅
  - Remove server-side data fetching
  - Create `<TaggerClient>` component to fetch board data
  - Update `<TaggerWithAuth>` to handle data loading

---

#### 10. `app/[organizationUUID]/creator/page.tsx` - Creator Page
- **Pattern**: Server component with no auth ❌
- **Status**: **VIOLATION**
- **Risk Level**: HIGH
- **Issues**:
  - **NO AUTHENTICATION CHECKS** 🚨
  - **NO AUTHORIZATION CHECKS** 🚨
  - Anyone can access creator for any organization UUID
  - Only validates UUID format (line 12)
  
- **Recommendation**:
  1. **URGENT**: Add authentication and org access checks:
     ```typescript
     const cookieStore = await cookies()
     const token = cookieStore.get('admin_session')?.value
     if (!token) redirect(`/?redirect=/${org}/creator`)
     
     const user = await validateAdminToken(token)
     if (!user) redirect(`/?redirect=/${org}/creator`)
     
     const orgRole = await checkOrgAccess(user._id.toString(), org)
     if (!orgRole) redirect('/organizations')
     ```
  2. No data fetching issues (passes UUID to client component) ✅

---

## Security Summary

### Critical Security Issues

| Page | Issue | Impact |
|------|-------|--------|
| `cards/[cardUUID]/page.tsx` | No auth | Anyone can view card data |
| `hashtags/[hashtagUUID]/page.tsx` | No auth | Anyone can view hashtag data |
| `creator/page.tsx` | No auth | Anyone can create boards |

### Pattern Violations Summary

| Pattern Violation | Count | Pages |
|-------------------|-------|-------|
| Server component data fetching | 5 | org main, card, hashtag, slug, tagger |
| Missing auth checks | 3 | card, hashtag, creator |
| Throw on error (no graceful handling) | 2 | card, hashtag |

---

## Remediation Priority

### Priority 1: URGENT (Security)
1. ✅ **`creator/page.tsx`** - Add auth checks
2. ✅ **`cards/[cardUUID]/page.tsx`** - Add auth + move to client
3. ✅ **`hashtags/[hashtagUUID]/page.tsx`** - Add auth + move to client

### Priority 2: HIGH (404 Bug Risk)
4. ✅ **`[organizationUUID]/page.tsx`** - Move data fetching to client
5. ✅ **`organization/[slug]/page.tsx`** - Add error handling

### Priority 3: MEDIUM (Pattern Compliance)
6. ✅ **`[boardUUID]/tagger/page.tsx`** - Move data fetching to client

---

## Testing Requirements

After fixes, each page must be tested in:

- [ ] **Local development** (`npm run dev`)
- [ ] **Vercel preview** (`vercel`)
- [ ] **Vercel production** (`vercel --prod`)

Test scenarios:
- [ ] Authenticated user with org access
- [ ] Authenticated user WITHOUT org access
- [ ] Unauthenticated user
- [ ] Invalid UUID format
- [ ] Network/API failure scenarios

---

## Pattern Template

For future reference, here's the correct pattern:

```typescript
// ✅ GOOD: Server component (auth only)
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { validateAdminToken, checkOrgAccess } from '@/lib/auth'

export default async function MyPage({ params }) {
  const { organizationUUID: org } = await params
  
  // 1. Validate URL format FIRST
  if (!isUUIDv4(org)) return notFound()
  
  // 2. Check authentication
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  
  if (!token) {
    redirect(`/?redirect=/${org}/mypage`)
  }
  
  // 3. Validate token
  const user = await validateAdminToken(token)
  if (!user) {
    redirect(`/?redirect=/${org}/mypage`)
  }
  
  // 4. Check org access
  const orgRole = await checkOrgAccess(user._id.toString(), org)
  if (!orgRole) {
    redirect('/organizations')
  }
  
  // 5. Pass ONLY IDs to client component
  return (
    <main>
      <MyClientComponent orgId={org} userId={user._id.toString()} />
    </main>
  )
}
```

```typescript
// ✅ GOOD: Client component (data fetching)
'use client'

import { useState, useEffect } from 'react'

export default function MyClientComponent({ orgId, userId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await fetch(`/api/v1/organizations/${orgId}/data`)
        
        if (!res.ok) {
          throw new Error('Failed to load')
        }
        
        setData(await res.json())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [orgId])
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No data</div>
  
  return <div>{/* Render data */}</div>
}
```

---

## Enforcement

This audit report must be:
1. ✅ Reviewed by all team members
2. ✅ Violations fixed before next deployment
3. ✅ Documented in LEARNINGS.md
4. ✅ Referenced in code review checklist

**Pattern compliance is MANDATORY** to prevent production bugs.
