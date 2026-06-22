import BreathingDot from '@/components/BreathingDot'

const sectionStyle: React.CSSProperties = {
  marginBottom: '40px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase',
  color: '#444',
  letterSpacing: '0.05em',
  marginBottom: '12px',
}

const bodyStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#aaa',
  lineHeight: 1.6,
}

export default function AboutPage() {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
        <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>be hear now</span>
        <BreathingDot />
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>what it is</p>
        <p style={bodyStyle}>
          A place to share what you&apos;re actually hearing. Not a polished recording. Not a performance. The bus outside. Rain. Someone laughing in the next room. The sound of right now.
        </p>
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>echo</p>
        <p style={bodyStyle}>
          Instead of likes, there are echoes. Hold a sound to echo it. The longer you hold, the larger the echo. It&apos;s not about numbers. It&apos;s about resonance.
        </p>
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>to get in</p>
        <p style={bodyStyle}>
          You record something before you enter. Something that sounds like waiting. It&apos;s the price of admission — and the first thing you share.
        </p>
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>who it&apos;s for</p>
        <p style={bodyStyle}>
          People who listen. People who notice. People who think sound is worth sharing even when nothing is happening.
        </p>
      </div>

      <div style={{ marginBottom: '60px' }}>
        <p style={labelStyle}>team</p>
        <p style={bodyStyle}>rv, André</p>
      </div>

      <div style={{ borderTop: '1px solid #111', paddingTop: '24px' }}>
        <p style={{ fontSize: '11px', color: '#333' }}>prototype · june 2026</p>
      </div>
    </div>
  )
}
