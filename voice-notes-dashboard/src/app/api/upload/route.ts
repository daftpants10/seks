import { NextRequest, NextResponse } from 'next/server';
import { insertNote } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import os from 'os';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export async function POST(request: NextRequest) {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.m4a') && !file.name.endsWith('.mp3') && !file.name.endsWith('.wav')) {
      return NextResponse.json({ error: 'Only .m4a, .mp3, .wav files supported' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const destPath = path.join(UPLOADS_DIR, file.name);
    fs.writeFileSync(destPath, buffer);

    const noteId = insertNote(destPath);

    return NextResponse.json({ success: true, noteId, filePath: destPath });
  } catch (err) {
    console.error('[POST /api/upload]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
