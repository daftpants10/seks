'use client'

import { useEffect, useRef } from 'react'

export default function BreathingDot() {
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
      if (dotRef.current) dotRef.current.style.transform = `scale(${scale})`
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div
      ref={dotRef}
      style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }}
    />
  )
}
