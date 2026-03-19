import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const distPath = path.join(projectRoot, 'dist')

const PORT = Number(process.env.PORT || 8787)
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

function sendApiJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(payload))
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath)
  if (ext === '.js') return 'text/javascript; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.json') return 'application/json; charset=utf-8'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.ico') return 'image/x-icon'
  if (ext === '.html') return 'text/html; charset=utf-8'
  return 'application/octet-stream'
}


function serveStatic(reqPath, res) {
  const normalized = reqPath === '/' ? '/index.html' : reqPath
  const filePath = path.join(distPath, normalized)

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': contentTypeFor(filePath) })
    createReadStream(filePath).pipe(res)
    return true
  }

  return false
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS' && url.pathname === '/api/consultation-requests') {
    sendApiJson(res, 200, {})
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/consultation-requests') {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      sendApiJson(res, 500, { error: 'Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.' })
      return
    }

    let payload
    try {
      payload = await readRequestBody(req)
    } catch {
      sendApiJson(res, 400, { error: 'Invalid JSON body.' })
      return
    }

    if (!payload.full_name || !payload.phone || !payload.email) {
      sendApiJson(res, 400, { error: 'full_name, phone, and email are required.' })
      return
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/consultation_requests`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      sendApiJson(res, response.status, { error: errorText || 'Unable to save consultation request.' })
      return
    }

    sendApiJson(res, 201, { ok: true })
    return
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  if (serveStatic(url.pathname, res)) return

  try {
    const html = await readFile(path.join(distPath, 'index.html'), 'utf8')
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  } catch {
    sendJson(res, 500, { error: 'Build output not found. Run `npm run build` first.' })
  }
})

server.listen(PORT, () => {
  console.log(`Estimator server running at http://localhost:${PORT}`)
})
