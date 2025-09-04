# SimYou.ai — Game Design Document (GDD)

> **Vision:** A fast-moving hub of tiny, smart, **async** web games where players’ runs become content for others. No logins, no PII, no paywalls. Server decides outcomes; the client just plays the build phase and **replays** the battle the server returns. Gameplay data—carefully anonymized—is released openly for research.

---

## 1) Creative Pillars

1. **Play in seconds** — zero friction. Guest-only, one-click play, short runs (2–5 minutes).
2. **Players generate content** — every run becomes a “ghost” for future opponents or allies.
3. **Simple to learn, deep to master** — SAP-style banded matchmaking, tiny decision spaces, emergent depth.
4. **Transparent by default** — privacy-first, open dataset, clear disclosures.
5. **Ship small, iterate daily** — new tweaks and microgames arrive fast; live tuning via server-side knobs.

---

## 2) Target Audience & Platforms

* **Audience:** Casual-to-core strategy players who enjoy auto-battlers, deckbuilders, and puzzle roguelites; devs/researchers curious about open gameplay datasets.
* **Platform:** Modern desktop & mobile browsers (no install).
* **Session length:** 2–5 minutes; designed to fit coffee breaks.

---

## 3) Core Concept & Loops

### 3.1 The Hub (SimYou)

* A single landing page listing available games.
* Prominent centered brand image + tagline. Subtle animated starfield background with reduced‑motion fallback and a gentle lunar glow on the logo.
* **Research**, **Privacy**, and **API** links persistently visible.

### 3.2 Per-Game Loop (authoritative server)

1. **Build Phase (client):**
   Draft/purchase/place units or cards; make deterministic choices (seeded shop rolls, positions).
2. **Battle Request (client → server):**
   Send *player setup* + *band/step info*. No personal identifiers.
3. **Server Sim (authoritative):**
   Server selects an appropriate **ghost** (another player’s recorded setup) using banded matchmaking; runs the battle; produces a **replay log** + result.
4. **Replay & Result (server → client):**
   Client animates the replay events; shows win/loss, lightweight stats.
5. **Ghosting:**
   The player’s **setup snapshot** (not the replay) is stored for future opponents.

### 3.3 Cross-Game Loop

* No accounts, no meta-progression.
* Optional **daily challenges** (purely cosmetic labels rendered locally) and **streaks** persisted to localStorage.

---

## 4) Matchmaking Design (Bands, not ELO)

* **Stage Bands:** Each game defines bands that represent run stage (e.g., turns 1–3 = Band 1, 4–6 = Band 2, etc.).
* **Outcome Flavor:** Keep track of prior result `W/L/N` to bias pairing.
* **Soft Pooling:** Prefer `(band, same outcome)`, but blend in `(band, N)`, `(band-1, W)`, `(band+1, L)` if the pool is thin.
* **Freshness:** Prefer snapshots from the last 48–72 hours; older ones become “boss ghosts”.

**Design Aim:** Matches feel fair and lively without heavy balance patches.

---

## 5) Simulation & Replay

* **Server-authoritative:** All combat/battle resolution happens on the server (prevents cheating, removes cross-browser determinism issues).
* **Determinism on server:** Integer/fixed-point arithmetic; seeded RNG; fixed timestep; stable ordering.
* **Replay Log (conceptual):**

  * `initial`: compact board states for Player/Ghost using indices/enums (no free text).
  * `events[]`: timestamped, discrete events (`spawn`, `attack`, `damage`, `death`, `status`, `win`).
  * `result`: `win/loss`, score, turns.

**Client Animation:** Maps event types to animations; never recomputes outcomes.

---

## 6) Games in the Hub (MVP & beyond)

### 6.1 Launch Games (MVP)

* **Troop Commander:** Grow and draft troops to break through enemy tower defenses.
* **Tower Forge:** Build and draft towers to withstand incoming troop offense.
* **Troops & Towers:** Draft both troops and towers and race other players.

### 6.2 Next Games (2–6 weeks)

* **Path Scout:** Puzzle roguelite where ghosts reveal traps they hit (async co-op flavor).
* **Deck Duel (Snapshot):** Oppose a recorded deck + scripted line of play; player gets one hint per turn.
* **Critters:** SAP-style monster battler.

**Content Cadence:** Tiny balance patches and 1–2 new units/mechanics weekly to keep discovery alive.

---

## 7) Difficulty & Balance Philosophy

* **Player-tilt knobs:** Live player gets micro-advantages (1–2 extra re-rolls, 1 undo, a hint).
* **Data-driven passes:** Weekly review of win rates by **band** and **age of ghost**; tweak serverside knobs without client updates.
* **“Boss ghosts”**: Age out overpowered old snapshots into explicit boss encounters for spice.

---

## 8) UX, Onboarding & Accessibility

* **First-run tutorial:** One overlay panel explaining: build → battle → replay.
* **Keyboard/Touch:** Big tap targets; hotkeys for re-roll (R), pause (P), help (?).
* **Accessibility:** High-contrast palette, color-blind friendly symbols on units/effects, reduced motion toggle.
* **Latency masking:** “Preparing battle…” shimmer while server sim runs (fast; most sims under a few ms).

---

## 9) Open Data & Player Trust

* **Disclosure bar (always-on):** “We log anonymized gameplay decisions to power async ghosts and research. No accounts, no PII.”
* **Opt-out of research exports:** Toggle in a tiny Settings panel (gameplay still works; their runs won’t enter the public dataset).
* **Dataset:** Daily **JSONL** shards (and later **Parquet**) with:
  `game_slug, stage_band, last_outcome, run_step, client_build, created_at(rounded), snapshot{v,game_v,seed,actions,initial_state?,result}`
  *No IPs, no user agents, no exact timestamps, no session IDs.*
* **License:** CC BY 4.0.
* **Where:** Public R2 prefix and/or mirrored to Hugging Face Datasets.
* **Differential Privacy:** Apply only to *published aggregates* (e.g., players per band), not to raw snapshots.

---

## 10) Safety, Fairness & Integrity

* **Server decides outcomes** (authoritative).
* **Validation at submit:**

  * Schema & size caps (e.g., 64 KB).
  * Version gates (`v`, `game_v`).
  * Band sanity thresholds (quick cheatscreen).
  * Rate limiting (per-session HMAC + coarse IP).
  * Turnstile on “Battle” if abuse appears.
* **Session Security:** Client holds a random `session_id` (localStorage). Server issues a short-lived HMAC token for submitting requests (prevents blind replays).
* **Legal docs:** Clear Privacy Policy, Terms of Service. Age gate (13+).

---

## 11) Visual & Audio Direction

* **Style:** Clean, readable, “playful minimalism.” Hero gradient type and soft glass cards.
* **Unit iconography:** Flat-color silhouettes + distinct shapes for readability.
* **SFX:** Light, tactile clicks & pops; optional mute; “win/loss” stingers.
* **Motion:** Snappy, short animations keyed to replay events; “reduced motion” preference honored. Logo glow is subtle and respects reduced motion.

---

## 12) Live Ops

* **Daily taglines:** e.g., “Critter of the Day” (spawns 10% more often).
* **Weekly rotation:** Introduce 1–2 new effects or shop tweaks.
* **Leaderboards (optional early):** Daily “most wins in 10 runs” table (no PII; display hashed session prefix for fun).

---

## 13) Success Metrics

* **Time-to-first-battle:** < 15 seconds from landing.
* **Day-1 retention:** 20–30% target (casual web baseline).
* **Avg session length:** 8–12 minutes (multiple quick runs).
* **Ghost freshness:** ≥ 80% of matches against snapshots < 72h old.
* **Open-data adoption:** ≥ 5 external forks/notebooks in month 1.

---

## 14) Content & Systems Scope (MVP)

* **One game** (Auto Critters), 12–16 units, 6–8 simple effects.
* **Bands:** 4–6 brackets by turn.
* **Replay event set:** spawn, move, attack, damage, death, status, win/loss.
* **Hub:** Trending, Game cards, Privacy/Research pages.
* **Open Data:** Daily JSONL export (CC BY 4.0), API page.
* **Safety:** Size caps, version gate, rate limiting; Turnstile toggleable.

---

## 15) Risks & Mitigations

* **Cheating/data pollution** → Server sim; sanity caps; rate limits; Turnstile; later: re-sim audit of suspicious runs.
* **Sparse pools** → Soft pooling across adjacent bands/outcomes; “boss ghosts” for spice.
* **Balance spikes** → Player-tilt knobs; weekly tuning from telemetry.
* **Legal/privacy** → No PII, opt-out, rounded timestamps, public docs.
* **Cost spikes** → Bounded blob sizes; nightly batch exports; CDN caching of ghost lists.

---

## 16) Light Tech Overview (for context)

* **Front-end:** Vite (React/TS) + PixiJS per game; guest-only; `localStorage` for session/save/opt-out.
* **Back-end:** Cloudflare Pages Functions/Workers; **D1** for metadata; **R2** for blobs; **KV** for hot indices; server-sim module per game.
* **APIs:**

  * `/api/session` → short-lived session token
  * `/api/battle` → select ghost → simulate → store snapshot → return replay+result
  * `/api/replay/:id` → get replay (optional)
* **Data export:** Nightly Worker writes JSONL shards to public R2 (optional Parquet).

*(You can later add Supabase Postgres for richer analytics without changing the player-facing product.)*

---

## 17) First-90-Day Roadmap (dates relative to today)

* **Week 1–2 (Sep 2–Sep 15, 2025):**
  Hub MVP (guest-only), banded ghost selection, server-sim for Auto Critters, replay renderer, safety basics, Privacy/Research pages.
* **Week 3–4 (Sep 16–Sep 29):**
  Balance knobs, soft pooling, daily export job + dataset page, basic daily challenge, simple leaderboard (optional).
* **Week 5–6 (Sep 30–Oct 13):**
  New units/effects; Path Scout prototype; Turnstile + stricter rate limits if needed; public dev notes & dataset v1 “release”.
* **Beyond:**
  Second full game; re-sim audit pipeline; optional paid bot API (kept separate from human queue).

---

## 18) Glossary

* **Ghost:** A playable snapshot of another player’s **setup** (not their replay), used by the server as the opponent.
* **Band:** A bracket reflecting the stage of a run (e.g., early/mid/late turns).
* **Replay:** A server-produced list of discrete events clients animate; outcomes are predetermined by the server sim.
* **Snapshot (setup):** Seed + player decisions needed to reconstruct their board for matchmaking.

---

### One-liner to remember

**SimYou** = *“tiny async games, server decides, players create the content, and the data helps everyone.”*

---

## Appendix A) Current State vs Plan (Sep 2025)

- Hub UI with centered hero, logo image (transparent PNG) with soft glow, animated starfield (deep purple gradient, multi‑hue stars), styled game cards; links to `/privacy` and `/research` (matching theme).
- API endpoints implemented as stubs:
  - `/api/session` issues HMAC token for a provided session id.
  - `/api/battle` validates headers/payload, runs a deterministic stub sim, and returns a replay/result.
- CORS supports multiple allowed origins via comma-separated `ALLOWED_ORIGIN`. OPTIONS preflights return 204.
- Storage is stubbed: `_lib/store.ts` does not yet write to D1/KV/R2.
- Export worker not yet implemented.
- Build & local dev flow uses: `npm run build` then `npx wrangler pages dev dist`. Smoke tests are console-only (no in-UI buttons).

What’s next (short): implement real storage in `_lib/store.ts`, wire sim logic, optional `/api/replay/:id`, then export Worker and daily cron.