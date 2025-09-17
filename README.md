# Cardmass — 3-column card chat

Version: v3.0.4

Overview
Cardmass is a minimal board with multiple layouts:
- Kanban: #delegate, #decide, #do
- Matrix (Eisenhower): #do, #decide, #delegate, #decline (decline is only shown here)
- Proof: 3x3 grid — Row1 [#Persona, #Proposal, #Outcome], Row2 [#Benefit, #decide, #Decline], Row3 [#Journey, #Validation, #Cost]. New cards default to Backlog (hidden holding area) until moved.

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
