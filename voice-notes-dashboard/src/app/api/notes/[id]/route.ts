import { NextRequest, NextResponse } from 'next/server';
import { updateNote } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    // Only allow editing safe fields
    const allowed = ['ai_title', 'key_phrases', 'rhymes', 'transcript', 'bpm', 'type'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
    }
    updateNote(id, updates);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/notes/[id]]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
