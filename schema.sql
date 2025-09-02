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


