# NAMING_GUIDE

Version: 1.5.0
Updated: 2025-12-21T00:31:56.039Z

1. Purpose
- Establish clear, consistent naming across components, files, types, functions, and routes.

2. Components and Files
- Components: PascalCase (e.g., TaggerApp.tsx, BoardCanvas.tsx)
- File name should match the primary export where applicable.

3. Types and Interfaces
- PascalCase (e.g., Card, Board, Organization)

4. Functions and Variables
- camelCase (e.g., placeCard, getBoardAreas)
- Booleans prefixed positively (e.g., isActive, hasPlacement)

5. Constants
- UPPER_SNAKE_CASE (e.g., DEFAULT_ORG_NAME)

6. Routes and Slugs
- Route segments: kebab-case (when human readable)
- Routing identifiers: UUID v4 for organizations and boards (hashed routes)
- Slugs are metadata only; never used for main routing

7. CSS and Styling
- Tailwind utility classes; avoid custom class names unless necessary
- Prefer semantic groupings via layout components over ad-hoc class blobs

8. Comments (Mandatory)
- Explain what the code does and why this approach was chosen
- Reference conventions or policies when deviating (with justification)

9. Examples
- Component file:
  - File: TaggerApp.tsx
  - Export: function TaggerApp() { /* ... */ }
- Type:
  - type Board = { uuid: string; organizationId: string; }
- Function:
  - function placeCard(cardUUID: string, areaLabel: string | undefined) { /* ... */ }

10. Governance
- This guide aligns with project-wide policies:
  - No tests (MVP policy)
  - No breadcrumbs (Navigation Design Policy)
  - Timestamps must be ISO 8601 with milliseconds in UTC
- Changes to conventions must be documented here and reflected across the codebase.