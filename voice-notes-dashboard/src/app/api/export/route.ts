import { NextRequest, NextResponse } from 'next/server';
import { getAllNotes } from '@/lib/db';
import { exportToSheets } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const notes = getAllNotes();
    const url = await exportToSheets(notes);
    return NextResponse.json({ success: true, url });
  } catch (err: any) {
    console.error('[POST /api/export]', err);
    if (err.message?.includes('Not authenticated')) {
      return NextResponse.json({ error: err.message, authRequired: true }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
