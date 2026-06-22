'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const wordmarkStyle: React.CSSProperties = {
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
}

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

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/auth/callback',
      },
    })
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div style={containerStyle}>
      <div style={wordmarkStyle}>be hear now</div>

      <div style={{ width: '100%' }}>
        {submitted ? (
          <p style={{ fontSize: '14px', color: '#aaa' }}>check your email</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#444', letterSpacing: '0.05em' }}>
              enter your email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
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
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'block',
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '13px',
                padding: 0,
                marginTop: '24px',
                cursor: 'pointer',
              }}
            >
              {loading ? '...' : 'send link'}
            </button>
          </form>
        )}
      </div>

      <div />
    </div>
  )
}
