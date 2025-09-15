# ROADMAP

Only forward-looking development plans. Timestamps use ISO 8601 UTC with milliseconds.

- 2025-09-15 14:23 CET — Single-card page parity: add #Created and #rotten timing chips using global normalization and colors; admin-configurable hashtag colors for kanban/matrix statuses and business buckets; unify “open” to navigate in same window. Owner: moldovan. Dependencies: Settings model/API/UI, Board.tsx, app/card/[uuid]/page.tsx.

- 2025-09-12T07:59:06.000Z — Initialize project scaffolding (Next.js, TS, Tailwind), MongoDB integration, CRUD API, 3-column UI with backlog composer. Owner: moldovan. Dependencies: MongoDB URI available.
- 2025-09-12T07:59:06.000Z — Version automation and documentation baseline. Owner: moldovan. Dependencies: project scaffolded.
- 2025-09-13T00:00:00.000Z — Normalize kanban/matrix layout containers to ensure identical BottomBar position across all pages and prevent overflow on desktop (>=1200px). Owner: moldovan. Dependencies: /components/BottomBar.tsx, Board.tsx, /app/{kanban,matrix}/page.tsx.
