"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { fetchJSON } from '@/lib/client'

type Settings = {
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

const defaultSettings: Settings = {
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

const SettingsContext = createContext<Settings>(defaultSettings)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  useEffect(() => {
    let cancelled = false
    fetchJSON<Settings>('/api/settings')
      .then((s) => { if (!cancelled) setSettings(s) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
