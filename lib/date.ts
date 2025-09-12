// Computes whole days difference between two ISO strings in UTC.
export function daysBetweenUtc(fromIso: string, toIso?: string): number {
  const from = new Date(fromIso).getTime()
  const to = toIso ? new Date(toIso).getTime() : Date.now()
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((to - from) / msPerDay)
}

// Computes whole hours difference between two ISO strings in UTC.
export function hoursBetweenUtc(fromIso: string, toIso?: string): number {
  const from = new Date(fromIso).getTime()
  const to = toIso ? new Date(toIso).getTime() : Date.now()
  const msPerHour = 60 * 60 * 1000
  return Math.floor((to - from) / msPerHour)
}
