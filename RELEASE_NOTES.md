
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
