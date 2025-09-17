
## [v3.0.2] — 2025-09-17T12:35:01.048Z
- (update notes here)

## [v3.0.1] — 2025-09-17T11:52:44.369Z
- (update notes here)

## [v3.0.0] — 2025-09-17T11:38:03.355Z
- Major: Rebuilt /proof as a 3x3 grid extended from matrix
  - Rows: [#Persona,#Proposal,#Outcome] / [#Benefit,#decide,#Decline] / [#Journey,#Validation,#Cost]
  - DnD parity with /matrix and /kanban (neighbor-averaging order, per-item insertion)
- Cross-layout rules
  - /business #Cost appears in /proof #Cost (color/contrast reused from business)
  - /matrix #decide appears in /proof #decide
  - #decline is hidden from /business and remains visible on /matrix and /proof only
  - New/unmatched cards default to Backlog until moved
- API/Model
  - Card: added proof buckets 'decide' and 'decline'; ensured index {proof, proofOrder}
  - /api/cards: proof filter includes decide/decline; POST defaults proof to Backlog (or Cost when business=Cost); PATCH syncs proof with status/business rules
  - /api/cards/[id]: awaited params to comply with Next.js 15 Dynamic APIs
- Admin/Settings
  - Proof color group excludes Cost (Cost uses business cost color); added coverage for new proof buckets where applicable

## [v2.10.22] — 2025-09-17T10:38:23.079Z
- (update notes here)

## [v2.10.21] — 2025-09-16T19:36:14.602Z
- (update notes here)

## [v2.10.20] — 2025-09-16T19:26:19.295Z
- (update notes here)

## [v2.10.19] — 2025-09-16T18:56:43.301Z
- (update notes here)

## [v2.10.18] — 2025-09-16T18:16:22.909Z
- Feature: New /proof layout with eight droppable containers (Persona, Proposal, Outcome, Benefit, Backlog, Journey, Validation, Cost)
- Data: Added proof and proofOrder fields to Card model with index { proof, proofOrder }
- API: /api/cards supports ?proof=… filter (incl. Backlog), proof-based ordering; POST accepts proof and defaults to Backlog; PATCH id supports proof/proofOrder
- Settings: Added colors.proof (no cost, uses business cost color) and colors.textContrast.proof; client defaults wired; admin UI supports proof colors including Backlog
- UI: Proof diamond layout on xl screens; stacked on smaller; BottomBar includes a “proof” nav button option

## [v2.10.17] — 2025-09-16T17:24:09.549Z
- (update notes here)

## [v2.10.16] — 2025-09-16T17:15:26.492Z
- (update notes here)

## [v2.10.15] — 2025-09-16T13:52:50.909Z
- (update notes here)

## [v2.10.14] — 2025-09-16T13:46:40.769Z
- (update notes here)

## [v2.10.13] — 2025-09-16T13:17:39.447Z
- (update notes here)

## [v2.10.12] — 2025-09-16T12:48:38.991Z
- (update notes here)

## [v2.10.11] — 2025-09-16T12:45:28.409Z
- (update notes here)

## [v2.10.10] — 2025-09-16T12:12:54.423Z
- (update notes here)

## [v2.10.9] — 2025-09-16T11:57:12.165Z
- (update notes here)

## [v2.10.8] — 2025-09-16T11:34:52.888Z
- (update notes here)

## [v2.10.7] — 2025-09-16T11:16:17.851Z
- (update notes here)

## [v2.10.6] — 2025-09-16T11:10:47.184Z
- (update notes here)

## [v2.10.5] — 2025-09-16T10:46:46.122Z
- (update notes here)

## [v2.10.4] — 2025-09-16T10:30:50.105Z
- (update notes here)

## [v2.10.3] — 2025-09-16T09:38:47.433Z
- (update notes here)

## [v2.10.2] — 2025-09-16T09:25:42.815Z
- (update notes here)

## [v2.10.1] — 2025-09-16T09:06:49.488Z
- (update notes here)

## [v2.10.0] — 2025-09-15T12:47:23.695Z
- (update notes here)

## [v2.9.0] — 2025-09-14T18:37:12.162Z
- (update notes here)

## [v2.8.0] — 2025-09-14T18:16:36.320Z
- (update notes here)

## [v2.7.0] — 2025-09-14T18:02:47.759Z
- (update notes here)

## [v2.6.0] — 2025-09-14T08:59:42.082Z
- (update notes here)

## [v2.5.0] — 2025-09-14T08:52:28.385Z
- (update notes here)

## [v2.4.0] — 2025-09-14T08:46:06.246Z
- (update notes here)

## [v2.3.0] — 2025-09-13T21:07:56.569Z
- (update notes here)

## [v2.2.0] — 2025-09-13T17:57:54.565Z
- (update notes here)

## [v2.2.0] — 2025-09-13T17:57:54.528Z
- (update notes here)

## [v2.1.0] — 2025-09-13T17:12:28.362Z
- UI: Remove all “(X hours)” suffixes from time labels — now display days only for old/rotten/archived badges

## [v2.0.0] — 2025-09-13T17:03:56.586Z
- Major: Centralized BottomBar as a shared communication/navigation bar across all pages (kanban, matrix, archive, admin)
- Layout: Adopt xl-only (>=1280px) no-scroll wrappers; internal panes (columns/rectangles) scroll
- Matrix: 2x2 grid now perfectly fits available height above BottomBar; each quadrant scrolls internally
- Consistency: Unified navigation handling with router.push; standardized vertical spacing
- Docs: Updated ROADMAP/TASKLIST/WARP logs and synced version strings

## [v1.28.0] — 2025-09-13T16:37:11.433Z
- Layout: Constrain kanban/matrix no-scroll wrappers to xl (>=1280px) to align with global >=1200px rule
- Fix: Normalize Board/page wrappers to keep BottomBar aligned across all pages without overflow

## [v1.27.0] — 2025-09-13T16:13:24.166Z
- Desktop (>=1200px): hard disable page scroll (overflow hidden) at page level
- Internal panes (matrix rectangles) remain scrollable


## [v1.27.0] — 2025-09-13T16:13:24.098Z
- (update notes here)

## [v1.26.0] — 2025-09-13T16:10:34.215Z
- Admin: wrapped in themed rectangle like archive; BottomBar active nav + disabled input


## [v1.26.0] — 2025-09-13T16:10:34.147Z
- (update notes here)

## [v1.25.0] — 2025-09-13T13:02:00.644Z
- Landscape: page scroll disabled; only internal rectangles/columns scroll (matrix)


## [v1.25.0] — 2025-09-13T13:02:00.571Z
- (update notes here)

## [v1.24.0] — 2025-09-13T12:52:02.358Z
- Desktop: page scroll enabled; internal columns/rectangles scroll; matrix rectangles constrained (min-h-0)


## [v1.24.0] — 2025-09-13T12:52:02.289Z
- (update notes here)

## [v1.23.0] — 2025-09-13T12:48:50.600Z
- Matrix: 2x2 grid now fills remaining height above BottomBar; no overlap
- Layout: page uses flex column; BottomBar is non-sticky and shrink-0


## [v1.23.0] — 2025-09-13T12:48:50.531Z
- (update notes here)

## [v1.22.0] — 2025-09-13T12:39:29.734Z
- Status rename: roadmap/backlog/todo → delegate/decide/do across UI/API/DB
- Default new cards: decide


## [v1.22.0] — 2025-09-13T12:39:29.667Z
- (update notes here)

## [v1.21.0] — 2025-09-13T12:32:20.819Z
- Settings: added archive color scale (oldest→newest) configurable in /admin
- Archive: badges use interpolated archive colors


## [v1.21.0] — 2025-09-13T12:32:20.750Z
- (update notes here)

## [v1.20.0] — 2025-09-13T12:26:49.806Z
- BottomBar: active nav buttons on /archive (kanban/matrix) and /admin (kanban/matrix/archive)
- Input remains disabled on admin & archive


## [v1.20.0] — 2025-09-13T12:26:49.739Z
- (update notes here)

## [v1.19.0] — 2025-09-13T12:21:27.660Z
- BottomBar: reused on admin and archive as disabled for identical layout, position, size


## [v1.19.0] — 2025-09-13T12:21:27.583Z
- (update notes here)

## [v1.18.0] — 2025-09-13T12:16:39.485Z
- BottomBar: unified input+buttons rectangle across pages; disabled on admin/archive
- Cleanup: removed unused composer


## [v1.18.0] — 2025-09-13T12:16:39.417Z
- (update notes here)

## [v1.17.0] — 2025-09-13T12:11:20.895Z
- Matrix: equal 2x2 grid; increased padding for visible axis labels; labels outside rectangles


## [v1.17.0] — 2025-09-13T12:11:20.829Z
- (update notes here)

## [v1.16.0] — 2025-09-13T12:05:38.845Z
- Matrix: axis labels (Urgent/Not-Urgent, Important/Not Important) positioned outside rectangles
- Unified bottom bar spacing across pages


## [v1.16.0] — 2025-09-13T12:05:38.774Z
- (update notes here)

## [v1.15.0] — 2025-09-13T12:00:58.536Z
- Layout: on md+ screens, outer layout is fixed to viewport; inner columns/rectangles scroll
- Mobile remains unchanged


## [v1.15.0] — 2025-09-13T12:00:58.471Z
- (update notes here)

## [v1.14.0] — 2025-09-13T11:56:52.001Z
- Archive: wrapped cards in a single rectangle with #archive title to match layout theme


## [v1.14.0] — 2025-09-13T11:56:51.920Z
- (update notes here)

## [v1.13.0] — 2025-09-13T11:53:22.596Z
- UX: hide (0 hours) in time hashtags across board and archive


## [v1.13.0] — 2025-09-13T11:53:22.495Z
- (update notes here)

## [v1.12.0] — 2025-09-13T11:50:39.145Z
- Admin: added sticky layout nav buttons (kanban/matrix/archive)


## [v1.12.0] — 2025-09-13T11:50:39.076Z
- (update notes here)

## [v1.11.0] — 2025-09-13T11:47:53.328Z
- Fix: archive button now PATCHes with correct id param; nav buttons added to /archive


## [v1.11.0] — 2025-09-13T11:47:53.262Z
- (update notes here)

## [v1.10.0] — 2025-09-13T11:43:47.371Z
- Chore: remove admin useEffect dependency warnings by inlining defaults


## [v1.10.0] — 2025-09-13T11:43:47.305Z
- (update notes here)

## [v1.9.0] — 2025-09-13T11:40:43.953Z
- Fix: archive button wired to PATCH; bottom archive nav button added
- API: /api/cards supports archived filter


## [v1.9.0] — 2025-09-13T11:40:43.887Z
- (update notes here)

## [v1.8.0] — 2025-09-13T11:35:37.821Z
- Archive: /archive view shows archived cards in grid, newest first
- Cards: archive button sets archived & archivedAt via PATCH
- Model: Card supports archived/archivedAt with indexes


## [v1.8.0] — 2025-09-13T11:35:37.746Z
- (update notes here)

## [v1.7.0] — 2025-09-13T11:28:14.081Z
- Routing: layout toggle now navigates to /kanban and /matrix


## [v1.7.0] — 2025-09-13T11:28:14.011Z
- (update notes here)

## [v1.6.0] — 2025-09-13T11:23:52.467Z
- Routing: Added /kanban and /matrix; / redirects to /kanban
- Board: accepts initialView prop (kanban/matrix)


## [v1.6.0] — 2025-09-13T11:23:52.399Z
- (update notes here)

## [v1.5.0] — 2025-09-13T11:16:30.177Z
- UX: Reduced left gutter for Important/Not Important to match top labels


## [v1.5.0] — 2025-09-13T11:16:30.112Z
- (update notes here)

## [v1.4.0] — 2025-09-13T11:12:31.268Z
- Fix: repositioned Important/Not Important labels inside left margin for visibility


## [v1.4.0] — 2025-09-13T11:12:31.203Z
- (update notes here)

## [v1.3.0] — 2025-09-13T11:07:01.776Z
- Fix: left-side axis labels (Important/Not Important) visible with offset and z-index


## [v1.3.0] — 2025-09-13T11:07:01.709Z
- (update notes here)

## [v1.2.0] — 2025-09-13T11:03:06.896Z
- Layout: Added matrix/kanban toggle with sticky composer
- Eisenhower Matrix: Do/Decide/Delegate/Delete with axis labels (Important/Not Important, Urgent/Not-Urgent)
- Kanban columns renamed: Delegate/Decide/Do


## [v1.2.0] — 2025-09-13T11:03:06.824Z
- (update notes here)

## [v1.1.0] — 2025-09-13T10:45:55.787Z
- Fix: settings PATCH now uses \ for partial updates (age/rotten colors)
- Admin: /admin continues to manage colors via settings


## [v1.1.0] — 2025-09-13T10:45:55.718Z
- (update notes here)

## [v1.0.0] — 2025-09-13T10:36:31.018Z
- Major: Introduced configurable hashtag color system with /admin and persistent settings
- Backward-incompatible UI styling behavior due to settings-driven colors


## [v1.0.0] — 2025-09-13T10:36:30.950Z
- (update notes here)

## [v0.4.0] — 2025-09-13T10:34:09.061Z
- Admin page: /admin to configure hashtag bubble colors (age/rotten)
- Global Settings model and /api/settings (GET/PATCH)
- Board reads colors from settings provider with defaults

# RELEASE_NOTES

## [v0.4.0] — 2025-09-13T10:33:58.937Z
- (update notes here)

## [v{NEW}] — {ISO}
- UI: Hashtag bubbles for age and rotten metrics
- Color gradients: oldest→newest (dark→light blue), least→most rotten (green→brown)
- Per-column normalization for proportional coloring
- Light mode preserved (black text everywhere)


## [v0.3.0] — 2025-09-13T10:19:26.204Z
- (update notes here)

## [v{CURRENT}] — {ISO}
- 3-column board with backlog composer (Enter submit, Shift+Enter newline)
- MongoDB persistence with createdAt/updatedAt (ISO 8601 UTC)
- Old/rotten metrics in days and hours
- Light theme with black text across all elements
- Version automation script and predev PATCH bump


## [v0.2.0] — 2025-09-12T13:22:47.011Z
- (update notes here)

## [v0.2.0] — 2025-09-12T13:22:46.863Z
- (update notes here)

## [v0.1.5] — 2025-09-12T13:20:08.754Z
- (update notes here)

## [v0.1.4] — 2025-09-12T12:39:47.485Z
- (update notes here)

## [v0.1.3] — 2025-09-12T09:31:40.822Z
- (update notes here)

## [v0.1.2] — 2025-09-12T09:27:08.261Z
- (update notes here)

## [v0.0.1] — 2025-09-12T07:59:06.000Z
- Project scaffold created
- Planned MongoDB connection, CRUD API, and UI board (pending implementation)
