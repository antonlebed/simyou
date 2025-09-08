# API Reference (Current)

All endpoints are served by Cloudflare Pages Functions under `/api/*`.

## Authentication Model
- Client creates/stores a random `session_id` (e.g., `crypto.randomUUID()`)
- Server issues short-lived HMAC token via `/api/session`
- Subsequent write endpoints require both headers:
  - `x-simyou-session: <session_id>`
  - `x-simyou-session-token: <token>`

## CORS
- Allowed origins come from `ALLOWED_ORIGIN` (comma-separated list) in environment variables.
- Responses include: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods: GET,POST,OPTIONS`, `Access-Control-Allow-Headers: content-type,x-simyou-session,x-simyou-session-token`, `Access-Control-Max-Age: 86400`, `Vary: Origin`.
- OPTIONS preflights return `204`.

## Caching
- API responses set `Cache-Control: no-store` to prevent stale/mixed client state.
- Static asset caching is configured via `_headers` (see “Static assets (frontend)” below).
 - Build pipeline auto-stamps non-hashed asset URLs with a build id to guarantee freshness between deploys.

## Endpoints

### OPTIONS /api/session and /api/battle
- No body.
- Returns `204` with CORS headers.

### GET /api/session
- Headers:
  - `x-simyou-session: <session_id>`
- Response 200:
```json
{ "ok": true, "token": "<hex>", "exp_s": 900 }
```
- Response 400:
```json
{ "ok": false, "error": "missing session" }
```

### POST /api/battle
- Headers:
  - `content-type: application/json`
  - `x-simyou-session: <session_id>`
  - `x-simyou-session-token: <token>`
- Body (TypeScript):
```ts
export type BattleRequest = {
  game_slug: string;
  stage_band: number;
  last_outcome: 'W'|'L'|'N';
  run_step?: number;
  client_build: string;
  opt_out?: boolean;
  player_setup: { seed: number; board: number[]; shop_rolls?: number[] };
};
```
- Response 200 (stubbed):
```ts
export type BattleResponse =
  | { ok: true; result: { win: boolean; score?: number; turns?: number };
      ghost_hash: string; replay_id: string; replay: ReplayV1 }
  | { ok: false; error: string };
```
- Error 400/401/413/500 with `{ ok:false, error }` as appropriate.

## Types
```ts
export type SnapshotV1 = {
  v: 1;
  game_v: string;
  seed: number;
  initial_state?: unknown;
  actions: Array<{ t: number; a: string; [k: string]: number|string|boolean }>;
  result?: { win?: boolean; score?: number };
};

export type ReplayV1 = {
  v: 1;
  game_v: string;
  initial: { player: number[]; ghost: number[] };
  events: Array<any>;
};
```

## Notes
- Payloads are capped at 64KB (server enforces before heavy work).
- Storage and sim are stubs; results are deterministic placeholders.
- The hub UI no longer includes built-in smoke-test buttons. For local smoke tests, use DevTools console (see README) or curl.
- CORS origins are derived from `ALLOWED_ORIGIN` (comma-separated list). For Pages dev, `npx wrangler pages dev dist` serves both UI and API on the same origin.
- Scrolling model: desktop uses root page scroll; on iOS touch devices we switch to an internal scroll container on `#root` (React) and `.wrap` (static) to avoid rubber‑band flicker. Horizontal scrolling is disabled site‑wide. `scrollbar-gutter: stable` is applied (with a `calc(100vw - 100%)` fallback) to prevent layout shifts when the vertical scrollbar appears.

### Static assets (frontend)
- Brand images live under `/public/brand/` (e.g., `/brand/logo.png`). Served with `must-revalidate` so updated assets show up immediately after deploys.
- Planetary nav images live under `/public/planets/` and already include their labels (e.g., `home_earth.png`, `research_mars.png`, `api_jupiter.png`, `privacy_saturn.png`). Served with `must-revalidate`.
- Favicons live at the root of `/public/` (e.g., `/favicon.png`) and `apple-touch-icon.png` — also `must-revalidate`.
- The hub and static pages preload the logo and planet images for faster first paint.
- Shared presentation styles (logo glow, planetary nav, social icon plates) are centralized in `/public/site.css` and used by both the React app and static pages. `site.css` is set to `must-revalidate` (fresh on new builds, cached between navigations).
- JS bundles are emitted by Vite with content hashes and are served as `immutable` with a 1‑year TTL (under `/assets/*`). We do not mutate hashed bundles post‑build.
- The build adds `?v=<build-id>` to image/icon URLs in built HTML and SPA code; the build id is the git short SHA (fallback: timestamp).
- Font Awesome (6.7.2) is loaded via CDN in `index.html` and static pages to render brand icons.
- Footer contains social links (YouTube, Discord, X, GitHub); navigation is now a top “planetary” bar beneath the hero.