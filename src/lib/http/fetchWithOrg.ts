import { ORG_HEADER } from '@/lib/http/headers'
import { fetchJSON } from '@/lib/client'

/**
 * FUNCTIONAL: Wrapper to inject organization UUID header into API calls
 * STRATEGIC: Ensures all org-scoped fetches consistently include X-Organization-UUID
 */
export async function fetchWithOrg<T>(url: string, orgUUID: string, init?: RequestInit): Promise<T> {
  const headers = {
    ...(init?.headers || {}),
    [ORG_HEADER]: orgUUID,
  } as Record<string, string>;
  return fetchJSON<T>(url, { ...init, headers });
}