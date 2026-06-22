'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FollowButtonProps {
  targetUserId: string
  currentUserId: string
  initialFollowing: boolean
}

export default function FollowButton({ targetUserId, currentUserId, initialFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', targetUserId)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetUserId })
      setFollowing(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        background: 'none',
        border: 'none',
        color: following ? '#444' : '#fff',
        fontSize: '11px',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {following ? 'following' : 'follow'}
    </button>
  )
}
