/**
 * FUNCTIONAL: UUID v4 generator
 * STRATEGIC: Prefer built-in crypto.randomUUID (Node 18+/modern browsers). Provide a tiny fallback if unavailable.
 */
export function uuidV4(): string {
  const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
  if (g?.crypto?.randomUUID && typeof g.crypto.randomUUID === 'function') {
    return g.crypto.randomUUID();
  }
  // Fallback: RFC4122 v4-ish using Math.random (non-crypto). Only used if crypto API missing.
  // Explanation: We keep a tiny fallback to avoid extra deps. In production Node 18+/browsers, crypto.randomUUID exists.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}