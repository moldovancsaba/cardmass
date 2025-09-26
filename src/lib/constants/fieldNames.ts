/**
 * FUNCTIONAL: Centralized field name constants for UUID-first, org-scoped data model
 * STRATEGIC: Prevents hardcoded strings, aligns with Narimato pattern (OrganizationUUID → organizationId, others → uuid)
 */

export const ORGANIZATION_ID_FIELD = 'organizationId' as const;
export const UUID_FIELD = 'uuid' as const;
export const BOARD_UUID_FIELD = 'uuid' as const;
export const CARD_UUID_FIELD = 'uuid' as const;

/**
 * Safe accessors to promote consistent field usage across the codebase.
 */
export function getOrganizationId<T extends Record<string, unknown>>(obj: T | null | undefined): string | undefined {
  return (obj?.[ORGANIZATION_ID_FIELD] as string) || undefined;
}

export function getUUID<T extends Record<string, unknown>>(obj: T | null | undefined): string | undefined {
  return (obj?.[UUID_FIELD] as string) || undefined;
}