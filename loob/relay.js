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

const HTTP_PORT = 3000
const SOMA_PORT = 8765
const HTML_FILE = path.join(__dirname, 'the-8.html')

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
    const track = findTrack()
    if (!track) { res.writeHead(404); res.end('no audio file in loob/'); return }
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
})
