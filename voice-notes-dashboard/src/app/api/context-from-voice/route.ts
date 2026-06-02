import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/deepgram';
import { extractContext } from '@/lib/claude';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Only transcribes and extracts segments — does NOT save.
// Client confirms/edits then POSTs to /api/weekend-context for each segment.
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = path.join(UPLOADS_DIR, `ctx-${Date.now()}-${file.name}`);
    fs.writeFileSync(tempPath, buffer);

    const transcription = await transcribeAudio(tempPath);
    fs.unlinkSync(tempPath);

    if (!transcription.transcript) {
      return NextResponse.json({ error: 'Could not transcribe audio — no speech detected' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const segments = await extractContext(transcription.transcript, today);

    return NextResponse.json({ transcript: transcription.transcript, segments });
  } catch (err) {
    console.error('[POST /api/context-from-voice]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
