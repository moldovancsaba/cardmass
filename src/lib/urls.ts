// WHAT: Centralized URL helpers for app routes.
// WHY: Avoids ad-hoc string building and makes future navigation behavior changes trivial.

export function getCardUrl(orgUUID: string, cardUUID: string): string {
  return `/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(cardUUID)}`
}
