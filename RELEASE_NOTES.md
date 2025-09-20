# RELEASE_NOTES

This file records completed releases only. New entries are added when tasks from TASKLIST.md are finished and verified.

## [v3.1.0] — 2025-09-20T15:45:39.720Z
- Build: fix TypeScript errors and ESLint warnings to restore Next.js build.
- Settings: add archive color gradient and business titles to match legacy components.
- UI: align BottomBar imports for legacy components (Board, BusinessBoard, BusinessCanvas, FooterNav).
- Docs: sync version strings across README/ROADMAP/TASKLIST/ARCHITECTURE/LEARNINGS.

## [v3.2.0] — 2025-09-20T16:14:59.417Z
- Middleware: implement Edge-safe middleware (NextRequest/NextResponse) with
  - Scoped matcher that excludes static assets
  - Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
  - HSTS for production host(s)
  - X-App-Version header from NEXT_PUBLIC_APP_VERSION
  - Defensive try/catch with safe pass-through
- Docs: version bump and timestamps updated.

## [v0.2.0] — 2025-09-20T14:08:35.000Z
- Changed: SPOCK bottom bar shows up to 3 board links (alphabetical), with a hamburger overflow for more; Admin link kept; removed Creator/Pages from the bar.
- Changed: SpockNav converted to a server component; brand + Admin only; removed version badge from the UI.
- Docs: Enforced ISO 8601 with millisecond UTC timestamps across docs; updated ARCHITECTURE, ROADMAP, README.
