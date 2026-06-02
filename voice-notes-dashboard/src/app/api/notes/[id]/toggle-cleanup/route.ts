import { NextRequest, NextResponse } from 'next/server';
import { toggleCleanup } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const newVal = toggleCleanup(id);
    return NextResponse.json({ needs_cleanup: newVal });
  } catch (err) {
    console.error('[POST /api/notes/[id]/toggle-cleanup]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
