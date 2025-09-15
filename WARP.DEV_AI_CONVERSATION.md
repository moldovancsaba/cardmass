We will log planning and delivery decisions here during Warp AI sessions.

- 2025-09-12T07:59:06.000Z — Planned full scaffold, DB, CRUD API, and 3-column UI with backlog composer.
- 2025-09-13T00:00:00.000Z — Plan: Normalize kanban/matrix layout to prevent BottomBar overflow; wrap pages in full-height flex containers and set Board root to md:h-full. Update ROADMAP and TASKLIST accordingly.
- 2025-09-13T17:03:56.586Z — Major update v2.0.0: Centralized BottomBar across pages; xl-only no-scroll wrappers; matrix 2x2 grid now fits above BottomBar with internal scrolling per quadrant.
- 2025-09-13T17:25:27.000Z — Plan confirmed: native HTML5 DnD (no deps), introduce 'decline' status (Matrix-only), persistent 'order' for reordering; minimal visual cues; keep status select. Update ROADMAP/TASKLIST.
- 2025-09-13T17:28:00.000Z — Implemented model+API: Card adds order and decline; GET sorts by {order, updatedAt}; POST inserts at top (min-1); PATCH accepts {status, order} and top-inserts on status-only changes.
- 2025-09-13T17:29:00.000Z — Implemented UI: Board/CardItem native DnD with guarded editing; container highlight; compute neighbor-averaged order. Matrix shows decline; Kanban hides decline.
- 2025-09-13T17:29:30.000Z — Archive includes decline; migration script added (scripts/migrate-add-order.mjs); README/ARCHITECTURE updated.
- 2025-09-15T12:23:56.000Z — Plan: Add colored timing chips on single-card page using global normalization and settings-based gradients; introduce admin-configurable hashtag background colors for kanban/matrix statuses and business buckets; remove Business Canvas Titles section from admin; change “open” to same-window navigation; update ROADMAP and TASKLIST accordingly.
