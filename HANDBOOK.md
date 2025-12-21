# CardMass Handbook

**Version:** 1.7.0  
**Updated:** 2025-12-21T13:36:32.549Z

> This handbook is the single source of truth for both the product direction and the development workflow. All feature discussions, architectural changes, and delivery plans should start here. Supporting documents (README, ARCHITECTURE, ROADMAP, etc.) now act as appendices linked throughout this file.

---

## 1. Product Overview

- **Mission:** Help teams classify the same set of cards across multiple dimensions so they can reason about priorities, impact, and effort in one place.
- **Audience:** Product/ops teams who need structured decision-making without heavy process.
- **Value:** One shared card set, hashed board routing, real-time drag + drop, zero-trust sharing (admin bypass + page passwords).

### 1.1 Core Concepts
- **Organization** — Top-level tenant (UUID v4). All data scoped by organizationId.
- **Board** — Represents one dimension (e.g., Priority, Complexity). Each board has rows × cols areas plus optional background CSS.
- **Area** — Labeled territory inside a board. Styling fields: `bgColor`, `textBlack`, `rowFirst`.
- **Card** — Content item that can have placements on multiple boards. Placements tracked via `boardAreas`.
- **Spock** — Virtual inbox for cards with no placement on the current board. Never persisted.

### 1.2 Current UX Surfaces
- `/` → Universal login (all roles).
- `/organizations` → Org selector listing authorized orgs with role badges.
- `/{organizationUUID}` → Org main; board list with Tagger, Edit, Password, Creator, Settings access.
- `/{organizationUUID}/{boardUUID}/tagger` → Tagger workspace (PasswordGate + TaggerApp).
- `/{organizationUUID}/settings` → Admin tabs (Org mgmt, Board mgmt, future Password/User tabs).
- `/admin/dashboard` → Super-admin overview with Organizations and System Users tabs.
- `/organization/admin?org={uuid}` → Org Admin Panel (Users + Boards tabs).

See `USER_GUIDE.md` for end-user walkthrough details.

---

## 2. Architecture & Stack

- **Framework:** Next.js 15 (App Router) with React 19, TypeScript 5, Tailwind CSS v4.
- **Runtime:** Node.js ≥ 20 (ESM). `.nvmrc` with Node 20.18.1 LTS in place.
- **Data:** MongoDB with UUID-first collections for organizations, boards, cards, pagePasswords, users.
- **Routing:** Hashed board URL pattern `/{organizationUUID}/{boardUUID}`; slugs metadata only.
- **Server/Client Pattern:** “Server authenticates, client fetches.” Page server components do only auth + param validation, passing IDs into client components that handle data fetching/loading/error states (`docs/SERVER_CLIENT_PATTERNS.md`).
- **Governance:** ISO 8601 timestamps with milliseconds in UTC, no automated tests (MVP policy), no breadcrumbs, mandatory “what & why” comments for meaningful changes. Follow Versioning & Release Protocol (bump patch before dev, bump minor before commit, sync docs & package metadata).

For full schema definitions and API contracts see `ARCHITECTURE.md`.

---

## 3. Security & Access

- **Zero-Trust Rule:** Access granted only via (a) valid admin session cookie `admin_session` or (b) valid page password headers (`X-Page-Id`, `X-Page-Type`, `X-Page-Password`).
- **Admin Session:** Base64 JSON token (`sub`, `email`, `role`, `exp`). HttpOnly, SameSite=Lax, Secure in prod, 30-day expiry. Login/logout/check at `/api/auth/*`.
- **Page Passwords:** 32-char lowercase hex tokens per board (`pagePasswords` collection). Generated via POST `/api/page-passwords`, validated via PUT `/api/page-passwords`. PasswordGate client handles admin bypass, URL param `?pw=`, prompt state machine, and header injection for TaggerApp.
- **Middleware:** Enforces `X-Organization-UUID` header alignment with path for `/api/v1/organizations/*`.
- **Protected APIs:** Boards + cards org scope require admin session or valid page password headers when `scope=tagger` or any `X-Page-*` header present.

See `AUTHENTICATION_AND_ACCESS.md` for deep dive and troubleshooting.

---

## 4. Development Workflow

1. **Plan:** Log intents in `WARP.DEV_AI_CONVERSATION.md` with ISO timestamps.
2. **Docs First:** Update this Handbook with any new product or architecture decisions. Secondary docs (README, etc.) reference sections here.
3. **Build:** `npm install`, `npm run dev` (port 4000), `npm run build` before any commit/PR.
4. **Scripts:** Admin helpers under `scripts/`; refer to `WARP.md` for one-line descriptions and flags.
5. **Testing:** Manual only. Follow acceptance criteria per ROADMAP/TASKLIST entries.
6. **Delivery:** Update `RELEASE_NOTES.md` upon completing tasks; keep `ROADMAP.md` and `TASKLIST.md` forward-looking but summarized below.

---

## 5. Roadmap & Active Workstreams

|| Item | Priority | Status | Notes |
|| --- | --- | --- | --- |
|| Automate doc version/timestamp sync | P0 | ✅ COMPLETED (2025-12-21) | Script + hook enforcing governance. |
|| Board placements keyed by boardUUID | P0 | ✅ COMPLETED (2025-12-20) | All cards use UUID keys; migration script created. |
|| Add `.nvmrc` (Node 20) | P1 | ✅ COMPLETED (2025-12-21) | Node 20.18.1 LTS in .nvmrc; TECH_STACK.md updated. |
|| Manual QA of zero-trust access | P1 | ⏳ PENDING | Validate admin bypass, password gate, API enforcement. |
|| Maintain WARP.md | P2 | ⏳ ONGOING | Keep workflows/scripts current. |
|| CSS Masonry for Tagger | P3 | 🚫 DEFERRED | Feature-flagged idea, currently parked. |
|| SSO Integration (DoneIsBetter Auth) | P0 | 🚧 PLANNED (Q1 2026) | Migrate to OAuth2/OIDC; unified login; app-level permissions. |

**Process:** When adding or changing items, update this table first, then sync `ROADMAP.md`/`TASKLIST.md`.

---

## 6. Product Delivery Checklist

1. Confirm design intent in §1 (update if feature impacts scope or UX).
2. Capture any schema/API changes in §2 and `ARCHITECTURE.md`.
3. Align security considerations with §3 and `AUTHENTICATION_AND_ACCESS.md`.
4. Log engineering approach + commands in §4 or `WARP.md`.
5. Add/adjust roadmap line item in §5.
6. Document release in `RELEASE_NOTES.md` with ISO timestamp.

---

## 7. Document Map

| Doc | Purpose | Authority |
| --- | --- | --- |
| `HANDBOOK.md` | Canonical view of product + engineering | **Single source of truth** |
| `README.md` | Quickstart + pointer to handbook | Secondary |
| `ARCHITECTURE.md` | Deep-dive glossary & data model | Secondary (mirrors §2) |
| `USER_GUIDE.md` | End-user how-to | Secondary |
| `AUTHENTICATION_AND_ACCESS.md` | Auth specification | Secondary |
| `ROADMAP.md` | Detailed milestones | Derived from §5 |
| `TASKLIST.md` | Detailed tasks | Derived from §5 |
| `WARP.md` | Dev commands/workflow | Secondary |
| `RELEASE_NOTES.md` | Historical releases | Secondary |

Whenever discrepancies appear, update this handbook first, then reconcile the dependent file.

---

## 8. Contacts & Ownership

- **Product & UX:** csaba (owns org roadmap, documentation automation).
- **Engineering & Infrastructure:** ai (owns zero-trust auth, Tagger, admin tooling).
- **Docs Governance:** Shared; updates must include version bump + ISO timestamp.

Record ownership changes here to avoid stale references elsewhere.

---

## 9. Appendix Links

- End-user reference: `USER_GUIDE.md`
- Technical deep dive: `ARCHITECTURE.md`, `TECH_STACK.md`
- Operational scripts index: `WARP.md`
- Historical context: `WARP.DEV_AI_CONVERSATION.md`, `RELEASE_NOTES.md`

All appendices should include “See HANDBOOK.md” when describing cross-cutting concepts.


