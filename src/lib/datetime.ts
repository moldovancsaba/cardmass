/**
 * FUNCTIONAL: Produces ISO 8601 with milliseconds in UTC
 * STRATEGIC: Enforces global timestamp rule across the codebase
 */
export function isoNow(): string {
  return new Date().toISOString();
}