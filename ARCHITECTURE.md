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
  - components/Board.tsx: manages 3 columns and CRUD actions
  - app/page.tsx: renders Board
  - lib/date.ts: daysBetweenUtc for “X days old” and “rotten for Y days”
  - lib/client.ts: fetch helper

- Notes
  - No tests per policy
  - No breadcrumbs per policy
  - Status values: roadmap | backlog | todo (default backlog)
