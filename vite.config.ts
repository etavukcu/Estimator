import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function parseBody(req: import('node:http').IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'lead-email-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.method !== 'POST' || req.url !== '/api/estimate-leads') {
              next()
              return
            }

            const apiKey = process.env.RESEND_API_KEY || env.RESEND_API_KEY
            const from = process.env.EMAIL_FROM || env.EMAIL_FROM || 'Peaceful Haven Estimator <onboarding@resend.dev>'

            if (!apiKey) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'RESEND_API_KEY is missing. Add it to your environment.' }))
              return
            }

            try {
              const body = await parseBody(req)
              const fullName = clean(body?.fullName)
              const email = clean(body?.email)
              const phone = clean(body?.phone)
              const notes = clean(body?.notes)
              const projectName = clean(body?.projectName)
              const tierLabel = clean(body?.tierLabel)
              const estimateRange = clean(body?.estimateRange)
              const summary = Array.isArray(body?.summary) ? body.summary : []

              if (!fullName || !phone || !projectName || !tierLabel || !estimateRange || !isValidEmail(email)) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Please provide complete contact details before continuing.' }))
                return
              }

              const safeSummary = summary
                .map((item) => ({ section: clean(item?.section), answer: clean(item?.answer) }))
                .filter((item) => item.section && item.answer)

              const message = [
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
              ].join('\n')

              const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from,
                  to: ['info@peacefulhavenhomes.com'],
                  reply_to: email,
                  subject: `New ${projectName} estimator lead from ${fullName}`,
                  text: message,
                }),
              })

              if (!emailResponse.ok) {
                const reason = await emailResponse.text()
                res.statusCode = 502
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: `Email provider rejected this submission. ${reason}` }))
                return
              }

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to send submission.' }))
            }
          })
        },
      },
    ],
  }
})
