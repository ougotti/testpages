# AGENTS

## Scope
These instructions apply to the entire repository.

## Testing
- Run `npm test` (currently no tests, but execute the command).
- Run `npm run lint` before committing.

## Development Notes
- The home page (`src/app/page.tsx`) presents links to ten apps.
- Each app page (`src/app/appN/page.tsx`) must:
  - Export `metadata` with a Japanese title.
  - Wrap content in a `<main>` element.
  - Provide a link back to the home menu (`/`).
  - Use Japanese text for UI labels.
