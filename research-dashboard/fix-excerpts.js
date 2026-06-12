// Run once: node fix-excerpts.js
// For every import with zero excerpts, inserts raw_text as a single excerpt at position 0.

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'research.db'));

const imports = db.prepare('SELECT id, raw_text FROM imports').all();
const countExcerpts = db.prepare('SELECT COUNT(*) as c FROM excerpts WHERE import_id = ?');
const insertExcerpt = db.prepare('INSERT INTO excerpts (import_id, content, position) VALUES (?, ?, ?)');

let fixed = 0;
for (const imp of imports) {
  const { c } = countExcerpts.get(imp.id);
  if (c === 0) {
    insertExcerpt.run(imp.id, imp.raw_text, 0);
    fixed++;
  }
}

console.log(`Fixed ${fixed} import(s) — inserted raw_text as excerpt at position 0.`);
