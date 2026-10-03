import { timingSafeEqual } from 'node:crypto'

function headerValue(req, name) {
  const headers = req?.headers || {}
  const raw = headers[name] ?? headers[name.toLowerCase()]
  if (Array.isArray(raw)) return raw[0] || ''
  return typeof raw === 'string' ? raw : ''
}

export function isCronAuthorized(req, secret = process.env.CRON_SECRET) {
  if (typeof secret !== 'string') return false
  const trimmed = secret.trim()
  if (!trimmed) return false
  const header = headerValue(req, 'authorization').trim()
  const expected = `Bearer ${trimmed}`
  const actualBuf = Buffer.from(header)
  const expectedBuf = Buffer.from(expected)
  if (actualBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(actualBuf, expectedBuf)
}

function supabaseConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  return { supabaseUrl, apiKey }
}

export async function pingConsultationRequests({ fetchImpl = fetch } = {}) {
  const { supabaseUrl, apiKey } = supabaseConfig()
  if (!supabaseUrl || !apiKey) {
    return {
      ok: false,
      status: 500,
      error:
        'Server is missing Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY).',
    }
  }

  const endpoint = `${supabaseUrl}/rest/v1/consultation_requests?select=id&limit=1`
  let response
  try {
    response = await fetchImpl(endpoint, {
      method: 'GET',
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    })
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : 'Supabase keep-alive request failed.',
    }
  }

  if (!response?.ok) {
    const status = response?.status ?? 'unknown'
    return { ok: false, status: 502, error: `Supabase read failed (${status}).` }
  }

  return { ok: true, status: 200 }
}

function writeJson(res, status, payload) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Cache-Control', 'no-store')
  }
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(status).json(payload)
    return
  }
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(JSON.stringify(payload))
}

export async function handleKeepaliveRequest(req, res, { fetchImpl = fetch } = {}) {
  if (req.method !== 'GET') {
    writeJson(res, 405, { ok: false })
    return
  }

  if (!isCronAuthorized(req)) {
    writeJson(res, 401, { ok: false })
    return
  }

  const result = await pingConsultationRequests({ fetchImpl })
  writeJson(res, result.status, result.ok ? { ok: true } : { ok: false, error: result.error })
}
