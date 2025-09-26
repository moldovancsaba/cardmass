/**
 * FUNCTIONAL: UUID v4 validation
 * STRATEGIC: Single source of truth for UUID validation in routes and middleware
 */
export function isUUIDv4(str: unknown): str is string {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}