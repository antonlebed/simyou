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
- CORS origins are derived from `ALLOWED_ORIGIN` (comma-separated list). For local dev, set `http://localhost:5173`.
