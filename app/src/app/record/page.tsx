'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export default function RecordPage() {
  const router = useRouter()
  const [recording, setRecording] = useState(false)
  const [durationMs, setDurationMs] = useState(0)
  const [hint, setHint] = useState('')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(60).fill(4))

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  async function startRecording() {
    if (recording) return
    chunksRef.current = []
    setBlob(null)
    setHint('')
    setDurationMs(0)

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    const ctx = new AudioContext()
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 128
    source.connect(analyser)
    analyserRef.current = analyser

    const mr = new MediaRecorder(stream)
    mediaRecorderRef.current = mr
    mr.ondataavailable = e => chunksRef.current.push(e.data)
    mr.start()
    startTimeRef.current = Date.now()
    setRecording(true)

    timerRef.current = setInterval(() => {
      setDurationMs(Date.now() - startTimeRef.current)
    }, 100)

    function drawBars() {
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)
      const bars = Array.from({ length: 60 }, (_, i) => {
        const idx = Math.floor((i / 60) * data.length)
        return 4 + (data[idx] / 255) * 44
      })
      setWaveformBars(bars)
      if (dotRef.current) {
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        const scale = 1 + (avg / 255) * 0.5
        dotRef.current.style.transform = `scale(${scale})`
      }
      rafRef.current = requestAnimationFrame(drawBars)
    }
    rafRef.current = requestAnimationFrame(drawBars)
  }

  async function stopRecording() {
    if (!recording) return
    cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    if (dotRef.current) dotRef.current.style.transform = 'scale(1)'

    const elapsed = Date.now() - startTimeRef.current
    setRecording(false)

    if (elapsed < 3000) {
      setHint('hold a little longer')
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach(t => t.stop())
      return
    }

    const mr = mediaRecorderRef.current!
    await new Promise<void>(resolve => {
      mr.onstop = () => resolve()
      mr.stop()
    })
    streamRef.current?.getTracks().forEach(t => t.stop())

    const b = new Blob(chunksRef.current, { type: 'audio/webm' })
    setBlob(b)
    setDurationMs(elapsed)
  }

  async function handlePost() {
    if (!blob) return
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const path = `${user.id}/${Date.now()}.webm`
    await supabase.storage.from('posts').upload(path, blob)
    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(path)

    await supabase.from('posts').insert({
      user_id: user.id,
      audio_url: urlData.publicUrl,
      duration_ms: durationMs,
    })
    setUploading(false)
    router.push('/feed')
  }

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
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div>
        <Link href="/feed" style={{ fontSize: '14px', color: '#fff', textDecoration: 'none' }}>←</Link>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
        {/* Waveform while recording */}
        {recording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '48px' }}>
            {waveformBars.map((h, i) => (
              <div key={i} style={{ width: '3px', height: `${h}px`, background: '#fff', flexShrink: 0 }} />
            ))}
          </div>
        )}

        {/* Static waveform preview after recording */}
        {blob && !recording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '48px' }}>
            {waveformBars.map((h, i) => (
              <div key={i} style={{ width: '3px', height: `${h}px`, background: '#1a1a1a', flexShrink: 0 }} />
            ))}
          </div>
        )}

        <div
          ref={dotRef}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={e => { e.preventDefault(); startRecording() }}
          onTouchEnd={e => { e.preventDefault(); stopRecording() }}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#fff',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        />

        {(recording || durationMs > 0) && (
          <p style={{ fontSize: '13px', color: '#aaa' }}>{formatDuration(durationMs)}</p>
        )}

        {hint && <p style={{ fontSize: '11px', color: '#555' }}>{hint}</p>}

        {blob && !recording && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={handlePost}
              disabled={uploading}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '13px',
                borderBottom: '1px solid #333',
                paddingBottom: '2px',
                cursor: 'pointer',
              }}
            >
              {uploading ? 'posting...' : 'post'}
            </button>
            <button
              onClick={() => { setBlob(null); setDurationMs(0); setHint('') }}
              style={{
                background: 'none',
                border: 'none',
                color: '#444',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              discard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
