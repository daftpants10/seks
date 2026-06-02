import { NextRequest, NextResponse } from 'next/server';
import { handleAuthCallback } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  await handleAuthCallback(code);
  return NextResponse.redirect('/');
}
