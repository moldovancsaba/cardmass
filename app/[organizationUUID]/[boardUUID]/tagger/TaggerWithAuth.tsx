'use client'

import PasswordGate from '@/components/PasswordGate'
import TaggerApp, { type Area } from './TaggerApp'

/**
 * FUNCTIONAL: Wrapper component that integrates PasswordGate with TaggerApp
 * STRATEGIC: Provides auth layer without modifying TaggerApp's existing logic
 * WHY: Clean separation of concerns — auth gate vs. board UI
 */

interface TaggerWithAuthProps {
  orgUUID: string
  boardUUID: string
  rows: number
  cols: number
  areas: Area[]
}

export default function TaggerWithAuth({
  orgUUID,
  boardUUID,
  rows,
  cols,
  areas,
}: TaggerWithAuthProps) {
  return (
    <PasswordGate pageId={boardUUID} pageType="tagger" organizationUUID={orgUUID}>
      {({ getAuthHeaders }) => (
        <TaggerApp
          orgUUID={orgUUID}
          boardUUID={boardUUID}
          rows={rows}
          cols={cols}
          areas={areas}
          getAuthHeaders={getAuthHeaders}
        />
      )}
    </PasswordGate>
  )
}
