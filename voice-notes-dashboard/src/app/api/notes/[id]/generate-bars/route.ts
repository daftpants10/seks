import { NextRequest, NextResponse } from 'next/server';
import { getNoteById, updateNote, getAllNotes } from '@/lib/db';
import { generateBars } from '@/lib/claude';
import { syncNoteToSheet, syncBarsTab } from '@/lib/google-sheets';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    const note = getNoteById(id);
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    if (!note.transcript) return NextResponse.json({ error: 'No transcript to generate bars from' }, { status: 400 });

    const bars = await generateBars(note.transcript);
    updateNote(id, { bars });

    // Sync to Sheets non-blocking
    const allNotes = getAllNotes();
    const updated = allNotes.find(n => n.id === id);
    if (updated) {
      syncNoteToSheet(updated).catch(() => {});
      syncBarsTab(allNotes).catch(() => {});
    }

    return NextResponse.json({ success: true, bars });
  } catch (err) {
    console.error('[POST /api/notes/[id]/generate-bars]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
