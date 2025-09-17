# ROADMAP

Only forward-looking development plans. Timestamps use ISO 8601 UTC with milliseconds.

- 2025-09-17T12:02:23.000Z — Ensure /proof DnD parity with /matrix by reusing Board DnD patterns; robust proofOrder insertion; maintain Backlog intake and cross-layout mapping. Compile and request manual verification on dev. Owner: moldovan. Dependencies: components/Board.tsx, app/proof/page.tsx, app/api/cards/*, models/Card.ts.

- 2025-09-17T11:38:03.355Z — Proof layout: rebuild as 3x3 grid extended from matrix. Rows: [#Persona,#Proposal,#Outcome] / [#Benefit,#decide,#Decline] / [#Journey,#Validation,#Cost]. Cross-layout sync: business #Cost ↔ proof #Cost; matrix status #decide ↔ proof #decide; status #decline visible only on /matrix and /proof (hidden on /business). Backlog: default landing for unmatched/new cards until moved. Owner: moldovan. Dependencies: components/Board.tsx, app/proof/page.tsx, app/api/cards/*, models/Card.ts, models/Settings.ts, app/admin/page.tsx.

- 2025-09-15T14:23:00.000Z — Single-card page parity: add #Created and #rotten timing chips using global normalization and colors; admin-configurable hashtag colors for kanban/matrix statuses and business buckets; unify “open” to navigate in same window. Owner: moldovan. Dependencies: Settings model/API/UI, Board.tsx, app/card/[uuid]/page.tsx.

- 2025-09-12T07:59:06.000Z — Initialize project scaffolding (Next.js, TS, Tailwind), MongoDB integration, CRUD API, 3-column UI with backlog composer. Owner: moldovan. Dependencies: MongoDB URI available.
- 2025-09-12T07:59:06.000Z — Version automation and documentation baseline. Owner: moldovan. Dependencies: project scaffolded.
- 2025-09-13T00:00:00.000Z — Normalize kanban/matrix layout containers to ensure identical BottomBar position across all pages and prevent overflow on desktop (>=1200px). Owner: moldovan. Dependencies: /components/BottomBar.tsx, Board.tsx, /app/{kanban,matrix}/page.tsx.
