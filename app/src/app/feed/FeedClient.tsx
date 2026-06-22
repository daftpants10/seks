'use client'

import Link from 'next/link'
import PostCard from '@/components/PostCard'

interface Post {
  id: string
  audio_url: string
  duration_ms: number
  created_at: string
  username: string
}

interface FeedClientProps {
  posts: Post[]
  currentUsername: string
}

export default function FeedClient({ posts, currentUsername }: FeedClientProps) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <span style={{ fontSize: '12px', color: '#888' }}>{currentUsername}</span>
        <Link href="/record" style={{ fontSize: '20px', color: '#fff', textDecoration: 'none' }}>+</Link>
      </div>

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '16px' }}>
            follow someone to hear their sounds
          </p>
          <Link
            href={`/profile/${currentUsername}`}
            style={{ fontSize: '13px', color: '#fff', textDecoration: 'none', borderBottom: '1px solid #333', paddingBottom: '2px' }}
          >
            your profile
          </Link>
        </div>
      ) : (
        <div>
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={{ id: post.id, audio_url: post.audio_url, duration_ms: post.duration_ms, created_at: post.created_at }}
              username={post.username}
            />
          ))}
        </div>
      )}
    </div>
  )
}
