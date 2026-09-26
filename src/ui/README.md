# Maowi UI

React + TypeScript + Vite frontend for the Maowi study app. Talks to the FastAPI
backend over cookie-based auth sessions.

## Commands

```sh
npm run dev      # vite dev server on :5173
npm run build    # tsc -b && vite build
npm run lint     # oxlint
npm test         # vitest run
```

The backend must be running on `http://localhost:8000` (see the repo README).
Copy `.env.example` to `.env` to point the UI somewhere else.

## Layout

- `src/config.ts` is the only module that reads `import.meta.env`.
- `src/api/client.ts` is the only module that calls `fetch`; every `src/api/*.ts`
  domain module wraps it.
- `src/routes.tsx` holds the route table only — no logic.
- `src/main.tsx` wires the query client, router and global loading overlay.

## Tests

Frontend tests live in the repo-root `tests/ui/` directory, mirroring the backend's
`tests/` layout, and run with Vitest via `npm test` from this package.

Because `node_modules` lives here but the test files live two levels up, Node's
module resolution cannot find React from `tests/ui/`. The `pretest` script creates a
`node_modules` symlink at the repo root (gitignored) so bare imports resolve. It is
idempotent — delete the symlink and re-run `npm test` to recreate it.
