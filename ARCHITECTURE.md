# Simyou Architecture (Current)

This doc captures the current shape of the project and how to build/run it today.

## Overview
- Frontend: Vite + React (TypeScript), deployed via Cloudflare Pages
- Backend: Cloudflare Pages Functions under `functions/` (session and battle stubs)
- Data stores (Cloudflare): D1 (`DB`), KV (`SIMYOU_CACHE`), R2 (`SNAPSHOTS`)
- Export: separate Worker planned under `workers/export/` (cron), not implemented yet

## Build & Local Dev
- Install deps: `npm i`
- Build site: `npm run build` → outputs to `dist/`
- Serve API locally: `npx wrangler pages dev dist`
  - Uses `wrangler.toml` bindings and `.dev.vars` for secrets

Key configs:
- `wrangler.toml` — local bindings and Pages settings
- `.dev.vars` — `SESSION_SECRET`, `ALLOWED_ORIGIN` (comma-separated for multiple origins)
- `tsconfig.functions.json` — Workers-targeted TS (omit WebWorker lib; rely on `@cloudflare/workers-types`)
- `schema.sql` — D1 schema for tables and indices

## Runtime Contracts (Stubs)
- GET `/api/session`
  - Header: `x-simyou-session` (client random UUID)
  - Returns: `{ ok, token, exp_s }` where `token = HMAC(session|v1)`
- POST `/api/battle`
  - Headers: `x-simyou-session`, `x-simyou-session-token`
  - Body: `BattleRequest`
  - Validates schema and size (<= 64KB), verifies token, runs server-sim stub, stores via stubs, returns `{ ok, result, replay }`
- OPTIONS for both endpoints return 204 with CORS headers.

Supporting modules:
- `_lib/security.ts` — security headers, dynamic CORS via `corsFor(env, request)`, HMAC helper
- `_lib/sim.ts` — deterministic stub replay
- `_lib/store.ts` — storage stubs (to be implemented using D1/KV/R2)
- `functions/types.d.ts` — shared request/response types

## Frontend
- `src/App.tsx` — hub page with centered hero, clickable logo, animated starfield background, styled game cards.
- Global footer nav (Home, Privacy, Research, API): implemented in React and mirrored on static pages; layout/styles centralized in `public/site.css`.
- `public/privacy/`, `public/research/`, `public/api/` — styled static pages matching hub theme; all use the shared footer and clickable logo.
- Brand assets: `public/brand/logo.png` (source of truth, transparent PNG); favicons at `public/favicon.png`

## Deployment (Pages)
- Build command: `npm run build`
- Output dir: `dist`
- Functions dir: `functions`
- Bindings: `DB`, `SIMYOU_CACHE`, `SNAPSHOTS`
- Env: `ALLOWED_ORIGIN` (comma-separated allowed origins), Secret: `SESSION_SECRET`
- D1 schema: apply `schema.sql` in Dashboard → Query or via `wrangler d1 execute ... --file schema.sql`

## Current Gaps / Next Steps
- Implement real `_lib/store.ts` (hashing, R2 put, D1 rows, KV indices)
- Replace `_lib/sim.ts` with game logic
- Optional: `/api/replay/:id`
- Implement export worker + cron to write JSONL to R2 (daily ~23:59 EDT)
- Developer smoke tests are now console-based; the hub contains no test UI
 - Optional: add `apple-touch-icon.png` and legacy `favicon.ico` for broader icon support
