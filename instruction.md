# Simyou Step‑by‑Step Build Guide (sanity‑checked)

This is a click‑by‑click, zero‑to‑deploy guide based on your finalized plan, with gaps fixed (notably: **initialize a local Git repo before connecting Pages**). Follow the phases in order.

---

## A) Sanity fixes vs. your original outline

**What I changed/clarified**

1. **Repo first, then Pages**: Step 9.5 said “push repo to GitHub” without first creating a local repo. This guide adds §1.3–§1.5 to initialize Git, create the GitHub repo, and push **before** connecting Cloudflare Pages.

2. **Wrangler bindings**: Explicit examples for D1/KV/R2 bindings in `wrangler.toml` and where to set them in the Pages dashboard.

3. **D1 schema application**: Clean, repeatable approach: keep `schema.sql` in repo, then execute once against D1 (either Dashboard → Query or CLI alternative).

4. **Local dev secrets**: Use a `.dev.vars` file for `SESSION_SECRET` during `wrangler pages dev`.

5. **CORS and headers**: Provide a single source (`ALLOWED_ORIGIN`) and show where it’s set so dev/prod don’t conflict.

6. **Payload size & replay**: Show exactly where the 64 KB cap is enforced, and include
   smoke‑test curls to verify both `/api/session` and `/api/battle` paths.

7. **Export worker**: Clear separation: Pages project hosts frontend + API; a separate Worker handles cron export with its own bindings.

8. **Done‑when checklist**: Expanded acceptance tests and quick manual QA.

---

## 0) Prerequisites (install once)

* **Accounts**: Cloudflare, GitHub
* **Tools**: Node 20+, npm, Git, and Wrangler

  ```bash
  node -v      # expect v20+
  npm -v
  git --version
  npm i -g wrangler@latest
  ```
* **Decisions** (copy these now; we’ll reuse consistently):

  * Pages project name: `simyou`
  * D1 database name: `SIMYOU`
  * R2 bucket name: `simyou-snapshots`
  * KV namespace: `SIMYOU_CACHE`
  * Primary origin (prod): `https://simyou.ai`

---

## 1) Create repo and scaffold app (local)

1.1 **Scaffold Vite + React + TS**

```bash
npm create vite@latest simyou -- --template react-ts
cd simyou
npm i
npm i -D wrangler typescript @types/node
```

1.2 **Basic project files**

* Create folders:

```
src/ui/
functions/_lib/
functions/api/
workers/export/
public/privacy/
public/research/
```

1.3 **Initialize Git**

```bash
git init
echo "node_modules\n.dist\ndist\n.dev.vars" >> .gitignore
git add -A
git commit -m "chore: scaffold simyou (vite+react+ts)"
```

1.4 **Create GitHub repo**

* On GitHub: New → **simyou** (Public or Private).
* Copy the repo URL, then:

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git branch -M main
git push -u origin main
```

1.5 **Add minimal scripts** (package.json)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "pages:dev": "wrangler pages dev",
    "worker:dev": "wrangler dev workers/export/worker.ts"
  }
}
```

---

## 2) Add core source files (minimal, compilable)

2.1 **`src/state/local.ts`** (guest session + localStorage helpers)

```ts
export const SESSION_KEY = 'simyou.session_id';
export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(SESSION_KEY, id); }
  return id;
}
export function getOptOut(): boolean {
  return localStorage.getItem('simyou.opt_out') === '1';
}
```

2.2 **`functions/types.d.ts`** (shared contracts)

```ts
export type SnapshotV1 = { v:1; game_v:string; seed:number; initial_state?:unknown; actions:Array<{t:number;a:string;[k:string]:number|string|boolean}>; result?:{win?:boolean;score?:number} };
export type BattleRequest = { game_slug:string; stage_band:number; last_outcome:'W'|'L'|'N'; run_step?:number; client_build:string; opt_out?:boolean; player_setup:{ seed:number; board:number[]; shop_rolls?:number[]; } };
export type ReplayV1 = { v:1; game_v:string; initial:{player:number[];ghost:number[]}; events:Array<any> };
export type BattleResponse = { ok:true; result:{win:boolean;score?:number;turns?:number}; ghost_hash:string; replay_id:string; replay:ReplayV1 } | { ok:false; error:string };
```

2.3 **`functions/_lib/security.ts`**

```ts
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
export function withCORS(origin?:string) {
  return { 'Access-Control-Allow-Origin': origin || '*', Vary: 'Origin' } as Record<string,string>;
}
export async function hmacSession(sessionId:string, secret:string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sessionId + '|v1'));
  return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
```

2.4 **`functions/_lib/sim.ts`** (stub)

```ts
import type { BattleRequest, ReplayV1 } from '../types';
import type { SnapshotV1 } from '../types';
export async function runServerSim(req: BattleRequest, ghost:{hash:string; snapshot: SnapshotV1}) {
  const replay: ReplayV1 = { v:1, game_v:req.client_build, initial:{ player:req.player_setup.board, ghost:[0,0,0] }, events:[ {t:0,e:'spawn',side:'P',slot:0,unit:req.player_setup.board[0]??0}, {t:2,e:'win',side:'P'} ] } as any;
  const result = { win:true, score:5, turns:req.run_step ?? 0 };
  const playerSnapshot: SnapshotV1 = { v:1, game_v:req.client_build, seed:req.player_setup.seed, actions:[], result };
  return { replay, result, playerSnapshot, ghostHash: ghost.hash };
}
```

2.5 **`functions/_lib/store.ts`** (stubs to compile)

```ts
import type { BattleRequest, SnapshotV1 } from '../types';
export async function sampleGhost(env:any, game:string, band:number, outcome:'W'|'L'|'N') {
  return { ghostHash: 'gh_' + band + outcome, snapshot: { v:1, game_v:'dev', seed:0, actions:[] } } as any;
}
export async function saveSnapshotAndMeta(env:any, req:BattleRequest, snapshot:SnapshotV1, sessionId:string) {
  return { playerHash: 'phash_dev' };
}
export async function saveReplay(env:any, game:string, playerHash:string, ghostHash:string, replay:any, result:any) {
  return 'rpl_dev';
}
```

2.6 **`functions/api/session.ts`**

```ts
import { hmacSession, securityHeaders, withCORS } from '../_lib/security';
export const onRequestGet: PagesFunction<{ SESSION_SECRET:string; ALLOWED_ORIGIN?:string }> = async ({ request, env }) => {
  const origin = request.headers.get('origin') ?? env.ALLOWED_ORIGIN ?? '*';
  const headers = { 'Content-Type':'application/json', ...securityHeaders, ...withCORS(origin) };
  const session = (request.headers.get('x-simyou-session') ?? '').trim();
  if (!session) return new Response(JSON.stringify({ ok:false, error:'missing session' }), { status:400, headers });
  const token = await hmacSession(session, env.SESSION_SECRET);
  return new Response(JSON.stringify({ ok:true, token, exp_s:900 }), { headers });
};
```

2.7 **`functions/api/battle.ts`**

```ts
import type { BattleRequest, BattleResponse } from '../types';
import { securityHeaders, withCORS, hmacSession } from '../_lib/security';
import { sampleGhost, saveSnapshotAndMeta, saveReplay } from '../_lib/store';
import { runServerSim } from '../_lib/sim';
export const onRequestPost: PagesFunction<{ DB:D1Database; SNAPSHOTS:R2Bucket; SIMYOU_CACHE:KVNamespace; SESSION_SECRET:string; ALLOWED_ORIGIN?:string }> = async ({ request, env }) => {
  const origin = request.headers.get('origin') ?? env.ALLOWED_ORIGIN ?? '*';
  const headers = { 'Content-Type':'application/json', ...securityHeaders, ...withCORS(origin) };
  try {
    const body = await request.json() as BattleRequest;
    if (!body?.game_slug || !body?.player_setup) return new Response(JSON.stringify({ ok:false, error:'bad payload' }), { status:400, headers });
    if (JSON.stringify(body).length > 64 * 1024) return new Response(JSON.stringify({ ok:false, error:'payload too large' }), { status:413, headers });
    const session = (request.headers.get('x-simyou-session') ?? '').trim();
    const token = (request.headers.get('x-simyou-session-token') ?? '').trim();
    if (!session || !token) return new Response(JSON.stringify({ ok:false, error:'missing session' }), { status:401, headers });
    const expected = await hmacSession(session, env.SESSION_SECRET);
    if (expected !== token) return new Response(JSON.stringify({ ok:false, error:'invalid session' }), { status:401, headers });
    const ghost = await sampleGhost(env, body.game_slug, body.stage_band, body.last_outcome);
    const simOut = await runServerSim(body, ghost);
    const { playerHash } = await saveSnapshotAndMeta(env, body, simOut.playerSnapshot, session);
    const replayId = await saveReplay(env, body.game_slug, playerHash, simOut.ghostHash, simOut.replay, simOut.result);
    const resp: BattleResponse = { ok:true, result: simOut.result, ghost_hash: simOut.ghostHash, replay_id: replayId, replay: simOut.replay };
    return new Response(JSON.stringify(resp), { headers });
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error: e?.message || 'error' }), { status:500, headers });
  }
};
```

2.8 **Minimal UI hook** (optional now): later you’ll add a simple page that calls `/api/session` and `/api/battle`.

Commit your work:

```bash
git add -A
git commit -m "feat: pages functions stubs (session/battle)"
git push
```

---

## 3) Cloudflare resources (create once)

> Use the Dashboard for reliable IDs; the CLI alternative is optional later.

3.1 **R2**: Dashboard → **R2** → *Create bucket* → `simyou-snapshots`

3.2 **KV**: Dashboard → **Workers & Pages → KV** → *Create namespace* → `SIMYOU_CACHE`

3.3 **D1**: Dashboard → **Workers & Pages → D1** → *Create database* → `SIMYOU`

3.4 **Apply schema**: Open the `SIMYOU` DB → **Query** → paste the SQL (see §7) → **Run**. Confirm tables created.

---

## 4) Connect Cloudflare Pages to your repo

4.1 **Create Pages project**: Dashboard → **Pages → Create project → Connect to Git** → select the `simyou` repo.

4.2 **Build settings**:

* **Framework preset**: Vite (or None)
* **Build command**: `npm run build`
* **Output directory**: `dist`
* **Functions directory**: `functions`

4.3 **Bindings (Pages → Settings → Functions → Bindings)**

* D1: bind as `DB` → choose `SIMYOU`
* KV: bind as `SIMYOU_CACHE`
* R2: bind as `SNAPSHOTS` → choose `simyou-snapshots`

4.4 **Environment variables & secrets**

* Variables (plain): `ALLOWED_ORIGIN = https://simyou.ai`
* Secrets: `SESSION_SECRET = <random-long-string>`

4.5 **Custom domain**: Pages → **Custom domains** → add `simyou.ai` (optional now).

---

## 5) Local development (Pages Functions)

5.1 **Create `.dev.vars`** (root)

```
SESSION_SECRET="dev-secret-change-me"
ALLOWED_ORIGIN="http://localhost:5173"
```

5.2 **`wrangler.toml` (root)** — keeps local bindings aligned

```toml
name = "simyou"
compatibility_date = "2024-09-03"

# Local bindings for Pages dev (used by `wrangler pages dev`)
[[d1_databases]]
binding = "DB"
database_name = "SIMYOU"
database_id = "<copy-from-dashboard>"

[[kv_namespaces]]
binding = "SIMYOU_CACHE"
id = "<copy-from-dashboard>"

[[r2_buckets]]
binding = "SNAPSHOTS"
bucket_name = "simyou-snapshots"
```

5.3 **Run local dev**
Open two terminals:

```bash
# 1) Vite frontend
npm run dev

# 2) Pages Functions (serves /functions and proxies static if built)
npm run pages:dev
```

Tip: If `pages dev` can’t find `dist/`, it still serves Functions on `http://127.0.0.1:8788` (adjust as printed).

---

## 6) Smoke tests (manual)

Assume your local Vite runs at `http://localhost:5173` and Pages Functions at `http://127.0.0.1:8788`.

6.1 **Mint session token**

```bash
SESSION=$(uuidgen)
curl -i "http://127.0.0.1:8788/api/session" \
  -H "x-simyou-session: $SESSION"
```

Expect `{"ok":true, "token":"...", "exp_s":900}`.

6.2 **Battle (stub)**

```bash
TOKEN=$(curl -s "http://127.0.0.1:8788/api/session" -H "x-simyou-session: $SESSION" | jq -r .token)
curl -i "http://127.0.0.1:8788/api/battle" \
  -H "content-type: application/json" \
  -H "x-simyou-session: $SESSION" \
  -H "x-simyou-session-token: $TOKEN" \
  --data '{
    "game_slug":"sap-remake",
    "stage_band":1,
    "last_outcome":"N",
    "client_build":"2025.09.01",
    "player_setup":{"seed":123,"board":[1,2,3]}
  }'
```

Expect `{ ok:true, result:..., replay:... }` from the stub.

---

## 7) D1 schema (`schema.sql` you can keep in repo)

```sql
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_public INTEGER DEFAULT 1,
  build_tag TEXT
);

CREATE TABLE IF NOT EXISTS snapshots_meta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_slug TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  stage_band INTEGER NOT NULL,
  last_outcome TEXT NOT NULL CHECK (last_outcome IN ('W','L','N')),
  run_step INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'human' CHECK (source IN ('human','bot')),
  release_ok INTEGER NOT NULL DEFAULT 1,
  client_build TEXT,
  session_hmac TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_snap_band
  ON snapshots_meta (game_slug, stage_band, last_outcome, created_at DESC);

CREATE TABLE IF NOT EXISTS leaderboards_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_slug TEXT NOT NULL,
  day TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS replays (
  id TEXT PRIMARY KEY,
  game_slug TEXT NOT NULL,
  player_hash TEXT NOT NULL,
  ghost_hash TEXT NOT NULL,
  result_win INTEGER NOT NULL,
  turns INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);
```

> **CLI alternative** later: once `[[d1_databases]]` is configured in `wrangler.toml`, you can run `wrangler d1 execute SIMYOU --file schema.sql --remote`.

---

## 8) Implement real storage + sim (when ready)

Replace stubs in `functions/_lib/store.ts` and `functions/_lib/sim.ts` with real logic:

* `sampleGhost(...)`: pull recent hashes from KV, fall back to D1, fetch snapshot blobs from R2.
* `saveSnapshotAndMeta(...)`: canonicalize JSON, sha256 → hash, `R2.put` blob, insert D1 row, update KV head.
* `saveReplay(...)`: `R2.put` replay JSON (optional), insert D1 `replays` row.
* `runServerSim(...)`: deterministic server sim → `ReplayV1` events + `result`.

Commit in small slices; re‑run smoke tests after each slice.

---

## 9) First deploy (Pages)

9.1 **Push to GitHub** (if you added changes locally)

```bash
git add -A
git commit -m "feat: minimal api + config"
git push
```

9.2 **Pages** will build & deploy automatically on push. Check **Deployments** tab.

9.3 **Verify prod**

* Open your Pages preview/prod URL.
* Repeat §6 smoke tests against `https://<your-pages-domain>/api/...`.

---

## 10) Export Worker (cron)

10.1 **Create Worker**: Dashboard → **Workers & Pages → Create Worker** → `simyou-export`.

10.2 **Bindings** (Worker → Settings → Variables → Bindings)

* D1 database: bind as `DB` → `SIMYOU`
* R2 bucket: bind as `SNAPSHOTS` → `simyou-snapshots`

  * (Write to a public prefix like `public-dataset/`.)

10.3 **Cron**: Worker → **Triggers → Cron Triggers** → add `0 2 * * *`

10.4 **Paste code** into `workers/export/worker.ts` (use your spec: read yesterday’s rows, write JSONL shards, manifest). Deploy.

---

## 11) Frontend hook‑up (minimal UI to test end‑to‑end)

Add a tiny button that:

1. Ensures a session id (localStorage)
2. Calls `/api/session` to get a token
3. Posts to `/api/battle`
4. Prints the replay JSON to screen (temporary)

Commit & push → verify in prod.

---

## 12) Security & privacy defaults (enable early)

* Keep **guest‑only**; do not collect PII.
* Respect **opt‑out**: include `opt_out` flag in `BattleRequest` and write `release_ok=0`.
* Apply **rate limiting** in Cloudflare Rules keyed by `session_hmac` and coarse IP.
* Consider **Turnstile** only if abuse spikes.

---

## 13) Done‑when (acceptance checklist)

* [ ] `/api/session` works locally and in prod (CORS OK).
* [ ] `/api/battle` validates, caps payload at 64 KB, and returns a deterministic `ReplayV1`.
* [ ] D1 shows rows in `snapshots_meta`; KV contains recent pools; R2 has snapshot blobs.
* [ ] (Optional) `/api/replay/:id` returns stored replays.
* [ ] Export Worker populates `public-dataset/v1/game=<slug>/date=YYYY-MM-DD/*.jsonl.gz`.
* [ ] `/privacy` and `/research` routes render.

---

## 14) Troubleshooting quickies

* **CORS 401/403**: Ensure `ALLOWED_ORIGIN` in prod matches your site; for local dev use `http://localhost:5173`.
* **D1 errors**: Re‑run §7 schema; check you bound the right DB as `DB`.
* **KV empty pool**: Seed KV by querying D1 when cold; ensure writes to KV on each snapshot save.
* **R2 permissions**: Ensure the Pages project has the R2 binding and bucket name correct.
* **Large payload 413**: Confirm the 64 KB check runs before heavy work.

---

## Appendix: optional files

**`public/privacy/index.html`**

```html
<!doctype html><meta charset="utf-8"><title>Privacy</title>
<h1>Privacy</h1><p>No accounts, no PII. Guest session only. Opt-out controls data export.</p>
```

**`public/research/index.html`**

```html
<!doctype html><meta charset="utf-8"><title>Research Dataset</title>
<h1>Open Data</h1><p>Daily JSONL shards in R2 under <code>public-dataset/</code>. Schema: SnapshotV1.</p>
```

**Minimal frontend call (snippet for later)**

```ts
import { getSessionId, getOptOut } from './state/local';
export async function doBattle() {
  const session = getSessionId();
  const tokRes = await fetch('/api/session', { headers: { 'x-simyou-session': session } }).then(r=>r.json());
  const token = tokRes.token;
  const body = { game_slug:'sap-remake', stage_band:1, last_outcome:'N', client_build:'2025.09.01', opt_out:getOptOut(), player_setup:{ seed:42, board:[1,2,3] } };
  const battle = await fetch('/api/battle', { method:'POST', headers:{ 'content-type':'application/json', 'x-simyou-session': session, 'x-simyou-session-token': token }, body: JSON.stringify(body) }).then(r=>r.json());
  console.log(battle);
}
```

---

### You’re now unblocked

* The **Git/GitHub gap is fixed** (repo is created and pushed before Pages connect).
* You can compile, run locally, smoke test, and deploy.
* Next high‑leverage work: fill `store.ts`, real `sim.ts`, add `ReplayPlayer` UI, then turn on the export Worker.