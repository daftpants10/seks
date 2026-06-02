import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import type { Note } from './db';

const TOKEN_PATH = path.join(process.cwd(), 'google-token.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/google/callback'
  );
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function handleAuthCallback(code: string): Promise<void> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('Google OAuth token saved to', TOKEN_PATH);
}

export async function getAuthenticatedClient() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('Not authenticated. Visit /api/auth/google to authenticate.');
  }
  const oauth2Client = getOAuth2Client();
  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  oauth2Client.setCredentials(tokens);

  // Auto-refresh if needed
  oauth2Client.on('tokens', (newTokens) => {
    const updated = { ...tokens, ...newTokens };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(updated));
  });

  return oauth2Client;
}

const HEADERS = [
  'ID',
  'Original Filename',
  'AI Title',
  'Type',
  'Transcript',
  'Bars',
  'Rhymes',
  'Key Phrases',
  'Track ID',
  'BPM',
  'Date',
  'City',
  'Venue',
  'Status',
  'Needs Cleanup',
];

type NoteRow = Note & { context_cities?: string; context_venues?: string };

function noteToRow(note: NoteRow): string[] {
  let rhymes: string[] = [];
  let keyPhrases: string[] = [];
  try { rhymes = JSON.parse(note.rhymes || '[]'); } catch {}
  try { keyPhrases = JSON.parse(note.key_phrases || '[]'); } catch {}

  return [
    String(note.id),
    note.original_filename,
    note.ai_title || '',
    note.type || 'unprocessed',
    note.transcript || '',
    (note as any).bars || '',
    rhymes.join(' · '),
    keyPhrases.join(', '),
    (note as any).track_id || '',
    note.bpm ? String(note.bpm) : '',
    note.created_at || '',
    note.context_cities || '',
    note.context_venues || '',
    note.status,
    note.needs_cleanup ? 'yes' : 'no',
  ];
}

export async function exportToSheets(notes: (Note & { context_cities?: string })[]): Promise<string> {
  const auth = await getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });

  let spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!spreadsheetId) {
    // Create new spreadsheet
    const res = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: 'Voice Notes Dashboard' },
        sheets: [{ properties: { title: 'Notes' } }],
      },
    });
    spreadsheetId = res.data.spreadsheetId!;
    console.log('\n=== NEW SPREADSHEET CREATED ===');
    console.log('Spreadsheet ID:', spreadsheetId);
    console.log('Add this to your .env.local:');
    console.log(`GOOGLE_SPREADSHEET_ID=${spreadsheetId}`);
    console.log('================================\n');
  }

  const rows = [HEADERS, ...notes.map(noteToRow)];

  // Clear existing content and write fresh
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Notes!A:Z',
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Notes!A1',
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });

  // Bold the header row
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetId = spreadsheet.data.sheets?.[0].properties?.sheetId || 0;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        },
      ],
    },
  });

  // Also refresh rhymes + bars tabs
  await syncRhymesTab(notes as NoteRow[]);
  await syncBarsTab(notes as NoteRow[]);

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

async function ensureSheet(sheets: any, spreadsheetId: string, title: string): Promise<number> {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = spreadsheet.data.sheets?.find((s: any) => s.properties?.title === title);
  if (existing) return existing.properties.sheetId;
  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title } } }] },
  });
  return res.data.replies?.[0].addSheet?.properties?.sheetId ?? 0;
}

export async function syncRhymesTab(notes: NoteRow[]): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) return;
  try {
    const auth = await getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    await ensureSheet(sheets, spreadsheetId, 'Rhymes');

    const rows: string[][] = [['Rhyme / Scheme', 'From Note', 'Title', 'Date', 'City', 'Venue']];
    for (const note of notes) {
      let rhymes: string[] = [];
      try { rhymes = JSON.parse(note.rhymes || '[]'); } catch {}
      for (const rhyme of rhymes) {
        rows.push([
          rhyme,
          note.original_filename,
          note.ai_title || '',
          note.created_at || '',
          note.context_cities || '',
          note.context_venues || '',
        ]);
      }
    }

    await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Rhymes!A:Z' });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Rhymes!A1',
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    });
  } catch (err) {
    console.warn('[syncRhymesTab] failed:', err);
  }
}

export async function syncBarsTab(notes: NoteRow[]): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) return;
  try {
    const auth = await getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    await ensureSheet(sheets, spreadsheetId, 'Bars');

    const rows: string[][] = [['AI Title', 'Bars', 'Transcript', 'Date', 'City', 'Venue', 'Filename']];
    for (const note of notes) {
      const bars = (note as any).bars;
      if (!bars) continue;
      rows.push([
        note.ai_title || '',
        bars,
        note.transcript || '',
        note.created_at || '',
        note.context_cities || '',
        note.context_venues || '',
        note.original_filename,
      ]);
    }

    await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Bars!A:Z' });
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: 'Bars!A1',
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    });
  } catch (err) {
    console.warn('[syncBarsTab] failed:', err);
  }
}

// Update a single row in the sheet matching note.id — used for auto-sync on edit
export async function syncNoteToSheet(note: NoteRow): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) return; // no sheet set up yet, skip silently

  try {
    const auth = await getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Find the row with this note's ID in column A
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Notes!A:A',
    });
    const rows = res.data.values || [];
    const rowIndex = rows.findIndex(r => r[0] === String(note.id));
    if (rowIndex === -1) {
      // Note not in sheet yet — append it
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Notes!A1',
        valueInputOption: 'RAW',
        requestBody: { values: [noteToRow(note)] },
      });
    } else {
      // Update existing row (rowIndex is 0-based, sheets are 1-based)
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Notes!A${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: [noteToRow(note)] },
      });
    }
  } catch (err) {
    // Sync failures are non-fatal — just log
    console.warn('[syncNoteToSheet] failed:', err);
  }
}
