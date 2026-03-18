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

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
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
