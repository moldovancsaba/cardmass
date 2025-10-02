# TECH_STACK

Version: 0.17.0
Generated: 2025-10-01T12:34:55.000Z

1. Overview
- This document defines the official technology stack and versions for the cardmass project.
- All changes to the stack must be documented here and comply with the Technology Stack Compliance Policy.

2. Languages and Runtimes
- Node.js: >= 20.x (LTS)
- TypeScript: ^5

3. Frameworks and Libraries
- Next.js: 15.5.3 (App Router)
- React: 19.1.0
- react-dom: 19.1.0
- Tailwind CSS: ^4
- ESLint: ^9 (eslint-config-next: 15.5.3)
- MongoDB Driver (Node.js): ^6
- dotenv: ^16

4. Module System and Bundling
- Module System: ES Modules (Next.js default)
- Dev Server: next dev (port 4000)
- Build: next build
- Start: next start (port 4000)

5. Package Manager
- npm (default)

6. Environment Variables
- MONGODB_URI — MongoDB connection string
- MONGODB_DBNAME — Optional explicit DB name
- NEXT_PUBLIC_BASE_URL — Optional, used for server-side fetch to self

7. Conventions and Compliance
- Timestamps must be ISO 8601 with milliseconds in UTC across code and docs.
- No tests (MVP policy).
- No breadcrumbs (Navigation Design Policy).
- Any deviation or addition to this stack requires:
  1) Rationale and impact analysis
  2) Compatibility check
  3) Formal approval and documentation in this file

8. Future Work
- Add .nvmrc (Node 20 LTS) and keep this file updated accordingly.
