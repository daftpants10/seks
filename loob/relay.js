#!/usr/bin/env node
// The 8 — WebSocket relay
// Receives SomaSync stream on port 8765, forwards to browser on port 3000
//
// Usage:
//   cd loob && npm install && node relay.js
//
// Then:
//   SomaSync → ws://[this-machine-ip]:8765   (set in SomaSync streaming settings)
//   iPad     → http://[this-machine-ip]:3000  (open in browser)

const http = require('http')
const fs   = require('fs')
const path = require('path')
const WebSocket = require('ws')
const os = require('os')
const { exec } = require('child_process')

const HTTP_PORT = 3000
const SOMA_PORT = 8765
const HTML_FILE    = path.join(__dirname, 'the-8.html')
const SESSION_FILE = path.join(__dirname, 'sessions.json')
const CSV_FILE     = path.join(__dirname, 'participants.csv')
const IDENTITY_FILE = path.join(__dirname, 'identity_map.json')

const CSV_HEADERS = [
  'participant_id','trial_id','trial_label','condition',
  'session_date','session_start','session_end','total_duration_s',
  'time_to_first_flow_s',
  'age','sex','activity_level','movement_exp','medications',
  'flow_toy',
  'flow_arts','flow_years','flow_hours_per_week',
  'stress','sleep_hours','caffeine_hours_ago',
  'flow_time_s','flow_pct','dfa_mean',
  'recovering_s','regular_s','adaptive_s','tension_s',
  'difficulty','feedback_helped','post_description'
].join(',') + '\n'

function appendCSV(participantId, s) {
  const b = s.baseline || {}
  const pq = s.postQ || {}
  const row = [
    participantId,
    s.trial_id ?? '',
    s.trial_label ?? '',
    s.condition ?? '',
    s.sessionDate ?? '',
    s.sessionStart ?? '',
    s.sessionEnd ?? '',
    s.totalDurationS ?? s.totalPlayTime ?? '',
    s.timeToFirstFlowS ?? s.timeToFirstGlowS ?? '',
    b.age ?? '',
    b.sex ?? '',
    b.activityLevel ?? '',
    b.movementExp ?? '',
    b.medications ?? '',
    `"${(b.flowToy||'').replace(/"/g,'""')}"`,
    `"${(b.flowArts||'').replace(/"/g,'""')}"`,
    b.flowYears ?? '',
    b.flowHoursPerWeek ?? '',
    b.stress ?? '',
    b.sleepHours ?? '',
    b.caffeineHoursAgo ?? '',
    s.flowTime ?? s.glowTime ?? '',
    s.flowPct ?? s.glowPct ?? '',
    s.dfaMean ?? '',
    s.phaseTime?.RECOVERING ?? '',
    s.phaseTime?.REGULAR    ?? '',
    s.phaseTime?.ADAPTIVE   ?? '',
    s.phaseTime?.TENSION    ?? '',
    pq.difficulty ?? '',
    pq.feedback   ?? '',
    `"${(pq.description||'').replace(/"/g,'""')}"`,
  ].join(',') + '\n'
  if (!fs.existsSync(CSV_FILE)) fs.writeFileSync(CSV_FILE, CSV_HEADERS)
  fs.appendFileSync(CSV_FILE, row)
}

const AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac']
function findTrack() {
  try {
    return fs.readdirSync(__dirname).find(f => AUDIO_EXTS.includes(path.extname(f).toLowerCase()))
  } catch { return null }
}

// ── HTTP + browser WebSocket ──────────────────────────────────────────────────
const httpServer = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0]

  if (urlPath === '/' || urlPath === '/the-8' || urlPath === '/the-8.html') {
    try {
      const html = fs.readFileSync(HTML_FILE, 'utf8')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)
    } catch {
      res.writeHead(500); res.end('Could not read the-8.html')
    }
  } else if (urlPath === '/track') {
    const qs  = new URL('http://x' + req.url).searchParams
    const n   = qs.get('n')
    let track
    if (n) {
      const num = parseInt(n, 10)
      track = AUDIO_EXTS.map(ext => `seks_track_${num}${ext}`)
        .find(f => { try { fs.accessSync(path.join(__dirname, f)); return true } catch { return false } })
    } else {
      track = findTrack()
    }
    if (!track) { res.writeHead(404); res.end('track not found'); return }
    const filePath = path.join(__dirname, track)
    const stat     = fs.statSync(filePath)
    const mime     = { '.mp3':'audio/mpeg', '.wav':'audio/wav', '.ogg':'audio/ogg', '.m4a':'audio/mp4', '.flac':'audio/flac' }
    const ct       = mime[path.extname(track).toLowerCase()] || 'audio/mpeg'
    const range    = req.headers.range
    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
      const start = parseInt(startStr, 10)
      const end   = endStr ? parseInt(endStr, 10) : stat.size - 1
      res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': ct })
      fs.createReadStream(filePath, { start, end }).pipe(res)
    } else {
      res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': ct, 'Accept-Ranges': 'bytes' })
      fs.createReadStream(filePath).pipe(res)
    }
    console.log(`🎵 serving: ${track}`)
  } else if (urlPath === '/consent' && req.method === 'POST') {
    let body = ''
    req.on('data', d => body += d.toString())
    req.on('end', () => {
      try {
        const identity = JSON.parse(body)
        let map = []
        try { map = JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf8')) } catch {}
        const participantId = map.length + 1
        map.push({ participantId, ...identity })
        fs.writeFileSync(IDENTITY_FILE, JSON.stringify(map, null, 2))
        console.log(`\n👤 p${String(participantId).padStart(3,'0')} · ${identity.name}`)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, participantId }))
      } catch { res.writeHead(400); res.end('bad request') }
    })

  } else if (urlPath === '/sessions' && req.method === 'GET') {
    try {
      const data = fs.existsSync(SESSION_FILE) ? fs.readFileSync(SESSION_FILE, 'utf8') : '[]'
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
      res.end(data)
    } catch { res.writeHead(500); res.end('[]') }

  } else if (urlPath === '/sessions' && req.method === 'POST') {
    let body = ''
    req.on('data', d => body += d.toString())
    req.on('end', () => {
      try {
        const session = JSON.parse(body)
        let sessions = []
        try { sessions = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')) } catch {}
        const participantId = session.participantId ?? (sessions.length + 1)
        sessions.push({ ...session, participantId, savedAt: new Date().toISOString() })
        fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2))
        appendCSV(participantId, session)
        console.log(`\n💾 p${String(participantId).padStart(3,'0')} · ${session.trial_label||'?'} · ${session.condition||''} · flow ${session.flowTime??'?'}s · first flow ${session.timeToFirstFlowS??'?'}s`)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, count: sessions.length, participantId }))
      } catch { res.writeHead(400); res.end('bad request') }
    })

  } else if (urlPath === '/participants.csv' && req.method === 'GET') {
    try {
      const data = fs.existsSync(CSV_FILE) ? fs.readFileSync(CSV_FILE, 'utf8') : CSV_HEADERS
      res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="participants.csv"', 'Access-Control-Allow-Origin': '*' })
      res.end(data)
    } catch { res.writeHead(500); res.end('error') }

  } else {
    res.writeHead(404); res.end('not found')
  }
})

const browserWss = new WebSocket.Server({ server: httpServer })
const browsers = new Set()

browserWss.on('connection', ws => {
  browsers.add(ws)
  console.log(`📱 browser connected  (${browsers.size} active)`)
  ws.on('close', () => { browsers.delete(ws); console.log(`📱 browser left       (${browsers.size} active)`) })
})

function relay(data) {
  browsers.forEach(b => { if (b.readyState === WebSocket.OPEN) b.send(data) })
}

// ── SomaSync WebSocket ────────────────────────────────────────────────────────
const somaWss = new WebSocket.Server({ port: SOMA_PORT })

somaWss.on('connection', ws => {
  console.log('💚 SomaSync connected')
  ws.on('message', data => {
    const msg = data.toString()
    // Print first message fully so we can see the format, then summarise
    if (!somaWss._seenFirst) {
      somaWss._seenFirst = true
      console.log('\n── SomaSync message format ──')
      console.log(msg)
      console.log('─────────────────────────────\n')
    }
    process.stdout.write(`\r🫀 ${msg.slice(0, 100).padEnd(100)}`)
    relay(msg)
  })
  ws.on('close', ()  => { somaWss._seenFirst = false; console.log('\n⚠️  SomaSync disconnected') })
  ws.on('error', e  => console.log('\n❌ SomaSync error:', e.message))
})

// ── Startup ───────────────────────────────────────────────────────────────────
function localIP() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return 'localhost'
}

httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  const ip = localIP()
  console.log(`
╔══════════════════════════════════════════╗
║         THE 8 — biometric relay          ║
╠══════════════════════════════════════════╣
║                                          ║
║  Open on iPad (browser):                 ║
║  http://${ip.padEnd(16)}:${HTTP_PORT}          ║
║                                          ║
║  SomaSync → Streaming Settings:          ║
║  Stream To:  WebSocket                   ║
║  Server:     Custom                      ║
║  IP:         ${ip.padEnd(16)}            ║
║  Port:       ${String(SOMA_PORT).padEnd(16)}            ║
║  Insecure:   ON  ← important             ║
║                                          ║
╚══════════════════════════════════════════╝

Waiting for connections... (Ctrl+C to stop)
`)
  exec('open http://localhost:3000')
})
