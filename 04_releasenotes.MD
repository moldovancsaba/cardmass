# Release Notes

## v0.0.1 - 2025-04-23

### Summary
Initial project setup, commit, and deployment.

### Changes
- Added font assets (`PantonNarrow-Trial-Black.woff`, `.woff2`) in `/show` directory.
- Created initial `.gitignore` file (ignoring `.DS_Store`).
- Linked project to GitHub repository `moldovancsaba/workfromcloud`.
- Linked project to Vercel project `narimato/workfromcloud`.
- Created initial documentation files (`03_lessonslearned.MD`, `04_releasenotes.MD`, `05_50FirstDates.MD`).

### Deployment
- **Commit:** `6c84a76` (https://github.com/moldovancsaba/workfromcloud/commit/6c84a76)
- **Vercel:** https://workfromcloud-kjk2d3dmu-narimato.vercel.app


## v0.1.0 - 2025-04-23

### Summary
Implemented a minimal Next.js application that lists files from the `/public` directory with clickable links. Resolved production 404 errors by adding explicit Vercel build configuration.

### Changes
- Added basic Next.js structure (`app/page.tsx`, `app/layout.tsx`, config files).
- Implemented file listing from `/public` using `fs.readdirSync` in `app/page.tsx`.
- Removed Tailwind CSS and PostCSS dependencies for simplicity.
- Moved font assets from `/show` to `/public/show`.
- Added `vercel.json` to specify framework preset and build settings.
- Fixed various build and syntax errors during setup.

### Deployment
- **Commit:** `79f3175` (https://github.com/moldovancsaba/workfromcloud/commit/79f3175c32a7e678265f0bae9f0bfc3148f07445)
- **Vercel:** https://workfromcloud.vercel.app (Deployment: `https://workfromcloud-nhzx3ibye-narimato.vercel.app`)
