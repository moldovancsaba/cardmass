"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { fetchJSON } from '@/lib/client'

type Settings = {
  id?: string
  colors: {
    age: { oldest: string; newest: string }
    rotten: { least: string; most: string }
    archive?: { oldest?: string; newest?: string }
    status?: { delegate?: string; decide?: string; do?: string; decline?: string }
    matrixAxis?: { important?: string; not_important?: string; urgent?: string; not_urgent?: string }
    businessBadges?: {
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
    textContrast?: {
      status?: { delegate?: boolean; decide?: boolean; do?: boolean; decline?: boolean }
      matrixAxis?: { important?: boolean; not_important?: boolean; urgent?: boolean; not_urgent?: boolean }
      businessBadges?: {
        key_partners?: boolean
        key_activities?: boolean
        key_resources?: boolean
        value_propositions?: boolean
        customer_relationships?: boolean
        channels?: boolean
        customer_segments?: boolean
        cost_structure?: boolean
        revenue_streams?: boolean
      }
      ranges?: { age?: boolean; rotten?: boolean; archive?: boolean }
    }
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
    status: { delegate: '#93c5fd', decide: '#fde68a', do: '#86efac', decline: '#fca5a5' },
    matrixAxis: { important: '#93c5fd', not_important: '#bfdbfe', urgent: '#fca5a5', not_urgent: '#fecaca' },
    businessBadges: {
      key_partners: '#e5e7eb', key_activities: '#e5e7eb', key_resources: '#e5e7eb', value_propositions: '#e5e7eb',
      customer_relationships: '#e5e7eb', channels: '#e5e7eb', customer_segments: '#e5e7eb', cost_structure: '#e5e7eb', revenue_streams: '#e5e7eb'
    }
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
