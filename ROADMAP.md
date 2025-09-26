# ROADMAP

Version: 0.5.0

Updated: 2025-09-26T11:31:31.110Z

## Milestone (Q4 2025): UUID-first multi-tenant foundation
- Priority: High
- Dependencies:
  - Organizations collection and indexes
  - Org-scoped APIs with header enforcement
  - Hashed routes by UUID

### Items

0) Per-area label text color (Creator → Tagger)
   - Owner: ai
   - Expected: 2025-09-26T12:00:00.000Z
   - Notes: Remove Tagger global toggle; persist area.textBlack in Creator; apply text color to Tagger area labels and hashtags.
1) Complete data backfill to organizations
   - Owner: ai
   - Expected: 2025-09-24T12:00:00.000Z
   - Notes: Run migration to set uuid and organizationId on boards/cards.


3) Board placements by boardUUID (follow-up)
   - Owner: ai
   - Expected: 2025-10-15T12:00:00.000Z
   - Notes: Migrate boardAreas to be keyed by boardUUID; update API and UI.

4) Documentation automation
   - Owner: ai
   - Expected: 2025-10-05T12:00:00.000Z
   - Notes: Add scripts to sync version and timestamps across docs.
