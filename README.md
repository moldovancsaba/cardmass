# Cardmass — 3-column card chat

Version: v1.12.0

Overview
Cardmass is a minimal 3-column board where you create cards in the center (#backlog) by typing and pressing Enter. Cards can be moved between #roadmap, #backlog, and #todo. Each card is persisted in MongoDB Atlas with createdAt and updatedAt timestamps. The UI shows “X days old” and “rotten for Y days” derived from those timestamps.

Quickstart
1) Copy .env.local.example to .env.local and set MONGODB_URI
2) npm run dev
3) Open http://localhost:3000

Documentation
- ROADMAP.md
- TASKLIST.md
- RELEASE_NOTES.md
- ARCHITECTURE.md
- LEARNINGS.md
