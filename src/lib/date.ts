export function daysBetweenUtc(iso: string | Date): number {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const ms = Date.now() - d.getTime()
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)))
}
