# SimYou

Tiny async games. Server decides; players create the content. Guest-only; no PII.

## Quickstart

Prereqs: Node 20+, npm, Wrangler.

```bash
npm i
npm run build
# Serve Pages Functions + static output
npx wrangler pages dev dist
```

## Environment (local)
Create `.dev.vars` in project root:
```
SESSION_SECRET="dev-secret-change-me"
ALLOWED_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"
```
- `ALLOWED_ORIGIN` supports a comma-separated list of allowed origins.

## Build & Deploy (Cloudflare Pages)
- Build command: `npm run build`
- Output dir: `dist`
- Functions dir: `functions`
- Bindings: `DB`, `SIMYOU_CACHE`, `SNAPSHOTS`
- Env Vars: `ALLOWED_ORIGIN` (comma-separated), Secret: `SESSION_SECRET`

## Schema (D1)
- Schema lives in `schema.sql`
- Apply via Dashboard → D1 → Query, or CLI:
```bash
wrangler d1 execute SIMYOU --file schema.sql --remote
```

## APIs (stubbed)
- `GET /api/session` → returns short-lived HMAC token for the provided session id
- `POST /api/battle` → validates payload/session, runs deterministic stub sim, returns replay+result
- OPTIONS preflights return 204 with CORS headers

See `API_REFERENCE.md` for request/response types.

## Hub UI & Smoke Test
- The hub (`src/App.tsx`) lists games with “Coming soon” buttons.
- A "Run API smoke test" button calls `/api/session` then `/api/battle` and prints the JSON result.
- CLI smoke test (alternative):
```bash
SESSION=$(uuidgen)
TOKEN=$(curl -s "http://127.0.0.1:8788/api/session" -H "x-simyou-session: $SESSION" | jq -r .token)
curl -i "http://127.0.0.1:8788/api/battle" \
  -H "content-type: application/json" \
  -H "x-simyou-session: $SESSION" \
  -H "x-simyou-session-token: $TOKEN" \
  --data '{
    "game_slug":"sap-remake",
    "stage_band":1,
    "last_outcome":"N",
    "client_build":"dev",
    "player_setup":{"seed":42,"board":[1,2,3]}
  }'
```

## Next Steps
- Implement real storage in `functions/_lib/store.ts` (D1/KV/R2)
- Replace `functions/_lib/sim.ts` with game logic
- (Optional) `/api/replay/:id`
- Export worker + daily cron (write JSONL to R2)
