# LEARNINGS

Version: v3.1.0

Updated: 2025-09-20T15:45:39.720Z

- Design decision: Per-board placements (boardAreas) replace legacy global areaLabel.
  Why: Enables N-dimensional classification; each board represents a dimension.
- Constraint: Never persist 'spock'; it is an implicit inbox per board for unplaced cards.
- UI choice: Hashtags are derived from other boards’ placements and are not a separate persisted field.
- Migration: Provide a one-off script to clear legacy 'spock' areaLabel values.
- Performance note: GET /api/cards returns all cards. If data grows large, introduce server-side pagination and incremental client fetch.
