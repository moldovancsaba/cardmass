# cardmass


Version: 1.8.0
Updated: 2025-12-21T18:31:24.915Z

![version](https://img.shields.io/badge/version-1.8.0-green?style=flat-square)

Cardmass lets you classify a shared set of cards across multiple boards (pages). Each board defines areas (labeled territories) for a specific dimension like importance, difficulty, impact, cost, resourcing, etc. A card can have one placement per board, forming an N-dimensional position. Unplaced cards fall into the board's spock area (if present) — a virtual inbox that is never persisted.

> **Single source of truth:** Start with `HANDBOOK.md`. It unifies product direction, architecture, governance, and roadmap details. All other docs act as appendices.

Links
- HANDBOOK.md — **canonical reference for product + engineering**
- USER_GUIDE.md — **comprehensive user guide for end users** (boards, cards, Spock, sharing)
- ARCHITECTURE.md — glossary, data model, and file map
- ROADMAP.md — forward-looking plan (grouped by milestone)
- TASKLIST.md — active tasks with owners and expected dates
- RELEASE_NOTES.md — completed releases
- LEARNINGS.md — decisions and migration notes
- TECH_STACK.md — languages, frameworks, tools, env vars
- NAMING_GUIDE.md — naming conventions and examples
- WARP.md — guidance for warp.dev usage and repository commands
- WARP.DEV_AI_CONVERSATION.md — planning and governance log

Quickstart
1) Install dependencies
   - npm install
2) Set up environment
   - .env.local must include MONGODB_URI and (optionally) MONGODB_DBNAME
   - Optional: NEXT_PUBLIC_BASE_URL (for server-side fetch to self)
3) Run development server
   - npm run dev (http://localhost:6000)

Admin Password Reset
If you forget your super admin password, use the password reset script:
```bash
node scripts/admin/update-password.mjs <your-email@example.com>
```
The script will:
- Generate a new 32-character hex password
- Hash it with MD5 before storing (matches auth system)
- Display the plaintext password for you to use for login
- Update the password in MongoDB users collection

Note: Save the displayed password securely - it won't be shown again.

Core concepts (universal references)
- card: single element with content; drag, edit, archive
- area: labeled territory on a board; placement label per board
- organization: top-level tenant; all data is scoped by organizationId (UUID v4)
- board: a page that has areas around the same initiative; identified by uuid (UUID v4)
- slug: human-readable label for a board (metadata only; not used in routing)
- hashtag: label derived from placements on other boards (display-only)
- spock: virtual inbox area for unplaced cards on that board; never persisted
- uuid: globally unique identifier (v4) used for organizations, boards, and cards

Notes
- All timestamps must be ISO 8601 with milliseconds in UTC
- No tests (MVP policy)
- No breadcrumbs (Navigation policy)
- Board backgrounds can be set in Creator (Board background CSS) and on the organization page (InlineCreateBoard). They are applied on Tagger as inline background-* styles.
- Area backgrounds are independent from hashtag colors; Tagger tints area fills using bgColor and no stroke
- Version is surfaced via NEXT_PUBLIC_APP_VERSION for metadata alignment; it is not shown in the UI navigation
- Authentication: Zero-trust access for Tagger pages via admin session (HttpOnly cookie) OR page password (32-hex token). See ARCHITECTURE.md § 10 for complete specification.

Board background (CSS) — example
Paste multiline CSS with only background-* declarations (others are ignored by design):

```css path=null start=null
background-color: #2A7B9B; /* Fallback solid color */
background-image:
  url("https://example.com/your-background.jpg"),
  linear-gradient(90deg, rgba(42, 123, 155, 1) 0%, rgba(87, 199, 133, 1) 50%, rgba(237, 221, 83, 1) 100%);

/* Optional positioning/repeat */
background-repeat: no-repeat, no-repeat;
background-size: cover, cover;
background-position: center, center;
```

Where to set it
- In Creator: middle column → “Board background (CSS)”
- On organization page: “Create Board” → “Board background (CSS)”
