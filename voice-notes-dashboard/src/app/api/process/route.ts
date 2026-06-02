import { NextRequest, NextResponse } from 'next/server';
import { getNoteById, updateNote, insertNote } from '@/lib/db';
import { transcribeAudio } from '@/lib/deepgram';
import { analyzeTranscript } from '@/lib/claude';
import { detectBpm } from '@/lib/bpm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath, noteId } = body;

    if (!filePath) {
      return NextResponse.json({ error: 'filePath required' }, { status: 400 });
    }

    let id: number = noteId;
    if (!id) {
      id = insertNote(filePath);
    }

    // Mark as processing
    updateNote(id, { status: 'processing' });

    try {
      // Step 1: Transcribe with Deepgram
      console.log('[process] Transcribing:', filePath);
      const transcription = await transcribeAudio(filePath);

      updateNote(id, {
        duration_seconds: transcription.duration,
      });

      if (transcription.hasSpeech) {
        // Step 2a: Spoken note — analyze with Claude
        console.log('[process] Spoken note, analyzing with Claude...');
        const analysis = await analyzeTranscript(transcription.transcript);

        updateNote(id, {
          type: 'spoken',
          transcript: transcription.transcript,
          ai_title: analysis.title,
          rhymes: JSON.stringify(analysis.rhymes),
          key_phrases: JSON.stringify(analysis.key_phrases),
          status: 'processed',
          processed_at: new Date().toISOString(),
        });
      } else {
        // Step 2b: Reference track — detect BPM
        console.log('[process] Reference track, detecting BPM...');
        const bpmResult = await detectBpm(filePath);

        updateNote(id, {
          type: 'reference',
          bpm: bpmResult.bpm || null,
          status: 'processed',
          processed_at: new Date().toISOString(),
        });
      }

      const note = getNoteById(id);
      return NextResponse.json({ success: true, note });
    } catch (processingErr) {
      console.error('[process] Pipeline error:', processingErr);
      updateNote(id, { status: 'error' });
      return NextResponse.json({ error: String(processingErr) }, { status: 500 });
    }
  } catch (err) {
    console.error('[POST /api/process]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
