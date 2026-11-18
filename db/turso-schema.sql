-- Turso / libSQL schema for Mr.Robot "Learn" corrections.
-- Run once per database:
--   turso db shell <your-db> < db/turso-schema.sql
-- or paste it in the Turso dashboard SQL console.

CREATE TABLE IF NOT EXISTS evolutions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT    NOT NULL,
  topic      TEXT    NOT NULL,
  topic_key  TEXT    NOT NULL,
  correction TEXT    NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (profile_id, topic_key)
);

CREATE INDEX IF NOT EXISTS evolutions_profile_updated
  ON evolutions (profile_id, updated_at DESC);
