-- Cloudflare D1 migration: initialize schema

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  expires TEXT NOT NULL
);

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
  page_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Counters table
CREATE TABLE IF NOT EXISTS counters (
  counter_id TEXT PRIMARY KEY,
  count INTEGER NOT NULL
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  asset_id TEXT PRIMARY KEY,
  mime_type TEXT NOT NULL,
  updated_at TEXT DEFAULT NULL,
  size INTEGER NOT NULL,
  data BLOB NOT NULL
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  article_id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  teaser TEXT NOT NULL,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME,
  updated_at DATETIME
);
