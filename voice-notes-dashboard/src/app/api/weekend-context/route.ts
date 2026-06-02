import { NextRequest, NextResponse } from 'next/server';
import { getAllContexts, insertContext, linkNotesInDateRange } from '@/lib/db';

export async function GET() {
  try {
    const contexts = getAllContexts();
    return NextResponse.json(contexts);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, venue, people, vibe, date_from, date_to, notes } = body;

    if (!date_from || !date_to) {
      return NextResponse.json({ error: 'date_from and date_to are required — please set both dates' }, { status: 400 });
    }

    const contextId = insertContext({ city, venue, people, vibe, date_from, date_to, notes: notes || null });

    // Auto-link notes in the date range
    const linked = linkNotesInDateRange(contextId, date_from, date_to);

    return NextResponse.json({ success: true, contextId, linkedCount: linked, linkedNotes: linked });
  } catch (err) {
    console.error('[POST /api/weekend-context]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
