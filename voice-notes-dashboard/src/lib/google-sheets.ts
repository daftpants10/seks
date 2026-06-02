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
  'Rhymes',
  'Key Phrases',
  'Date',
  'Location Tags',
  'BPM',
  'Status',
  'Needs Cleanup',
];

function noteToRow(note: Note & { context_cities?: string }): string[] {
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
    rhymes.join(', '),
    keyPhrases.join(', '),
    note.created_at || '',
    (note as any).context_cities || '',
    note.bpm ? String(note.bpm) : '',
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

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}
