# Server vs Client Component Patterns

**Version**: 1.2.1  
**Updated**: 2025-10-06T19:59:00.000Z

## Critical Rules to Prevent 404 Bugs

### ❌ NEVER DO THIS

```typescript
// ❌ BAD: Server component with API fetch + notFound()
export default async function MyPage() {
  // Auth check
  if (!token) redirect('/login')
  
  // API fetch
  const res = await fetch('/api/data')
  const data = await res.json()
  
  // ❌ FATAL: Calling notFound() after redirect() causes race condition
  if (!data) return notFound()
  
  return <div>{data.name}</div>
}
```

**Why this breaks:**
- React Server Components can send BOTH `redirect()` and `notFound()` in the same response stream
- The 404 HTML is embedded in the response body
- The 307 redirect is in the headers
- Browsers/clients see the 404 content even though headers say redirect
- Result: "This page could not be found" even though page exists

---

## ✅ CORRECT PATTERNS

### Pattern 1: Server Component (Authentication Only)

**Use for:** Protected pages that need auth checks before rendering

```typescript
// ✅ GOOD: Server component handles ONLY authentication
export default async function MyPage({ params }: Props) {
  const { id } = await params
  
  // Validate ID format
  if (!isValidUUID(id)) return notFound()
  
  // Auth check - redirect if unauthorized
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  
  if (!token) {
    redirect(`/login?redirect=/my-page/${id}`)
  }
  
  const user = await validateToken(token)
  if (!user) {
    redirect(`/login?redirect=/my-page/${id}`)
  }
  
  // Check permissions - redirect if insufficient
  const hasAccess = await checkAccess(user.id, id)
  if (!hasAccess) {
    redirect('/unauthorized')
  }
  
  // ✅ Pass minimal data to client component
  // Let client component fetch full data
  return (
    <div>
      <h1>My Page</h1>
      <MyClientComponent userId={user.id} resourceId={id} />
    </div>
  )
}
```

**Rules:**
1. ✅ DO validate URL parameters with `notFound()` BEFORE any auth checks
2. ✅ DO use `redirect()` for auth failures
3. ✅ DO pass only IDs/minimal data to client components
4. ❌ NEVER fetch full data from APIs in server components
5. ❌ NEVER call `notFound()` after `redirect()`

---

### Pattern 2: Client Component (Data Fetching)

**Use for:** Fetching and displaying data with loading/error states

```typescript
// ✅ GOOD: Client component handles data fetching
'use client'

import { useState, useEffect } from 'react'

export default function MyClientComponent({ 
  userId, 
  resourceId 
}: { 
  userId: string
  resourceId: string 
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await fetch(`/api/resources/${resourceId}`)
        
        if (!res.ok) {
          throw new Error('Failed to load data')
        }
        
        const result = await res.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [resourceId])
  
  // ✅ Handle all states gracefully
  if (loading) {
    return <div>Loading...</div>
  }
  
  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }
  
  if (!data) {
    return <div>No data available</div>
  }
  
  return (
    <div>
      <h2>{data.name}</h2>
      <p>{data.description}</p>
    </div>
  )
}
```

**Rules:**
1. ✅ DO use `useState` for data, loading, and error states
2. ✅ DO handle all three states: loading, error, success
3. ✅ DO provide retry mechanisms for errors
4. ✅ DO show meaningful loading indicators
5. ❌ NEVER assume fetch will succeed
6. ❌ NEVER render without checking loading/error states

---

## Testing Checklist

Before deploying any protected page, test in ALL three environments:

### ✅ Local Development
```bash
npm run dev
# Test at http://localhost:4000
```

### ✅ Vercel Preview
```bash
vercel
# Test at preview URL
```

### ✅ Vercel Production
```bash
vercel --prod
# Test at production domain
```

**Why all three?**
- Local: Uses `localhost:4000` for API calls
- Preview: Uses `VERCEL_URL` environment variable
- Production: Uses custom domain, different CDN behavior

Each environment has different:
- Base URLs for API calls
- Cookie domains
- CDN caching behavior
- Environment variables

---

## Common Mistakes

### ❌ Mistake 1: Server-side API fetch without error handling
```typescript
// ❌ BAD
const res = await fetch('/api/data')
const data = await res.json()
if (!data) return notFound() // Fails silently on Vercel
```

### ✅ Fix: Don't fetch in server component
```typescript
// ✅ GOOD
return <ClientComponent /> // Let client fetch with error handling
```

---

### ❌ Mistake 2: Calling both redirect() and notFound()
```typescript
// ❌ BAD
if (!token) redirect('/login')
if (!data) return notFound() // Race condition!
```

### ✅ Fix: Only use redirect() in server components
```typescript
// ✅ GOOD
if (!token) redirect('/login')
// Never call notFound() after authentication
return <ClientComponent /> // Client handles missing data
```

---

### ❌ Mistake 3: No loading states in client components
```typescript
// ❌ BAD
const [data, setData] = useState(null)
return <div>{data.name}</div> // Crashes if data is null
```

### ✅ Fix: Always handle loading state
```typescript
// ✅ GOOD
if (loading) return <div>Loading...</div>
if (error) return <div>Error: {error}</div>
if (!data) return <div>No data</div>
return <div>{data.name}</div>
```

---

## Summary

| Concern | Server Component | Client Component |
|---------|------------------|------------------|
| **Auth checks** | ✅ YES | ❌ NO |
| **Redirects** | ✅ YES | ❌ NO (use router.push) |
| **API fetches** | ❌ NO | ✅ YES |
| **Loading states** | ❌ NO | ✅ YES |
| **Error handling** | ❌ NO | ✅ YES |
| **notFound()** | ⚠️ Only before auth | ❌ NO |

**Golden Rule**: Server components authenticate, client components hydrate.

---

## Real-World Example: Settings Page

### ❌ Before (Broken)
```typescript
// Server component - BROKEN
export default async function SettingsPage({ params }) {
  if (!token) redirect('/login')
  
  const res = await fetch('/api/org') // Fails on Vercel
  const org = await res.json()
  
  if (!org) return notFound() // ❌ Race condition with redirect!
  
  return <SettingsTabs org={org} />
}
```

### ✅ After (Fixed)
```typescript
// Server component - FIXED
export default async function SettingsPage({ params }) {
  if (!token) redirect('/login')
  
  // ✅ Pass minimal data, let client fetch rest
  return <SettingsTabs orgId={params.id} />
}

// Client component
'use client'
function SettingsTabs({ orgId }) {
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch(`/api/org/${orgId}`)
      .then(res => res.json())
      .then(setOrg)
      .finally(() => setLoading(false))
  }, [orgId])
  
  if (loading) return <div>Loading...</div>
  
  return <div>{org.name}</div>
}
```

---

## Enforcement

This pattern is **MANDATORY** for all protected pages. Code review checklist:

- [ ] Server component only handles authentication
- [ ] No API fetches in server components
- [ ] No `notFound()` calls after `redirect()`
- [ ] Client components have loading/error states
- [ ] Tested in local + Vercel preview + production

**Violation of these rules causes production 404 bugs that are extremely hard to debug.**
