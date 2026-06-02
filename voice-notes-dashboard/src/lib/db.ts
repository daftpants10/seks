import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'voice-notes.db');

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;
  _db = new DatabaseSync(DB_PATH);
  _db.exec('PRAGMA journal_mode = WAL');
  _db.exec('PRAGMA foreign_keys = ON');
  initSchema(_db);
  return _db;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_filename TEXT NOT NULL,
      ai_title TEXT,
      type TEXT CHECK(type IN ('spoken', 'reference', 'unprocessed')),
      transcript TEXT,
      rhymes TEXT,
      key_phrases TEXT,
      bpm REAL,
      file_path TEXT NOT NULL,
      duration_seconds REAL,
      created_at TEXT,
      processed_at TEXT,
      needs_cleanup INTEGER DEFAULT 0,
      status TEXT DEFAULT 'unprocessed'
    );

    CREATE TABLE IF NOT EXISTS weekend_contexts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT,
      venue TEXT,
      people TEXT,
      vibe TEXT,
      date_from TEXT,
      date_to TEXT,
      notes TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS note_contexts (
      note_id INTEGER REFERENCES notes(id),
      context_id INTEGER REFERENCES weekend_contexts(id),
      PRIMARY KEY (note_id, context_id)
    );
  `);
}

export interface Note {
  id: number;
  original_filename: string;
  ai_title: string | null;
  type: 'spoken' | 'reference' | 'unprocessed' | null;
  transcript: string | null;
  rhymes: string | null;
  key_phrases: string | null;
  bpm: number | null;
  file_path: string;
  duration_seconds: number | null;
  created_at: string | null;
  processed_at: string | null;
  needs_cleanup: number;
  status: string;
  contexts?: WeekendContext[];
}

export interface WeekendContext {
  id: number;
  city: string | null;
  venue: string | null;
  people: string | null;
  vibe: string | null;
  date_from: string | null;
  date_to: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface NoteWithContexts extends Note {
  context_cities: string;
  context_venues: string;
}

// Parse timestamp from filename like "20260602 155928-0939D473.m4a"
function parseDateFromFilename(filename: string): string | null {
  const m = filename.match(/^(\d{4})(\d{2})(\d{2})\s+(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`).toISOString();
}

export function insertNote(filePath: string): number {
  const db = getDb();
  const filename = path.basename(filePath);
  const fromFilename = parseDateFromFilename(filename);
  const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
  const createdAt = fromFilename ?? (stat ? stat.birthtime.toISOString() : new Date().toISOString());

  const stmt = db.prepare(`
    INSERT INTO notes (original_filename, file_path, created_at, status, type)
    VALUES (?, ?, ?, 'unprocessed', 'unprocessed')
  `);
  const result = stmt.run(filename, filePath, createdAt);
  return Number(result.lastInsertRowid);
}

export function updateNote(id: number, updates: Partial<Note>) {
  const db = getDb();
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  db.prepare(`UPDATE notes SET ${fields} WHERE id = ?`).run(...values);
}

export function getNoteById(id: number): Note | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;
}

export function getAllNotes(filters?: { type?: string; location?: string; status?: string }): NoteWithContexts[] {
  const db = getDb();
  let query = `
    SELECT n.*,
      GROUP_CONCAT(DISTINCT wc.city) as context_cities,
      GROUP_CONCAT(DISTINCT wc.venue) as context_venues
    FROM notes n
    LEFT JOIN note_contexts nc ON n.id = nc.note_id
    LEFT JOIN weekend_contexts wc ON nc.context_id = wc.id
  `;
  const conditions: string[] = [];
  const params: string[] = [];

  if (filters?.type && filters.type !== 'all') {
    conditions.push('n.type = ?');
    params.push(filters.type);
  }
  if (filters?.status && filters.status !== 'all') {
    conditions.push('n.status = ?');
    params.push(filters.status);
  }
  if (filters?.location) {
    conditions.push('wc.city LIKE ?');
    params.push(`%${filters.location}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' GROUP BY n.id ORDER BY n.created_at DESC';

  return db.prepare(query).all(...params) as NoteWithContexts[];
}

export function getAllContexts(): WeekendContext[] {
  const db = getDb();
  return db.prepare('SELECT * FROM weekend_contexts ORDER BY created_at DESC').all() as WeekendContext[];
}

export function insertContext(ctx: Omit<WeekendContext, 'id' | 'created_at'>): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO weekend_contexts (city, venue, people, vibe, date_from, date_to, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ctx.city, ctx.venue, ctx.people, ctx.vibe, ctx.date_from, ctx.date_to, ctx.notes, new Date().toISOString());
  return Number(result.lastInsertRowid);
}

export function linkNoteToContext(noteId: number, contextId: number) {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO note_contexts (note_id, context_id) VALUES (?, ?)').run(noteId, contextId);
}

export function linkNotesInDateRange(contextId: number, dateFrom: string, dateTo: string) {
  const db = getDb();
  const notes = db.prepare(`
    SELECT id FROM notes WHERE created_at >= ? AND created_at <= ?
  `).all(dateFrom, dateTo) as { id: number }[];

  const insert = db.prepare('INSERT OR IGNORE INTO note_contexts (note_id, context_id) VALUES (?, ?)');
  for (const row of notes) {
    insert.run(row.id, contextId);
  }
  return notes.length;
}

export function toggleCleanup(id: number): number {
  const db = getDb();
  const note = getNoteById(id);
  if (!note) return 0;
  const newVal = note.needs_cleanup ? 0 : 1;
  db.prepare('UPDATE notes SET needs_cleanup = ? WHERE id = ?').run(newVal, id);
  return newVal;
}
