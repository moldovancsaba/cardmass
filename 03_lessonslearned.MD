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
