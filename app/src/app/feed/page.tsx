import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FeedClient from './FeedClient'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(username)')
    .or(`user_id.eq.${user.id},user_id.in.(select following_id from follows where follower_id=eq.${user.id})`)
    .order('created_at', { ascending: false })
    .limit(20)

  const flatPosts = (posts ?? []).map((p: { id: string; audio_url: string; duration_ms: number; created_at: string; profiles: { username: string } | null }) => ({
    id: p.id,
    audio_url: p.audio_url,
    duration_ms: p.duration_ms,
    created_at: p.created_at,
    username: p.profiles?.username ?? '',
  }))

  return <FeedClient posts={flatPosts} currentUsername={profile.username} />
}
