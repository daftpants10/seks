import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/PostCard'
import FollowButton from '@/components/FollowButton'

export default async function ProfilePage(props: PageProps<'/profile/[username]'>) {
  const { username } = await props.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, created_at')
    .eq('username', username)
    .single()

  if (!profile) redirect('/feed')

  const { data: postsRaw } = await supabase
    .from('posts')
    .select('*, echoes(id)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const posts = (postsRaw ?? []).map((p: { id: string; audio_url: string; duration_ms: number; created_at: string; echoes: { id: string }[] }) => ({
    id: p.id,
    audio_url: p.audio_url,
    duration_ms: p.duration_ms,
    created_at: p.created_at,
    echo_count: p.echoes?.length ?? 0,
  }))

  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id)

  const { data: followRow } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', profile.id)
    .single()

  const isFollowing = !!followRow
  const isOwnProfile = user.id === profile.id

  return (
    <div style={{
      background: '#000',
      color: '#fff',
      minHeight: '100vh',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      maxWidth: '390px',
      margin: '0 auto',
      padding: '52px 28px',
      boxSizing: 'border-box',
    }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ fontSize: '22px', color: '#fff', fontWeight: 400, margin: 0 }}>{profile.username}</h1>
          {!isOwnProfile && (
            <FollowButton
              targetUserId={profile.id}
              currentUserId={user.id}
              initialFollowing={isFollowing}
            />
          )}
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
          <span style={{ fontSize: '11px', color: '#555' }}>{followerCount ?? 0} followers</span>
          <span style={{ fontSize: '11px', color: '#555' }}>{followingCount ?? 0} following</span>
          <span style={{ fontSize: '11px', color: '#555' }}>{posts.length} sounds</span>
        </div>
      </div>

      {posts.map(p => (
        <PostCard
          key={p.id}
          post={{ id: p.id, audio_url: p.audio_url, duration_ms: p.duration_ms, created_at: p.created_at }}
          username={profile.username}
        />
      ))}
    </div>
  )
}
