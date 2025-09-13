# ARCHITECTURE

- Stack: Next.js (App Router), TypeScript, TailwindCSS, Mongoose
- DB: MongoDB Atlas, dbName: cardmass, collection: cards
- Env: .env.local -> MONGODB_URI

- Server
  - lib/mongoose.ts: connection with dev cache
  - models/Card.ts: Card schema (text, status, timestamps)
  - app/api/cards/route.ts: GET (filter by status), POST (create)
  - app/api/cards/[id]/route.ts: PATCH (update text/status), DELETE (hard delete)
  - All timestamps: ISO 8601 with milliseconds (UTC)

- Client
  - components/Board.tsx: manages kanban and matrix views; orchestrates CRUD and layout
  - components/BottomBar.tsx: centralized communication/navigation bar; identical across pages
  - app/{kanban,matrix,archive,admin}/page.tsx: each uses a consistent wrapper (xl:h-screen xl:overflow-hidden) with inner flex-1 xl:overflow-hidden content area
  - Matrix: 2x2 grid uses h-full/min-h-0 and items-stretch to fill available height; each rectangle scrolls internally
  - lib/date.ts: daysBetweenUtc / hoursBetweenUtc
  - lib/client.ts: fetch helper

- Notes
  - No tests per policy
  - No breadcrumbs per policy
  - Status values: delegate | decide | do (default decide)
