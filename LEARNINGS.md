# LEARNINGS

- Keep Mongoose connection cached across HMR to prevent multiple connections in dev.
- Always serialize timestamps as ISO 8601 UTC with milliseconds for consistency in UI and docs.
- When building app-like layouts, set the outer content wrapper to min-h-0 and overflow-hidden, and make internal sections flex-1 with overflow-auto. This prevents container growth and keeps scrolling internal.
- On responsive Tailwind layouts, avoid accidental height losses: remove unnecessary margins above grids and ensure grid containers use h-full with items-stretch when they must consume all remaining height.
- Standardize shared UI (like BottomBar) in a single component and wrap pages consistently (xl:h-screen xl:overflow-hidden) to guarantee identical placement across routes.
