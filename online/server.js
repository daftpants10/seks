#!/usr/bin/env node
// seks online relay — serves game + collective, relays pyramids via WebSocket
const http = require('http')
const fs   = require('fs')
const path = require('path')
const WebSocket = require('ws')

const PORT   = process.env.PORT || 3000
const PUBLIC = path.join(__dirname, 'public')
const TRACKS = path.join(PUBLIC, 'tracks')
const AUDIO_EXTS = ['.mp3', '.m4a', '.wav', '.ogg', '.flac']
const MIME = { '.mp3':'audio/mpeg', '.m4a':'audio/mp4', '.wav':'audio/wav', '.ogg':'audio/ogg', '.flac':'audio/flac' }

// ── in-memory state ──────────────────────────────────────────────────────────
const pyramids   = new Map()   // id -> latest live pyramid state
const grandPyramid = {          // aggregate of all completed sessions
  sessions: 0,
  phaseTotal: { STILL: 0, FLOW: 0, TENSION: 0 }
}
const PRUNE_MS = 1000 * 60 * 15  // prune inactive after 15 min

// ── HTTP server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0]

  const routes = {
    '/':           'index.html',
    '/game':       'game.html',
    '/collective': 'collective.html',
  }

  const file = routes[urlPath]
  if (file) {
    try {
      const html = fs.readFileSync(path.join(PUBLIC, file), 'utf8')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' })
      return res.end(html)
    } catch { res.writeHead(404); return res.end('not found') }
  }

  // serve a real audio track by number: /track?n=3  → public/tracks/seks_track_3.mp3
  if (urlPath === '/track') {
    const n = parseInt((req.url.split('?')[1]||'').replace(/.*n=/,''), 10)
    if (!n) { res.writeHead(400); return res.end('missing n') }
    let file = null
    for (const ext of AUDIO_EXTS) {
      const f = path.join(TRACKS, `seks_track_${n}${ext}`)
      try { fs.accessSync(f); file = f; break } catch {}
    }
    if (!file) { res.writeHead(404); return res.end('track not found') }
    const stat = fs.statSync(file)
    const ct = MIME[path.extname(file).toLowerCase()] || 'audio/mpeg'
    const range = req.headers.range
    if (range) {
      const [s, e] = range.replace(/bytes=/, '').split('-')
      const start = parseInt(s, 10), end = e ? parseInt(e, 10) : stat.size - 1
      res.writeHead(206, { 'Content-Range':`bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges':'bytes', 'Content-Length':end-start+1, 'Content-Type':ct })
      return fs.createReadStream(file, { start, end }).pipe(res)
    }
    res.writeHead(200, { 'Content-Length':stat.size, 'Content-Type':ct, 'Accept-Ranges':'bytes' })
    return fs.createReadStream(file).pipe(res)
  }

  // list which track numbers have real audio: /tracks-available → [3,8]
  if (urlPath === '/tracks-available') {
    const avail = []
    for (let n = 1; n <= 8; n++) {
      for (const ext of AUDIO_EXTS) {
        try { fs.accessSync(path.join(TRACKS, `seks_track_${n}${ext}`)); avail.push(n); break } catch {}
      }
    }
    res.writeHead(200, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' })
    return res.end(JSON.stringify(avail))
  }

  // collective state (for late-join snapshot)
  if (urlPath === '/state') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    return res.end(JSON.stringify({
      pyramids: [...pyramids.values()],
      grand: grandPyramid
    }))
  }

  // robots
  if (urlPath === '/robots.txt') { res.writeHead(200); return res.end('User-agent: *\nDisallow:') }

  res.writeHead(404); res.end('not found')
})

// ── WebSocket relay ──────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server })
const clients = new Set()

wss.on('connection', ws => {
  clients.add(ws)

  // send current snapshot to new viewer
  ws.send(JSON.stringify({
    type: 'snapshot',
    pyramids: [...pyramids.values()],
    grand: grandPyramid
  }))

  ws.on('message', raw => {
    let d; try { d = JSON.parse(raw.toString()) } catch { return }
    if (!d || !d.type) return

    if (d.type === 'pyramid' && d.id) {
      pyramids.set(d.id, { ...d, seen: Date.now() })
      broadcast(JSON.stringify(d), ws)
    }

    if (d.type === 'session_complete' && d.phases) {
      // accumulate into grand pyramid
      grandPyramid.sessions++
      const total = (d.phases.STILL||0) + (d.phases.FLOW||0) + (d.phases.TENSION||0) || 1
      grandPyramid.phaseTotal.STILL   += (d.phases.STILL   || 0) / total
      grandPyramid.phaseTotal.FLOW    += (d.phases.FLOW    || 0) / total
      grandPyramid.phaseTotal.TENSION += (d.phases.TENSION || 0) / total
      const gMsg = JSON.stringify({ type: 'grand_update', grand: grandPyramid })
      broadcast(gMsg)
      console.log(`△ session complete · grand: ${grandPyramid.sessions} pyramids · ${Math.round(grandPyramid.phaseTotal.FLOW/grandPyramid.sessions*100)}% flow`)
    }
  })

  ws.on('close', () => clients.delete(ws))
  ws.on('error', () => { try { ws.close() } catch {} })
})

function broadcast(msg, except) {
  clients.forEach(c => { if (c !== except && c.readyState === WebSocket.OPEN) { try { c.send(msg) } catch {} } })
}

// prune old inactive pyramids every 5 min
setInterval(() => {
  const now = Date.now()
  for (const [id, p] of pyramids) { if (!p.active && now - (p.seen||0) > PRUNE_MS) pyramids.delete(id) }
}, 1000 * 60 * 5)

server.listen(PORT, () => {
  console.log(`
  ⦿-⦿  seks online
  ────────────────────────────────
  game        → http://localhost:${PORT}/game
  collective  → http://localhost:${PORT}/collective
  state API   → http://localhost:${PORT}/state
  ────────────────────────────────
  PORT ${PORT}  (set via env for Railway/Render)
`)
})
