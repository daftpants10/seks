#!/usr/bin/env node
const http = require('http')
const fs   = require('fs')
const path = require('path')
const WebSocket = require('ws')

const PORT   = process.env.PORT || 3000
const PUBLIC = path.join(__dirname, 'public')
const TRACKS = path.join(PUBLIC, 'tracks')
const DATA   = path.join(__dirname, 'data')
const SHARED_PATH = path.join(DATA, 'shared.json')
const EVENTS_PATH = path.join(DATA, 'events.json')
const AUDIO_EXTS = ['.mp3', '.m4a', '.wav', '.ogg', '.flac']
const MIME = { '.mp3':'audio/mpeg', '.m4a':'audio/mp4', '.wav':'audio/wav', '.ogg':'audio/ogg', '.flac':'audio/flac' }
const ADMIN_PASS = process.env.ADMIN_PASS || 'seks'

// ── persistent shared pyramids ───────────────────────────────────────────────
let shared = []
const grandPyramid = { sessions: 0, phaseTotal: { STILL: 0, FLOW: 0, TENSION: 0 } }

function loadShared() {
  try {
    const raw = JSON.parse(fs.readFileSync(SHARED_PATH, 'utf8'))
    shared = raw.pyramids || []
    Object.assign(grandPyramid, raw.grand || {})
  } catch {}
}
function saveShared() {
  try {
    fs.mkdirSync(DATA, { recursive: true })
    fs.writeFileSync(SHARED_PATH, JSON.stringify({ pyramids: shared, grand: grandPyramid }))
  } catch {}
}
loadShared()
console.log(`loaded ${shared.length} shared pyramids`)

// ── events ───────────────────────────────────────────────────────────────────
let events = []
function loadEvents() {
  try {
    events = JSON.parse(fs.readFileSync(EVENTS_PATH, 'utf8'))
    if (!events.length) throw new Error('empty')
  } catch {
    events = [{ id: 'default', label: 'the game', createdAt: Date.now(), active: true }]
    saveEvents()
  }
}
function saveEvents() {
  try {
    fs.mkdirSync(DATA, { recursive: true })
    fs.writeFileSync(EVENTS_PATH, JSON.stringify(events))
  } catch {}
}
loadEvents()
console.log(`loaded ${events.length} events`)

function readBody(req) {
  return new Promise(resolve => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())) } catch { resolve(null) }
    })
  })
}

// ── HTTP server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0]

  const routes = { '/':'index.html', '/game':'game.html', '/collective':'collective.html', '/admin':'admin.html' }
  const file = routes[urlPath]
  if (file) {
    try {
      const html = fs.readFileSync(path.join(PUBLIC, file), 'utf8')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' })
      return res.end(html)
    } catch { res.writeHead(404); return res.end('not found') }
  }

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

  if (urlPath === '/state') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    return res.end(JSON.stringify({ shared, grand: grandPyramid }))
  }

  // ── events API (public) ──────────────────────────────────────────────────
  if (urlPath === '/events') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    return res.end(JSON.stringify(events.filter(e => e.active)))
  }

  // ── admin: auth ──────────────────────────────────────────────────────────
  if (urlPath === '/admin/auth' && req.method === 'POST') {
    const body = await readBody(req)
    const ok = !!(body && body.password === ADMIN_PASS)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ ok }))
  }

  // ── admin: list all events ───────────────────────────────────────────────
  if (urlPath === '/admin/events' && req.method === 'GET') {
    if (req.headers['x-admin-pass'] !== ADMIN_PASS) { res.writeHead(401); return res.end('unauthorized') }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify(events))
  }

  // ── admin: create event ──────────────────────────────────────────────────
  if (urlPath === '/admin/event' && req.method === 'POST') {
    if (req.headers['x-admin-pass'] !== ADMIN_PASS) { res.writeHead(401); return res.end('unauthorized') }
    const body = await readBody(req)
    if (!body || !body.label) { res.writeHead(400); return res.end('missing label') }
    const ev = { id: 'evt_' + Date.now().toString(36), label: body.label.slice(0, 60), createdAt: Date.now(), active: true }
    events.push(ev)
    saveEvents()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify(ev))
  }

  // ── admin: toggle event active ───────────────────────────────────────────
  if (urlPath === '/admin/event' && req.method === 'PATCH') {
    if (req.headers['x-admin-pass'] !== ADMIN_PASS) { res.writeHead(401); return res.end('unauthorized') }
    const body = await readBody(req)
    if (!body || !body.id) { res.writeHead(400); return res.end('missing id') }
    const ev = events.find(e => e.id === body.id)
    if (!ev) { res.writeHead(404); return res.end('not found') }
    ev.active = !!body.active
    saveEvents()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify(ev))
  }

  if (urlPath === '/robots.txt') { res.writeHead(200); return res.end('User-agent: *\nDisallow:') }
  res.writeHead(404); res.end('not found')
})

// ── WebSocket ────────────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server })
const clients = new Set()

wss.on('connection', ws => {
  clients.add(ws)
  ws.send(JSON.stringify({ type: 'snapshot', shared, grand: grandPyramid }))

  ws.on('message', raw => {
    let d; try { d = JSON.parse(raw.toString()) } catch { return }
    if (!d || !d.type) return

    if (d.type === 'pyramid' && d.id) {
      return
    }

    if (d.type === 'share' && d.id && d.phases) {
      const entry = {
        id: d.id,
        phases: d.phases,
        total: d.total || 0,
        shareSize: d.shareSize ?? 1,
        eventId: d.eventId || 'default',
        sharedAt: Date.now()
      }
      shared.push(entry)
      grandPyramid.sessions++
      const t = (d.phases.STILL||0) + (d.phases.FLOW||0) + (d.phases.TENSION||0) || 1
      grandPyramid.phaseTotal.STILL   += (d.phases.STILL   || 0) / t
      grandPyramid.phaseTotal.FLOW    += (d.phases.FLOW    || 0) / t
      grandPyramid.phaseTotal.TENSION += (d.phases.TENSION || 0) / t
      saveShared()
      broadcast(JSON.stringify({ type: 'shared_pyramid', pyramid: entry, grand: grandPyramid }))
      console.log(`△ shared · ${shared.length} total · ${Math.round(grandPyramid.phaseTotal.FLOW/(grandPyramid.sessions||1)*100)}% collective flow`)
    }
  })

  ws.on('close', () => clients.delete(ws))
  ws.on('error', () => { try { ws.close() } catch {} })
})

function broadcast(msg, except) {
  clients.forEach(c => { if (c !== except && c.readyState === WebSocket.OPEN) { try { c.send(msg) } catch {} } })
}

server.listen(PORT, () => {
  console.log(`
  ⦿-⦿  seks online
  ────────────────────────────────
  game        → http://localhost:${PORT}/game
  collective  → http://localhost:${PORT}/collective
  admin       → http://localhost:${PORT}/admin
  state API   → http://localhost:${PORT}/state
  ────────────────────────────────
  PORT ${PORT}  ·  ADMIN_PASS=${ADMIN_PASS==='seks'?'(default)':'(set)'}
`)
})
