"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { fetchJSON } from '@/lib/client'

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

import { defaultSettings } from '@/lib/settings-default'

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
