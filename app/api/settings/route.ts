import { NextResponse } from 'next/server'
import { defaultSettings } from '@/lib/settings-default'

// WHAT: Simple settings endpoint used by the client SettingsProvider.
// WHY: Avoids 404s on /api/settings and centralizes defaults server-side.
export async function GET() {
  return NextResponse.json(defaultSettings)
}
