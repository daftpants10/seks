// Run once from research-dashboard/: node restore-updates.js
// Restores published updates from ../research/updates.json into the updates table.

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const db = new DatabaseSync(path.join(__dirname, 'research.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    published_at TEXT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    images TEXT DEFAULT '[]',
    post_date TEXT,
    project TEXT DEFAULT 'stick'
  );
`);
try { db.exec(`ALTER TABLE updates ADD COLUMN post_date TEXT`); } catch (e) {}
try { db.exec(`ALTER TABLE updates ADD COLUMN project TEXT DEFAULT 'stick'`); } catch (e) {}

const jsonPath = path.join(__dirname, '..', 'research', 'updates.json');
const entries = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const insert = db.prepare(
  `INSERT INTO updates (created_at, published_at, title, body, tags, images, post_date, project)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);

let count = 0;
for (const u of entries) {
  insert.run(
    u.date || new Date().toISOString(),
    u.date || new Date().toISOString(),
    u.title,
    u.body,
    JSON.stringify(u.tags || []),
    JSON.stringify(u.images || []),
    u.date || null,
    u.project || 'stick'
  );
  count++;
}

console.log(`Restored ${count} published updates.`);
