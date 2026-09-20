import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLeadEmail, normalizeLead, processLeadBody, validateLead } from './leadNotification.js'

test('consultation payload requires name, phone, and email', () => {
  const lead = normalizeLead({
    source: 'consultation',
    full_name: 'Eray Test',
    email: 'eray@example.com',
    estimate_summary: { projectType: 'Kitchen Remodel', estimatedRange: '$55,000 - $85,000' },
  })
  assert.equal(validateLead(lead).ok, false)
})

test('pdf_request allows a blank optional phone', () => {
  const lead = normalizeLead({
    source: 'pdf_request',
    full_name: 'Alex Rivera',
    email: 'alex@example.com',
    phone: '',
    estimate_summary: {
      projectType: 'Bathroom Remodel',
      finishLevel: 'Better',
      estimatedRange: '$18,000 - $26,000',
      selections: [{ section: 'Vanity', answer: 'Custom' }],
    },
  })
  assert.equal(validateLead(lead).ok, true)
  assert.equal(lead.phoneProvided, false)
  assert.equal(lead.estimateSummary.source, 'pdf_request')
})

test('email body includes source, contact, and estimate details', () => {
  const lead = normalizeLead({
    source: 'consultation',
    full_name: 'Jordan Lee',
    email: 'jordan@example.com',
    phone: '423-555-0199',
    preferred_callback_time: 'Weekdays after 4',
    project_address: '123 Main St',
    notes: 'Wants a spring start',
    created_at: '2026-09-20T14:00:00.000Z',
    estimate_summary: {
      projectType: 'Kitchen Remodel',
      finishLevel: 'Better',
      estimatedRange: '$55,000 - $85,000',
      selections: [{ section: 'Cabinets', answer: 'Semi-custom' }],
    },
  })
  const email = buildLeadEmail(lead)
  assert.match(email.subject, /schedule consultation/i)
  assert.match(email.text, /Source: Schedule Consultation \(consultation\)/)
  assert.match(email.text, /Name: Jordan Lee/)
  assert.match(email.text, /Email: jordan@example.com/)
  assert.match(email.text, /Phone: 423-555-0199/)
  assert.match(email.text, /Project type: Kitchen Remodel/)
  assert.match(email.text, /Estimate range: \$55,000 - \$85,000/)
  assert.match(email.text, /Notes: Wants a spring start/)
  assert.match(email.text, /Preferred callback time: Weekdays after 4/)
  assert.match(email.text, /Cabinets: Semi-custom/)
  assert.equal(email.replyTo, 'jordan@example.com')
  assert.equal(email.to, 'info@peacefulhavenhomes.com')
  assert.match(email.html, /Jordan Lee/)
})

test('pdf_request email notes a blank optional phone', () => {
  const email = buildLeadEmail(
    normalizeLead({
      source: 'pdf_request',
      full_name: 'Sam Ortiz',
      email: 'sam@example.com',
      estimate_summary: { projectType: 'Home Addition', estimatedRange: '$80,000 - $120,000' },
    })
  )
  assert.match(email.text, /Source: PDF estimate request \(pdf_request\)/)
  assert.match(email.text, /Phone: Not provided \(optional \/ blank\)/)
  assert.equal(email.replyTo, 'sam@example.com')
})

test('processLeadBody dry-run emails without calling Resend or Supabase', async () => {
  const previousDryRun = process.env.LEAD_EMAIL_DRY_RUN
  const previousKey = process.env.RESEND_API_KEY
  process.env.LEAD_EMAIL_DRY_RUN = 'true'
  delete process.env.RESEND_API_KEY

  let fetchCalls = 0
  const result = await processLeadBody(
    {
      source: 'pdf_request',
      full_name: 'Dry Run Lead',
      email: 'dryrun@example.com',
      estimate_summary: { projectType: 'Kitchen Remodel', estimatedRange: '$40,000 - $60,000' },
    },
    {
      fetchImpl: async () => {
        fetchCalls += 1
        throw new Error('network should not be used in dry-run')
      },
    }
  )

  assert.equal(result.status, 201)
  assert.equal(result.payload.ok, true)
  assert.equal(result.payload.dryRun, true)
  assert.equal(result.payload.emailSent, false)
  assert.match(result.payload.email.text, /Dry Run Lead/)
  assert.equal(fetchCalls, 0)

  if (previousDryRun === undefined) delete process.env.LEAD_EMAIL_DRY_RUN
  else process.env.LEAD_EMAIL_DRY_RUN = previousDryRun
  if (previousKey === undefined) delete process.env.RESEND_API_KEY
  else process.env.RESEND_API_KEY = previousKey
})

test('consultation still saves when Resend is missing after a successful insert', async () => {
  const previousDryRun = process.env.LEAD_EMAIL_DRY_RUN
  const previousKey = process.env.RESEND_API_KEY
  const previousUrl = process.env.SUPABASE_URL
  const previousService = process.env.SUPABASE_SERVICE_ROLE_KEY
  delete process.env.LEAD_EMAIL_DRY_RUN
  delete process.env.RESEND_API_KEY
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'

  const result = await processLeadBody(
    {
      source: 'consultation',
      full_name: 'Saved Lead',
      email: 'saved@example.com',
      phone: '423-555-0100',
      estimate_summary: { projectType: 'Bathroom Remodel', estimatedRange: '$15,000 - $22,000' },
    },
    {
      fetchImpl: async (url) => {
        if (String(url).includes('supabase.co')) {
          return { ok: true, text: async () => '' }
        }
        throw new Error(`unexpected fetch: ${url}`)
      },
    }
  )

  assert.equal(result.status, 201)
  assert.equal(result.payload.ok, true)
  assert.equal(result.payload.saved, true)
  assert.equal(result.payload.emailSent, false)
  assert.match(result.payload.emailError, /RESEND_API_KEY/)

  if (previousDryRun === undefined) delete process.env.LEAD_EMAIL_DRY_RUN
  else process.env.LEAD_EMAIL_DRY_RUN = previousDryRun
  if (previousKey === undefined) delete process.env.RESEND_API_KEY
  else process.env.RESEND_API_KEY = previousKey
  if (previousUrl === undefined) delete process.env.SUPABASE_URL
  else process.env.SUPABASE_URL = previousUrl
  if (previousService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
  else process.env.SUPABASE_SERVICE_ROLE_KEY = previousService
})

test('consultation posts to Supabase then Resend with reply_to set', async () => {
  const previousDryRun = process.env.LEAD_EMAIL_DRY_RUN
  const previousKey = process.env.RESEND_API_KEY
  const previousUrl = process.env.SUPABASE_URL
  const previousService = process.env.SUPABASE_SERVICE_ROLE_KEY
  const previousFrom = process.env.EMAIL_FROM
  delete process.env.LEAD_EMAIL_DRY_RUN
  process.env.RESEND_API_KEY = 're_test_key'
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
  process.env.EMAIL_FROM = 'Peaceful Haven Homes <noreply@peacefulhavenhomes.com>'

  const urls = []
  const bodies = []
  const result = await processLeadBody(
    {
      source: 'consultation',
      full_name: 'Casey Nguyen',
      email: 'casey@example.com',
      phone: '423-555-0144',
      notes: 'Call after 5',
      estimate_summary: {
        projectType: 'Mother-in-Law Suite Remodel',
        finishLevel: 'Best',
        estimatedRange: '$90,000 - $140,000',
        selections: [{ section: 'Kitchen', answer: 'Full kitchen' }],
      },
    },
    {
      fetchImpl: async (url, options = {}) => {
        urls.push(String(url))
        bodies.push(options.body ? JSON.parse(options.body) : null)
        return { ok: true, text: async () => '' }
      },
    }
  )

  assert.equal(result.status, 201)
  assert.equal(result.payload.emailSent, true)
  assert.equal(result.payload.saved, true)
  assert.equal(urls[0], 'https://example.supabase.co/rest/v1/consultation_requests')
  assert.equal(urls[1], 'https://api.resend.com/emails')
  assert.equal(bodies[0].full_name, 'Casey Nguyen')
  assert.equal(bodies[0].estimate_summary.source, 'consultation')
  assert.deepEqual(bodies[1].to, ['info@peacefulhavenhomes.com'])
  assert.equal(bodies[1].reply_to, 'casey@example.com')
  assert.equal(bodies[1].from, 'Peaceful Haven Homes <noreply@peacefulhavenhomes.com>')
  assert.match(bodies[1].text, /Source: Schedule Consultation \(consultation\)/)
  assert.match(bodies[1].html, /Casey Nguyen/)

  if (previousDryRun === undefined) delete process.env.LEAD_EMAIL_DRY_RUN
  else process.env.LEAD_EMAIL_DRY_RUN = previousDryRun
  if (previousKey === undefined) delete process.env.RESEND_API_KEY
  else process.env.RESEND_API_KEY = previousKey
  if (previousUrl === undefined) delete process.env.SUPABASE_URL
  else process.env.SUPABASE_URL = previousUrl
  if (previousService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
  else process.env.SUPABASE_SERVICE_ROLE_KEY = previousService
  if (previousFrom === undefined) delete process.env.EMAIL_FROM
  else process.env.EMAIL_FROM = previousFrom
})
