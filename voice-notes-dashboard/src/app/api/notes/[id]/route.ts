import { NextRequest, NextResponse } from 'next/server';
import { updateNote, getNoteById, getAllNotes } from '@/lib/db';
import { syncNoteToSheet } from '@/lib/google-sheets';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const allowed = ['ai_title', 'key_phrases', 'rhymes', 'transcript', 'bpm', 'type', 'track_id'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
    }
    updateNote(id, updates);

    // Auto-sync to Google Sheets in background (non-blocking)
    const notes = getAllNotes();
    const updated = notes.find(n => n.id === id);
    if (updated) {
      syncNoteToSheet(updated).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/notes/[id]]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
