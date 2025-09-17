# TASKLIST (Active / Upcoming)

- Title: Proof 3x3 layout and cross-layout mapping
  Owner: moldovan
  Expected Delivery: 2025-09-17T12:30:00.000Z
  Details:
    - Rebuild /proof as 3x3: Row1 [#Persona,#Proposal,#Outcome], Row2 [#Benefit,#decide,#Decline], Row3 [#Journey,#Validation,#Cost]
    - Map /business #Cost → /proof #Cost and /matrix/#decide → /proof #decide
    - Default new/unmapped cards to Backlog until moved
    - Hide #decline from /business (show only in /matrix and /proof)

- Title: /proof DnD behavior parity & ordering robustness
  Owner: moldovan
  Expected Delivery: 2025-09-17T12:45:00.000Z
  Details:
    - Reuse Board.CardItem hover/insert logic for identical behavior
    - Ensure proofOrder computation never yields NaN; coerce and average neighbors
    - Confirm XL diamond and stacked mobile layouts allow reorder and cross-bucket moves
    - Keep cross-layout mapping and Backlog intake intact
