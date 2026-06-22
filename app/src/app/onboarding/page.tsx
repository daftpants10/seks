'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const containerStyle: React.CSSProperties = {
  background: '#000',
  color: '#fff',
  minHeight: '100vh',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '52px 28px',
  maxWidth: '390px',
  margin: '0 auto',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase',
  color: '#444',
  letterSpacing: '0.05em',
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid #222',
  color: '#fff',
  fontSize: '16px',
  padding: '12px 0',
  outline: 'none',
  marginTop: '8px',
  boxSizing: 'border-box',
}

const btnStyle: React.CSSProperties = {
  display: 'block',
  background: 'none',
  border: 'none',
  color: '#fff',
  fontSize: '13px',
  padding: 0,
  marginTop: '24px',
  cursor: 'pointer',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Step 2 state
  const [recording, setRecording] = useState(false)
  const [durationMs, setDurationMs] = useState(0)
  const [hint, setHint] = useState('')
  const [uploading, setUploading] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setError('')
    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId, username, onboarded: false })
    if (insertError) {
      setError(insertError.message)
      return
    }
    setStep(2)
  }

  async function startRecording() {
    chunksRef.current = []
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    mediaRecorderRef.current = mr
    mr.ondataavailable = e => chunksRef.current.push(e.data)
    mr.start()
    startTimeRef.current = Date.now()
    setRecording(true)
    setHint('')
    setDurationMs(0)
    timerRef.current = setInterval(() => {
      setDurationMs(Date.now() - startTimeRef.current)
    }, 100)

    // animate dot
    let start: number | null = null
    function pulse(ts: number) {
      if (!start) start = ts
      const t = ((ts - start) % 1000) / 1000
      const scale = 1 + 0.3 * Math.sin(t * Math.PI * 2)
      if (dotRef.current) dotRef.current.style.transform = `scale(${scale})`
      rafRef.current = requestAnimationFrame(pulse)
    }
    rafRef.current = requestAnimationFrame(pulse)
  }

  async function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    cancelAnimationFrame(rafRef.current)
    if (dotRef.current) dotRef.current.style.transform = 'scale(1)'

    const elapsed = Date.now() - startTimeRef.current
    setRecording(false)

    if (elapsed < 3000) {
      setHint('hold a little longer')
      mediaRecorderRef.current?.stop()
      return
    }

    setUploading(true)
    const mr = mediaRecorderRef.current!
    await new Promise<void>(resolve => {
      mr.onstop = () => resolve()
      mr.stop()
    })

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const supabase = createClient()
    const path = `${userId}/${Date.now()}.webm`
    await supabase.storage.from('posts').upload(path, blob)
    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(path)
    const audioUrl = urlData.publicUrl

    await supabase.from('posts').insert({
      user_id: userId,
      audio_url: audioUrl,
      duration_ms: elapsed,
    })
    await supabase.from('profiles').update({ onboarded: true }).eq('id', userId)

    setUploading(false)
    router.push('/feed')
  }

  function formatDuration(ms: number) {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }

  if (step === 1) {
    return (
      <div style={containerStyle}>
        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>be hear now</div>
        <div style={{ width: '100%' }}>
          <form onSubmit={handleUsernameSubmit}>
            <label style={labelStyle}>choose a username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={inputStyle}
            />
            {error && <p style={{ fontSize: '12px', color: '#555', marginTop: '8px' }}>{error}</p>}
            <button type="submit" style={btnStyle}>continue</button>
          </form>
        </div>
        <div />
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>be hear now</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#444', letterSpacing: '0.05em' }}>
          before you enter
        </p>
        <p style={{ fontSize: '18px', color: '#fff', lineHeight: 1.4, textAlign: 'center' }}>
          record something that sounds like waiting
        </p>

        <div
          ref={dotRef}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={e => { e.preventDefault(); startRecording() }}
          onTouchEnd={e => { e.preventDefault(); stopRecording() }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#fff',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        />

        {recording && (
          <p style={{ fontSize: '13px', color: '#aaa' }}>{formatDuration(durationMs)}</p>
        )}
        {hint && (
          <p style={{ fontSize: '11px', color: '#555' }}>{hint}</p>
        )}
        {uploading && (
          <p style={{ fontSize: '11px', color: '#555' }}>uploading...</p>
        )}
      </div>

      <div />
    </div>
  )
}
