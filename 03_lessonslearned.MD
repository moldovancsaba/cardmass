# Lessons Learned

## 2025-04-23: Initial Project Setup (v0.0.1)

- **Observation:** Standard project documentation files (`03_lessonslearned.MD`, `04_releasenotes.MD`, `05_50FirstDates.MD`) were missing at the start of the setup process.
- **Action:** Created the required documentation files as part of the initial setup task to comply with project rules (`07_Definition_of_Done_AI_Warp.MD`).
- **Safeguard:** Ensure project bootstrapping includes creation of mandatory documentation files.

- **Observation:** `vercel link` command automatically modifies `.gitignore` to add `.vercel/`.
- **Action:** Ensured this modification was included in the subsequent commit.
- **Safeguard:** Remember to check for unstaged changes after running `vercel link` or similar tools that might modify project files.

- **Observation:** Combined Git commands (`git commit && git tag`) failed initially.
- **Action:** Executed `git commit` and `git tag` separately, which succeeded. Root cause of initial failure unclear but likely related to command chaining or environment state.
- **Safeguard:** If chained Git commands fail, try executing them individually to isolate the issue.


## 2025-04-23: Post-Deployment Observation (v0.0.1)

- **Observation:** Accessing the initial deployment URL (`https://workfromcloud-kjk2d3dmu-narimato.vercel.app`) resulted in a 404 Not Found error.
- **Reason:** The deployed project (`v0.0.1`) contained only static assets (`show/` directory fonts) and configuration/documentation files (`README.md`, `.gitignore`, `.vercel/`), but no actual web application or `index.html` file at the root to be served by Vercel.
- **Action:** Acknowledged this is expected behavior for a deployment lacking serveable web content at the root path.
- **Resolution:** Proceed with the planned creation of the Next.js web application structure, which will provide the necessary index page (`app/page.tsx`) for future deployments.


## 2025-04-23: File Listing App & Deployment (v0.1.0)

- **Observation:** Initial manual Next.js setup (installing packages, creating configs) missed adding standard `scripts` (`dev`, `build`, etc.) to `package.json`.
- **Action:** Added required scripts manually to `package.json`.
- **Safeguard:** When manually setting up a framework project, ensure standard build/dev scripts are included in `package.json`. `create-next-app` handles this automatically.

- **Observation:** Persistent JSX syntax errors (`&lt;` instead of `<`) in `app/layout.tsx` occurred due to limitations in automated file writing tools (code tool, sed, printf, base64) potentially related to shell escaping or encoding.
- **Action:** After explicit permission, successfully overwrote the file using a simple `echo '...' > file` command, which correctly wrote literal angle brackets.
- **Safeguard:** For complex file content with special characters, simple `echo` redirection might be more reliable than tools that perform intermediate processing or escaping, but requires careful syntax. If issues persist, manual editing might be the only fallback.

- **Observation:** Next.js v15+ requires `@tailwindcss/postcss` package and updated `postcss.config.mjs` if using Tailwind. Initial setup caused build errors.
- **Action:** Installed `@tailwindcss/postcss` and updated config. Later, removed Tailwind/PostCSS entirely for simplicity as requested.
- **Safeguard:** Check framework/library compatibility notes (e.g., Next.js + Tailwind) when setting up projects.

- **Observation:** Vercel deployment resulted in 404 error despite successful local development. `vercel inspect` showed minimal build output (`.`).
- **Action:** Added `vercel.json` explicitly defining `framework: "nextjs"`, `buildCommand`, and `outputDirectory`. Redeployment fixed the 404.
- **Safeguard:** For non-trivial projects or when auto-detection might fail, explicitly configure build settings in `vercel.json` to ensure correct framework detection and build execution on Vercel.

- **Observation:** Vercel deployments were assigned temporary URLs, not the main production domain alias, even with `--prod`.
- **Action:** Verified alias configuration with `vercel alias ls`. Added `vercel.json` which likely helped Vercel correctly identify the production build and assign the alias properly on subsequent deployment. Manual aliasing (`vercel alias set`) was attempted but unnecessary after fixing the build config.
- **Safeguard:** Ensure Vercel project settings (or `vercel.json`) correctly define the production branch and build outputs to facilitate automatic aliasing.
