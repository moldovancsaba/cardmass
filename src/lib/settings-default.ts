export type Settings = {
  colors: {
    age: { oldest: string; newest: string }
    rotten: { least: string; most: string }
    status?: { delegate?: string; decide?: string; do?: string; decline?: string }
    matrixAxis?: { important?: string; not_important?: string; urgent?: string; not_urgent?: string }
    businessBadges?: Record<string, string>
    labels?: { archive?: string }
    textContrast?: {
      status?: Record<string, boolean>
      matrixAxis?: Record<string, boolean>
      businessBadges?: Record<string, boolean>
      labels?: { archive?: boolean }
      ranges?: { age?: boolean; rotten?: boolean; archive?: boolean }
    }
  }
}

// WHAT: Shared default settings that are safe to import from both server (API routes) and client (providers).
// WHY: Avoid importing a "use client" module in server code while keeping a single source of truth.
export const defaultSettings: Settings = {
  colors: {
    age: { oldest: '#0a3d91', newest: '#9ecbff' },
    rotten: { least: '#2ecc71', most: '#8e5b3a' },
    status: { delegate: '#93c5fd', decide: '#fde68a', do: '#86efac', decline: '#fca5a5' },
    matrixAxis: { important: '#93c5fd', not_important: '#bfdbfe', urgent: '#fca5a5', not_urgent: '#fecaca' },
    businessBadges: {},
    labels: { archive: '#e5e7eb' },
    textContrast: {
      status: { delegate: true, decide: true, do: true, decline: true },
      matrixAxis: { important: true, not_important: true, urgent: true, not_urgent: true },
      businessBadges: {},
      labels: { archive: true },
      ranges: { age: true, rotten: true, archive: true },
    }
  }
}
