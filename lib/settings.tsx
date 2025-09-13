"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { fetchJSON } from '@/lib/client'

type Settings = {
  id?: string
  colors: {
    age: { oldest: string; newest: string }
    rotten: { least: string; most: string }
    archive?: { oldest?: string; newest?: string }
  }
  business?: {
    key_partners?: string
    key_activities?: string
    key_resources?: string
    value_propositions?: string
    customer_relationships?: string
    channels?: string
    customer_segments?: string
    cost_structure?: string
    revenue_streams?: string
  }
}

const defaultSettings: Settings = {
  colors: {
    age: { oldest: '#0a3d91', newest: '#9ecbff' },
    rotten: { least: '#2ecc71', most: '#8e5b3a' },
  },
  business: {
    key_partners: 'Key Partners',
    key_activities: 'Key Activities',
    key_resources: 'Key Resources',
    value_propositions: 'Value Propositions',
    customer_relationships: 'Customer Relationships',
    channels: 'Channels',
    customer_segments: 'Customer Segments',
    cost_structure: 'Cost Structure',
    revenue_streams: 'Revenue Streams',
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
