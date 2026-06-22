import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: sessionData } = await supabase.auth.exchangeCodeForSession(code)
    const user = sessionData?.user

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, onboarded')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      if (profile.onboarded) {
        return NextResponse.redirect(`${origin}/feed`)
      }
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
