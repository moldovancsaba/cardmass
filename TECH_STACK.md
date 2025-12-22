# TECH_STACK

Version: 1.20.0
Updated: 2025-12-22T20:34:15.863Z

1. Overview
- This document defines the official technology stack and versions for the cardmass project.
- All changes to the stack must be documented here and comply with the Technology Stack Compliance Policy.

2. Languages and Runtimes
- Node.js: >= 20.x (LTS) — See .nvmrc for specific version (20.18.1)
- TypeScript: ^5

3. Frameworks and Libraries
- Next.js: 15.5.9 (App Router)
- React: 19.1.0
- react-dom: 19.1.0
- Tailwind CSS: ^4
- ESLint: ^9 (eslint-config-next: 15.5.3)
- MongoDB Driver (Node.js): ^6
- dotenv: ^16
- jose: ^5.10.0 (JWT verification for SSO RS256 tokens)

4. Module System and Bundling
- Module System: ES Modules (Next.js default)
- Dev Server: next dev (port 3000)
- Build: next build
- Start: next start (port 3000)
- Port Range Preference: 6000-6300

5. Package Manager
- npm (default)

6. Environment Variables
- MONGODB_URI — MongoDB connection string
- MONGODB_DBNAME — Optional explicit DB name
- NEXT_PUBLIC_BASE_URL — Optional, used for server-side fetch to self
- SSO_BASE_URL — SSO service base URL (https://sso.doneisbetter.com)
- SSO_CLIENT_ID — OAuth2 client ID (UUID)
- SSO_CLIENT_SECRET — OAuth2 client secret (UUID)
- SSO_REDIRECT_URI — OAuth2 redirect URI for local dev

7. Conventions and Compliance
- Timestamps must be ISO 8601 with milliseconds in UTC across code and docs.
- No tests (MVP policy).
- No breadcrumbs (Navigation Design Policy).
- Any deviation or addition to this stack requires:
  1) Rationale and impact analysis
  2) Compatibility check
  3) Formal approval and documentation in this file
