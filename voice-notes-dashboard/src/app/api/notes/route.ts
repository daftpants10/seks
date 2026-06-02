import { NextRequest, NextResponse } from 'next/server';
import { getAllNotes } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const location = searchParams.get('location') || undefined;
    const status = searchParams.get('status') || undefined;

    const notes = getAllNotes({ type, location, status });
    return NextResponse.json(notes);
  } catch (err) {
    console.error('[GET /api/notes]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
