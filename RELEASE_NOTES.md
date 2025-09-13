
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
