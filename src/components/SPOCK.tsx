"use client"

// What: Re-export BottomBar as SPOCK for a stable import path.
// Why: This wrapper must be a client module too; without "use client", Next would
// treat it as a server module and re-exporting a client component through a server
// module can cause webpack runtime errors during Fast Refresh (e.g.,
// __webpack_modules__[moduleId] is not a function).
export { default } from './BottomBar'
