require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./db');
const { parseChat } = require('./parser');
const { publish } = require('./publisher');

const IMAGES_DIR = path.join(__dirname, '..', 'research', 'images');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: IMAGES_DIR,
    filename: (req, file, cb) => cb(null, file.originalname)
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── IMPORTS ──────────────────────────────────────────────────────────────────

// POST /api/imports — parse and save
app.post('/api/imports', (req, res) => {
  const { text, title, chatDate, project } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  const { excerpts, suggestedTags } = parseChat(text);
  const now = new Date().toISOString();

  const insert = db.prepare(
    'INSERT INTO imports (imported_at, chat_date, raw_text, title, tags, project) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const info = insert.run(now, chatDate || null, text, title || null, JSON.stringify([]), project || 'stick');
  const importId = Number(info.lastInsertRowid);

  const insertExcerpt = db.prepare(
    'INSERT INTO excerpts (import_id, content, position) VALUES (?, ?, ?)'
  );
  excerpts.forEach((content, i) => insertExcerpt.run(importId, content, i));

  res.json({ id: importId, excerpts, suggestedTags });
});

// GET /api/imports — list all
app.get('/api/imports', (req, res) => {
  const rows = db.prepare(
    'SELECT id, title, chat_date, tags, imported_at, project FROM imports ORDER BY imported_at DESC'
  ).all();
  // Include excerpt count
  const withCounts = rows.map(r => {
    const count = db.prepare('SELECT COUNT(*) as c FROM excerpts WHERE import_id = ?').get(r.id);
    return { ...r, tags: JSON.parse(r.tags || '[]'), excerptCount: count.c };
  });
  res.json(withCounts);
});

// GET /api/imports/:id — one import with excerpts
app.get('/api/imports/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM imports WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const excerpts = db.prepare(
    'SELECT * FROM excerpts WHERE import_id = ? ORDER BY position'
  ).all(req.params.id);
  res.json({ ...row, tags: JSON.parse(row.tags || '[]'), excerpts });
});

// PATCH /api/imports/:id — update tags, title, or project
app.patch('/api/imports/:id', (req, res) => {
  const { tags, title, project } = req.body;
  const row = db.prepare('SELECT * FROM imports WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  const newTags = tags !== undefined ? JSON.stringify(tags) : row.tags;
  const newTitle = title !== undefined ? title : row.title;
  const newProject = project !== undefined ? project : row.project;

  db.prepare('UPDATE imports SET tags = ?, title = ?, project = ? WHERE id = ?')
    .run(newTags, newTitle, newProject, req.params.id);
  res.json({ success: true });
});

// ── UPDATES ───────────────────────────────────────────────────────────────────

// GET /api/updates — list all
app.get('/api/updates', (req, res) => {
  const rows = db.prepare('SELECT * FROM updates ORDER BY created_at DESC').all();
  res.json(rows.map(r => ({
    ...r,
    tags: JSON.parse(r.tags || '[]'),
    images: JSON.parse(r.images || '[]')
  })));
});

// POST /api/updates — create draft
app.post('/api/updates', (req, res) => {
  const { title, body, tags, images, project } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  const now = new Date().toISOString();
  const info = db.prepare(
    'INSERT INTO updates (created_at, title, body, tags, images, project) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(now, title, body, JSON.stringify(tags || []), JSON.stringify(images || []), project || 'stick');
  res.json({ id: Number(info.lastInsertRowid) });
});

// PATCH /api/updates/:id — edit draft
app.patch('/api/updates/:id', (req, res) => {
  const { title, body, tags, images, post_date, project } = req.body;
  const row = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  const newTitle = title !== undefined ? title : row.title;
  const newBody = body !== undefined ? body : row.body;
  const newTags = tags !== undefined ? JSON.stringify(tags) : row.tags;
  const newImages = images !== undefined ? JSON.stringify(images) : row.images;
  const newPostDate = post_date !== undefined ? (post_date || null) : row.post_date;
  const newProject = project !== undefined ? project : row.project;

  db.prepare('UPDATE updates SET title = ?, body = ?, tags = ?, images = ?, post_date = ?, project = ? WHERE id = ?')
    .run(newTitle, newBody, newTags, newImages, newPostDate, newProject, req.params.id);
  res.json({ success: true });
});

// POST /api/updates/:id/publish
app.post('/api/updates/:id/publish', (req, res) => {
  const row = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  const now = new Date().toISOString();
  db.prepare('UPDATE updates SET published_at = ? WHERE id = ?').run(now, req.params.id);

  const result = publish(db, req.params.id);
  if (!result.success) {
    // Rollback published_at
    db.prepare('UPDATE updates SET published_at = NULL WHERE id = ?').run(req.params.id);
    return res.status(500).json({ error: result.error });
  }
  res.json({ success: true, publishedAt: now });
});

// DELETE /api/updates/:id
app.delete('/api/updates/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.published_at) return res.status(400).json({ error: 'Cannot delete published update' });
  db.prepare('DELETE FROM updates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── TIMELINE ──────────────────────────────────────────────────────────────────

app.get('/api/timeline', (req, res) => {
  const rows = db.prepare(
    'SELECT id, title, chat_date, imported_at, tags FROM imports ORDER BY COALESCE(chat_date, imported_at) DESC'
  ).all();

  const weeks = {};
  rows.forEach(r => {
    const dateStr = r.chat_date || r.imported_at.slice(0, 10);
    const d = new Date(dateStr);
    // Get the Monday of that week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const weekKey = monday.toISOString().slice(0, 10);

    if (!weeks[weekKey]) weeks[weekKey] = [];
    const excerptCount = db.prepare('SELECT COUNT(*) as c FROM excerpts WHERE import_id = ?').get(r.id);
    weeks[weekKey].push({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      excerptCount: excerptCount.c
    });
  });

  // Convert to sorted array
  const sorted = Object.entries(weeks)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([weekStart, imports]) => ({ weekStart, imports }));

  res.json(sorted);
});

// ── GENERATE DRAFT ────────────────────────────────────────────────────────────

app.post('/api/generate-draft', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(400).json({ error: 'ANTHROPIC_API_KEY not set' });
  }

  const { importIds } = req.body;
  if (!Array.isArray(importIds) || importIds.length === 0) {
    return res.status(400).json({ error: 'importIds array is required' });
  }

  // Fetch imports and their excerpts
  const entries = importIds.map(id => {
    const imp = db.prepare('SELECT id, title, chat_date, raw_text, tags FROM imports WHERE id = ?').get(id);
    if (!imp) return null;
    const excerpts = db.prepare('SELECT content FROM excerpts WHERE import_id = ? ORDER BY position').all(id);
    return { ...imp, excerpts };
  }).filter(Boolean);

  if (entries.length === 0) {
    return res.status(404).json({ error: 'No valid imports found' });
  }

  // Build prompt
  const entriesText = entries.map(e => {
    const body = e.excerpts.length > 0
      ? e.excerpts.map(ex => ex.content).join('\n\n')
      : e.raw_text;
    const date = e.chat_date || e.imported_at || '';
    return `## ${e.title || '(untitled)'} (${date})\n${body}`;
  }).join('\n\n');

  const prompt = `You are helping a researcher share their progress with friends and family.
Write a short update (150-250 words) in first person, warm and accessible (no academic jargon),
synthesising the following research entries. Focus on the narrative arc: what changed, what was learned, what is next.
Start with a suggested title on the first line, then a blank line, then the body.

Style rules (follow these strictly):
- No em dashes. Use commas, colons, or full stops instead.
- No rhetorical negations of the form "not X, but Y" or "it is not about X". State things directly and positively.
- No hedging phrases like "much bigger", "everything changed", "turned into something".
- Write in plain, direct sentences. Say what happened and what it meant.

Entries:
${entriesText}`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text.trim();
    const lines = text.split('\n');
    const title = lines[0].trim().replace(/^#+\s*/, '');
    const body = lines.slice(lines[1] === '' ? 2 : 1).join('\n').trim();

    res.json({ title, body });
  } catch (e) {
    console.error('generate-draft error:', e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// ── IMAGES ────────────────────────────────────────────────────────────────────

app.post('/api/images/upload', upload.array('images', 10), (req, res) => {
  const files = req.files.map(f => f.originalname);
  res.json({ files });
});

app.get('/api/images', (req, res) => {
  const files = fs.existsSync(IMAGES_DIR)
    ? fs.readdirSync(IMAGES_DIR).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    : [];
  res.json({ files });
});

// Serve the images folder publicly
app.use('/research/images', express.static(IMAGES_DIR));

app.listen(PORT, () => {
  console.log(`Research dashboard running at http://localhost:${PORT}`);
});
