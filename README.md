# Cardmass — 3-column card chat

Version: v2.9.0

Overview
Cardmass is a minimal board with two layouts:
- Kanban: #delegate, #decide, #do
- Matrix (Eisenhower): #do, #decide, #delegate, #decline (decline is only shown here)

Native HTML5 drag-and-drop lets you move cards across columns/rectangles and reorder within them. Each card is persisted in MongoDB Atlas with createdAt and updatedAt timestamps. The UI shows “Created X days ago” and “rotten for Y days” derived from those timestamps.

Quickstart
1) Copy .env.local.example to .env.local and set MONGODB_URI
2) npm run dev (predev bumps PATCH automatically)
3) Open http://localhost:3000

Migration (one-time, adds 'order' to existing cards)
- Dry run: node scripts/migrate-add-order.mjs --dry
- Execute: node scripts/migrate-add-order.mjs

Documentation
- ROADMAP.md
- TASKLIST.md
- RELEASE_NOTES.md
- ARCHITECTURE.md
- LEARNINGS.md
