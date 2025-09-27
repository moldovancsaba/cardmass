import crypto from 'crypto'

// WHAT: Compute a deterministic UUID (v4-shaped) for a hashtag tuple within an org.
// WHY: Allows shareable, non-enumerable links for hashtag pages without storing separate documents.
export function computeHashtagUUID(orgUUID: string, boardKey: string, label: string): string {
  const input = `${orgUUID}::${boardKey}::${label.toLowerCase()}`
  const hash = crypto.createHash('sha256').update(input).digest()
  const bytes = Buffer.from(hash.subarray(0, 16))
  // Set version 4 (0100)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  // Set variant (10xx)
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  // Format as UUID string
  const hex = bytes.toString('hex')
  return `${hex.substring(0,8)}-${hex.substring(8,12)}-${hex.substring(12,16)}-${hex.substring(16,20)}-${hex.substring(20)}`
}