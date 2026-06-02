import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/deepgram';
import { extractContext } from '@/lib/claude';
import { insertContext, linkNotesInDateRange } from '@/lib/db';
import fs from 'fs';
import path from 'path';

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

    // Save temp file
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = path.join(UPLOADS_DIR, `ctx-${Date.now()}-${file.name}`);
    fs.writeFileSync(tempPath, buffer);

    // Transcribe
    const transcription = await transcribeAudio(tempPath);
    fs.unlinkSync(tempPath); // remove temp file

    if (!transcription.transcript) {
      return NextResponse.json({ error: 'Could not transcribe audio — no speech detected' }, { status: 400 });
    }

    // Extract context with Claude
    const today = new Date().toISOString().split('T')[0];
    const extracted = await extractContext(transcription.transcript, today);

    // Save context to DB
    const contextId = insertContext({
      city: extracted.city,
      venue: extracted.venue,
      people: extracted.people.join(', ') || null,
      vibe: extracted.vibe,
      date_from: extracted.date_from,
      date_to: extracted.date_to,
      notes: transcription.transcript,
    });

    // Auto-link notes in the date range
    let linkedCount = 0;
    if (extracted.date_from && extracted.date_to) {
      linkedCount = linkNotesInDateRange(contextId, extracted.date_from, extracted.date_to);
    }

    return NextResponse.json({
      success: true,
      transcript: transcription.transcript,
      extracted,
      contextId,
      linkedCount,
    });
  } catch (err) {
    console.error('[POST /api/context-from-voice]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
