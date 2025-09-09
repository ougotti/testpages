# AGENTS

## Scope
These instructions apply to the entire repository.

## Testing
- Run `npm test` (currently no tests, but execute the command).
- Run `npm run lint` before committing.

## Development Notes
- The home page (`src/app/page.tsx`) presents links to ten apps.
- App2 (`src/app/app2`) contains a Tetris game with canvas rendering and keyboard controls.
- Each app page (`src/app/appN/page.tsx`) must:
  - Export `metadata` with a Japanese title.
  - Wrap content in a `<main>` element.
  - Provide a link back to the home menu (`/`).
  - Use Japanese text for UI labels.

## Architecture Specifications

### Client/Server Component Separation
When an app requires both server-side metadata and client-side interactivity:

1. **Server Component Pattern** (`page.tsx`):
   - Acts as the main page component
   - Exports `metadata` object with Japanese title
   - Wraps content in `<main>` element
   - Imports and renders the client component
   - Does NOT use `'use client'` directive

2. **Client Component Pattern** (`[ComponentName]Client.tsx`):
   - Contains all interactive logic (useState, event handlers, etc.)
   - Uses `'use client'` directive at the top
   - Does NOT export metadata (not allowed in client components)
   - Handles all React hooks and browser-specific functionality

### File Structure Example
```
src/app/appN/
├── page.tsx           # Server component (metadata + main wrapper)
└── ComponentClient.tsx # Client component (interactivity)
```

### Implementation Template
```tsx
// page.tsx (Server Component)
import type { Metadata } from 'next';
import ComponentClient from './ComponentClient';

export const metadata: Metadata = {
  title: '日本語タイトル',
};

export default function AppPage() {
  return (
    <main>
      <ComponentClient />
    </main>
  );
}
```

```tsx
// ComponentClient.tsx (Client Component)
'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ComponentClient() {
  // All interactive logic here
  return (
    <div>
      <Link href="/" className="text-blue-500 underline block mb-4">
        ホームに戻る
      </Link>
      {/* Component UI */}
    </div>
  );
}
```
