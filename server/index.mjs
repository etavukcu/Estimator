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
const DESTINATION_EMAIL = 'info@peacefulhavenhomes.com'

function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

async function parseRequestBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  const raw = Buffer.concat(chunks).toString('utf8')
  return JSON.parse(raw)
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

async function handleLeadSubmission(req, res) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'Peaceful Haven Estimator <onboarding@resend.dev>'

  let body
  try {
    body = await parseRequestBody(req)
  } catch {
    return sendJson(res, 400, { error: 'Request body must be valid JSON.' })
  }

  const fullName = clean(body?.fullName)
  const email = clean(body?.email)
  const phone = clean(body?.phone)
  const notes = clean(body?.notes)
  const projectName = clean(body?.projectName)
  const tierLabel = clean(body?.tierLabel)
  const estimateRange = clean(body?.estimateRange)
  const summary = Array.isArray(body?.summary) ? body.summary : []

  if (!fullName || !phone || !projectName || !tierLabel || !estimateRange || !isValidEmail(email)) {
    return sendJson(res, 400, { error: 'Please provide complete contact details before continuing.' })
  }

  if (!apiKey) {
    return sendJson(res, 500, { error: 'Email service is not configured on the server.' })
  }

  const safeSummary = summary
    .map((item) => ({ section: clean(item?.section), answer: clean(item?.answer) }))
    .filter((item) => item.section && item.answer)

  const lines = [
    'New estimator lead submitted.',
    '',
    `Name: ${fullName}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Project: ${projectName}`,
    `Tier: ${tierLabel}`,
    `Planning range: ${estimateRange}`,
    '',
    'Selections:',
    ...safeSummary.map((item) => `- ${item.section}: ${item.answer}`),
    '',
    `Client notes: ${notes || 'None'}`,
    `Submitted at (UTC): ${new Date().toISOString()}`,
  ]

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [DESTINATION_EMAIL],
        reply_to: email,
        subject: `New ${projectName} estimator lead from ${fullName}`,
        text: lines.join('\n'),
      }),
    })

    if (!emailResponse.ok) {
      const errorBody = await emailResponse.text()
      console.error('Resend API error:', errorBody)
      return sendJson(res, 502, { error: 'Email provider rejected this submission. Please try again.' })
    }

    return sendJson(res, 200, { ok: true })
  } catch (error) {
    console.error('Email send failed:', error)
    return sendJson(res, 500, { error: 'Failed to send your submission. Please try again.' })
  }
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

  if (req.method === 'POST' && url.pathname === '/api/estimate-leads') {
    await handleLeadSubmission(req, res)
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
