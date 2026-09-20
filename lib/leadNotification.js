const DESTINATION_EMAIL = 'info@peacefulhavenhomes.com'
const DEFAULT_FROM = 'Peaceful Haven Homes <noreply@peacefulhavenhomes.com>'
const SOURCE_LABELS = {
  consultation: 'Schedule Consultation',
  pdf_request: 'PDF estimate request',
}

function clean(value, maxLength = 2000) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function asPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function normalizeSelections(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      const row = asPlainObject(item)
      return {
        section: clean(row.section, 200),
        question: clean(row.question, 300),
        answer: clean(row.answer, 300),
      }
    })
    .filter((item) => item.section || item.answer)
}

export function normalizeLead(body = {}) {
  const raw = asPlainObject(body)
  const summary = asPlainObject(raw.estimate_summary)
  const source = raw.source === 'pdf_request' ? 'pdf_request' : 'consultation'
  const createdAt = clean(raw.created_at, 40) || new Date().toISOString()
  const email = clean(raw.email, 254)
  const phone = clean(raw.phone, 40)

  return {
    source,
    fullName: clean(raw.full_name || raw.fullName, 120),
    email,
    phone,
    phoneProvided: Boolean(phone),
    preferredCallbackTime: clean(raw.preferred_callback_time || raw.preferredCallbackTime, 160),
    projectAddress: clean(raw.project_address || raw.projectAddress, 300),
    notes: clean(raw.notes, 2000),
    createdAt,
    projectType: clean(summary.projectType || raw.projectType || raw.projectName, 120),
    finishLevel: clean(summary.finishLevel || raw.finishLevel || raw.tierLabel, 80),
    estimatedRange: clean(summary.estimatedRange || raw.estimatedRange || raw.estimateRange, 120),
    preparedFor: clean(summary.preparedFor, 120),
    selections: normalizeSelections(summary.selections || raw.selections || raw.summary),
    estimateSummary: {
      projectType: clean(summary.projectType || raw.projectType || raw.projectName, 120) || 'Not selected',
      finishLevel: clean(summary.finishLevel || raw.finishLevel || raw.tierLabel, 80) || 'Not selected',
      estimatedRange: clean(summary.estimatedRange || raw.estimatedRange || raw.estimateRange, 120) || 'Not available',
      selections: normalizeSelections(summary.selections || raw.selections || raw.summary),
      preparedFor: clean(summary.preparedFor || raw.full_name || raw.fullName, 120) || 'Prospective Client',
      source,
    },
  }
}

export function validateLead(lead) {
  if (!lead.fullName) {
    return { ok: false, error: 'full_name is required.' }
  }
  if (!lead.email || !isValidEmail(lead.email)) {
    return { ok: false, error: 'A valid email is required.' }
  }
  if (lead.source === 'consultation' && !lead.phone) {
    return { ok: false, error: 'full_name, phone, and email are required.' }
  }
  return { ok: true }
}

function field(label, value) {
  return `${label}: ${value}`
}

export function buildLeadEmail(lead) {
  const sourceLabel = SOURCE_LABELS[lead.source] || lead.source
  const phoneDisplay = lead.phoneProvided ? lead.phone : 'Not provided (optional / blank)'
  const notesDisplay = lead.notes || 'None'
  const projectType = lead.projectType || 'Not selected'
  const finishLevel = lead.finishLevel || 'Not selected'
  const estimatedRange = lead.estimatedRange || 'Not available'
  const selections = lead.selections.length
    ? lead.selections.map((item) => `- ${item.section || item.question || 'Selection'}: ${item.answer}`).join('\n')
    : '- None provided'

  const lines = [
    `A new estimator lead was submitted (${sourceLabel}).`,
    '',
    field('Source', `${sourceLabel} (${lead.source})`),
    field('Name', lead.fullName),
    field('Email', lead.email),
    field('Phone', phoneDisplay),
    field('Project type', projectType),
    field('Finish level', finishLevel),
    field('Estimate range', estimatedRange),
  ]

  if (lead.source === 'consultation') {
    lines.push(field('Preferred callback time', lead.preferredCallbackTime || 'Not provided'))
    lines.push(field('Project address', lead.projectAddress || 'Not provided'))
  }

  lines.push(
    field('Notes', notesDisplay),
    field('Submitted at (UTC)', lead.createdAt),
    '',
    'Estimate selections:',
    selections,
  )

  const htmlRows = [
    ['Source', `${sourceLabel} (${lead.source})`],
    ['Name', lead.fullName],
    ['Email', lead.email],
    ['Phone', phoneDisplay],
    ['Project type', projectType],
    ['Finish level', finishLevel],
    ['Estimate range', estimatedRange],
  ]

  if (lead.source === 'consultation') {
    htmlRows.push(['Preferred callback time', lead.preferredCallbackTime || 'Not provided'])
    htmlRows.push(['Project address', lead.projectAddress || 'Not provided'])
  }

  htmlRows.push(['Notes', notesDisplay], ['Submitted at (UTC)', lead.createdAt])

  const html = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #1f2a37; line-height: 1.5;">
    <h2 style="margin-bottom: 8px;">New estimator lead</h2>
    <p style="margin-top: 0;">${escapeHtml(sourceLabel)}</p>
    <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
      ${htmlRows
        .map(
          ([label, value]) =>
            `<tr><td style="font-weight: bold; vertical-align: top; padding-right: 16px;">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`
        )
        .join('')}
    </table>
    <h3>Estimate selections</h3>
    <ul>
      ${
        lead.selections.length
          ? lead.selections
              .map((item) => `<li>${escapeHtml(item.section || item.question || 'Selection')}: ${escapeHtml(item.answer)}</li>`)
              .join('')
          : '<li>None provided</li>'
      }
    </ul>
  </body>
</html>`

  return {
    to: process.env.LEAD_NOTIFY_TO || DESTINATION_EMAIL,
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    replyTo: isValidEmail(lead.email) ? lead.email : undefined,
    subject: `New ${sourceLabel.toLowerCase()} from ${lead.fullName}${projectType !== 'Not selected' ? ` — ${projectType}` : ''}`,
    text: lines.join('\n'),
    html,
  }
}

export function getEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY || '',
    dryRun: process.env.LEAD_EMAIL_DRY_RUN === 'true',
  }
}

export async function sendLeadEmail(lead, { fetchImpl = fetch } = {}) {
  const email = buildLeadEmail(lead)
  const { apiKey, dryRun } = getEmailConfig()

  if (dryRun) {
    console.log('[lead-email dry-run]', email.subject)
    console.log(email.text)
    return { ok: true, sent: false, dryRun: true, email }
  }

  if (!apiKey) {
    return {
      ok: false,
      sent: false,
      dryRun: false,
      error: 'RESEND_API_KEY is not set. Add it in Vercel Project Settings → Environment Variables.',
    }
  }

  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: email.from,
      to: [email.to],
      reply_to: email.replyTo,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  })

  if (!response.ok) {
    const reason = await response.text()
    console.error('Resend API error:', reason)
    return {
      ok: false,
      sent: false,
      dryRun: false,
      error: `Email provider rejected this submission (${response.status}).`,
    }
  }

  return { ok: true, sent: true, dryRun: false, email }
}

function supabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY
  return { supabaseUrl, serviceRoleKey }
}

export function toConsultationRow(lead) {
  return {
    full_name: lead.fullName,
    phone: lead.phone || 'Not provided',
    email: lead.email,
    preferred_callback_time: lead.preferredCallbackTime || null,
    project_address: lead.projectAddress || null,
    notes: lead.notes || null,
    estimate_summary: lead.estimateSummary,
    created_at: lead.createdAt,
  }
}

export async function saveConsultationRow(lead, { fetchImpl = fetch } = {}) {
  const { supabaseUrl, serviceRoleKey } = supabaseConfig()
  if (!supabaseUrl || !serviceRoleKey) {
    return {
      saved: false,
      skipped: true,
      error: 'Server is missing Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY).',
    }
  }

  const response = await fetchImpl(`${supabaseUrl}/rest/v1/consultation_requests`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(toConsultationRow(lead)),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return { saved: false, skipped: false, error: errorText || 'Unable to save consultation request.' }
  }

  return { saved: true, skipped: false }
}

export async function processLeadBody(body, { fetchImpl = fetch } = {}) {
  const lead = normalizeLead(body)
  const validation = validateLead(lead)
  if (!validation.ok) {
    return { status: 400, payload: { error: validation.error } }
  }

  const { dryRun } = getEmailConfig()
  const save = dryRun
    ? { saved: false, skipped: true }
    : await saveConsultationRow(lead, { fetchImpl })
  if (!dryRun && lead.source === 'consultation' && !save.saved) {
    return { status: save.skipped ? 500 : 502, payload: { error: save.error } }
  }

  const email = await sendLeadEmail(lead, { fetchImpl })
  if (!email.ok) {
    if (lead.source === 'consultation' && save.saved) {
      console.error('Consultation saved, but lead email failed:', email.error)
      return {
        status: 201,
        payload: {
          ok: true,
          saved: true,
          emailSent: false,
          emailError: email.error,
        },
      }
    }
    return { status: 502, payload: { error: email.error, saved: Boolean(save.saved) } }
  }

  return {
    status: 201,
    payload: {
      ok: true,
      saved: Boolean(save.saved),
      emailSent: email.sent,
      dryRun: email.dryRun,
      ...(email.dryRun ? { email: { subject: email.email.subject, text: email.email.text, to: email.email.to, from: email.email.from, replyTo: email.email.replyTo } } : {}),
    },
  }
}

export function setCorsHeaders(res) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body
  }
  if (typeof req.body === 'string' && req.body) {
    return JSON.parse(req.body)
  }

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

export function writeJson(res, status, payload) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(status).json(payload)
    return
  }
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(payload))
}

export async function handleLeadHttpRequest(req, res) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    writeJson(res, 200, { ok: true })
    return
  }

  if (req.method !== 'POST') {
    writeJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  let body
  try {
    body = await readJsonBody(req)
  } catch {
    writeJson(res, 400, { error: 'Invalid JSON body.' })
    return
  }

  try {
    const result = await processLeadBody(body)
    writeJson(res, result.status, result.payload)
  } catch (error) {
    writeJson(res, 500, { error: error instanceof Error ? error.message : 'Unexpected server error.' })
  }
}
