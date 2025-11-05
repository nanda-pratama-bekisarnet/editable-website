-- Drop existing tables if they exist
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS counters;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS articles;

-- Table to store session data
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  expires TEXT NOT NULL
);

-- Table to store page data
CREATE TABLE IF NOT EXISTS pages (
  page_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Table for counters (view counts, etc.)
CREATE TABLE IF NOT EXISTS counters (
  counter_id TEXT PRIMARY KEY,
  count INTEGER NOT NULL
);

-- Table to store assets like images, files, etc.
CREATE TABLE IF NOT EXISTS assets (
  asset_id TEXT PRIMARY KEY,
  mime_type TEXT NOT NULL,
  updated_at TEXT DEFAULT NULL,
  size INTEGER NOT NULL,
  data BLOB NOT NULL
);

-- Table for articles
CREATE TABLE IF NOT EXISTS articles (
  article_id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  teaser TEXT NOT NULL,
  content TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  published_at TEXT,
  updated_at TEXT
);
