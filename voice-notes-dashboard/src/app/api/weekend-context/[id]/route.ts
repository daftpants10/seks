import { NextRequest, NextResponse } from 'next/server';
import { updateContext, deleteContext, linkNotesInDateRange } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

    const body = await request.json();
    const { city, venue, people, vibe, date_from, date_to, notes } = body;

    updateContext(id, { city, venue, people, vibe, date_from, date_to, notes });

    if (date_from && date_to) {
      linkNotesInDateRange(id, date_from, date_to);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/weekend-context/[id]]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

    deleteContext(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/weekend-context/[id]]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
