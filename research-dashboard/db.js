const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'research.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imported_at TEXT NOT NULL,
    chat_date TEXT,
    raw_text TEXT NOT NULL,
    title TEXT,
    tags TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS excerpts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_id INTEGER REFERENCES imports(id),
    content TEXT NOT NULL,
    position INTEGER
  );

  CREATE TABLE IF NOT EXISTS updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    published_at TEXT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    images TEXT DEFAULT '[]',
    post_date TEXT
  );
  -- migration: add post_date if it doesn't exist yet
  CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY);
`);

try {
  db.exec(`ALTER TABLE updates ADD COLUMN post_date TEXT`);
} catch (e) { /* column already exists */ }

module.exports = db;
