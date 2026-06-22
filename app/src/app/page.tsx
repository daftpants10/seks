'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function Page() {
  const dotRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const duration = 2800
    let start: number | null = null

    function animate(ts: number) {
      if (!start) start = ts
      const elapsed = (ts - start) % duration
      const t = elapsed / duration
      const scale = 1 + 0.6 * (0.5 - 0.5 * Math.cos(t * 2 * Math.PI))
      if (dotRef.current) {
        dotRef.current.style.transform = `scale(${scale})`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div style={{
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
    }}>
      <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        be hear now
      </div>

      <div
        ref={dotRef}
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: '#fff',
        }}
      />

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '16px', lineHeight: 1.5 }}>
          A place to record what you&apos;re hearing. Not to perform it.
        </p>
        <Link
          href="/login"
          style={{
            fontSize: '13px',
            color: '#fff',
            textDecoration: 'none',
            borderBottom: '1px solid #333',
            paddingBottom: '2px',
          }}
        >
          get started
        </Link>
      </div>
    </div>
  )
}
