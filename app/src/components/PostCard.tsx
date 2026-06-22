'use client'

import { useRef, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Post {
  id: string
  audio_url: string
  duration_ms: number
  created_at: string
}

interface PostCardProps {
  post: Post
  username: string
}

function seededRandom(seed: number) {
  let s = seed
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function generateBars(postId: string): number[] {
  const seed = postId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const rng = seededRandom(seed)
  return Array.from({ length: 60 }, () => 4 + rng() * 44)
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export default function PostCard({ post, username }: PostCardProps) {
  const bars = generateBars(post.id)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [playhead, setPlayhead] = useState(0) // 0-1
  const [echoCount, setEchoCount] = useState(0)
  const [echoed, setEchoed] = useState(false)
  const [ringSize, setRingSize] = useState(0)
  const holdStartRef = useRef<number>(0)
  const ringRafRef = useRef<number>(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('echoes').select('id', { count: 'exact' }).eq('post_id', post.id).then(({ count }) => {
      setEchoCount(count ?? 0)
    })
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('echoes').select('id').eq('post_id', post.id).eq('user_id', data.user.id).single().then(({ data: echo }) => {
          if (echo) setEchoed(true)
        })
      }
    })
  }, [post.id])

  function togglePlay() {
    if (!audioRef.current) {
      audioRef.current = new Audio(post.audio_url)
      audioRef.current.addEventListener('timeupdate', () => {
        const a = audioRef.current!
        setPlayhead(a.duration ? a.currentTime / a.duration : 0)
      })
      audioRef.current.addEventListener('ended', () => {
        setPlaying(false)
        setPlayhead(0)
      })
    }
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  function startEcho() {
    holdStartRef.current = Date.now()
    setRingSize(10)
    const startTime = Date.now()
    function growRing() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / 1200, 1)
      const size = 10 + progress * 50
      setRingSize(size)
      if (progress < 1) {
        ringRafRef.current = requestAnimationFrame(growRing)
      }
    }
    ringRafRef.current = requestAnimationFrame(growRing)
  }

  async function endEcho() {
    cancelAnimationFrame(ringRafRef.current)
    const held = Date.now() - holdStartRef.current
    if (held < 200) {
      setRingSize(0)
      return
    }
    const size = Math.min(held / 1200, 1)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !echoed) {
      await supabase.from('echoes').upsert({ post_id: post.id, user_id: user.id, size })
      setEchoed(true)
      setEchoCount(c => c + 1)
    }
  }

  const playheadBar = Math.floor(playhead * 60)

  return (
    <div style={{ padding: '20px 0', borderBottom: '1px solid #111' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: '#fff' }}>{username}</span>
        <span style={{ fontSize: '11px', color: '#444' }}>{relativeTime(post.created_at)}</span>
      </div>

      {/* Waveform */}
      <div
        onClick={togglePlay}
        style={{
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          cursor: 'pointer',
        }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              width: '3px',
              height: `${h}px`,
              background: playing && i <= playheadBar ? '#fff' : '#1a1a1a',
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <span style={{ fontSize: '11px', color: '#555' }}>{formatDuration(post.duration_ms)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {echoCount > 0 && <span style={{ fontSize: '11px', color: '#555' }}>{echoCount}</span>}
          <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {ringSize > 10 && (
              <div style={{
                position: 'absolute',
                width: `${ringSize}px`,
                height: `${ringSize}px`,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.3)',
                pointerEvents: 'none',
              }} />
            )}
            {echoed && (
              <div style={{
                position: 'absolute',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.3)',
                pointerEvents: 'none',
              }} />
            )}
            <div
              onMouseDown={startEcho}
              onMouseUp={endEcho}
              onTouchStart={e => { e.preventDefault(); startEcho() }}
              onTouchEnd={e => { e.preventDefault(); endEcho() }}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#fff',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 1,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
