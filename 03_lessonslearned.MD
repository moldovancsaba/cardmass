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

