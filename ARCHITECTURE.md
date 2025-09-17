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
  - components/Board.tsx: manages kanban and matrix views; orchestrates CRUD, native HTML5 drag-and-drop, and layout
    - Kanban shows delegate/decide/do; Matrix shows do/decide/delegate/decline (decline hidden in Kanban)
  - app/proof/page.tsx: 3x3 grid extended from matrix:
    - Row1 [#Persona, #Proposal, #Outcome]
    - Row2 [#Benefit, #decide, #Decline]
    - Row3 [#Journey, #Validation, #Cost]
    - DnD parity with /matrix (native HTML5, neighbor-averaging)
    - Backlog: hidden holding area where new/unmapped cards land until moved
    - Dragging cards supports cross-container moves and intra-container reordering
  - components/BottomBar.tsx: centralized communication/navigation bar; identical across pages
  - app/{kanban,matrix,archive,admin}/page.tsx: each uses a consistent wrapper (xl:h-screen xl:overflow-hidden) with inner flex-1 xl:overflow-hidden content area
  - Matrix: 2x2 grid uses h-full/min-h-0 and items-stretch to fill available height; each rectangle scrolls internally
  - lib/date.ts: daysBetweenUtc / hoursBetweenUtc
  - lib/client.ts: fetch helper

- Domain & Data
  - Card status: delegate | decide | do | decline (decline visible only in Matrix)
  - Ordering: numeric 'order' field enables persistent reordering; UI sorts by order asc, updatedAt desc
  - Fractional reordering: client computes new order by averaging neighbors; top/bottom use min-1/max+1

- API & Model
  - models/Card.ts: adds 'order' number field and compound index { status:1, order:1 }
  - app/api/cards/route.ts:
    - GET accepts status incl. decline; sorts by { order:1, updatedAt:-1 }
    - POST inserts new cards at top (order = min-1)
  - app/api/cards/[id]/route.ts: PATCH accepts { text, status, order, archived }; status change without order places card at top of target status

- Notes
  - No tests per policy
  - No breadcrumbs per policy
  - Status values: delegate | decide | do (default decide)
