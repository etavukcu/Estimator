import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { handleKeepaliveRequest, isCronAuthorized } from './supabaseKeepalive.js'

const SECRET = 'test-cron-secret'

function mockRes() {
  return {
    statusCode: 0,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

function withEnv(values, fn) {
  const previous = new Map()
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key])
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, value] of previous) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    })
}

describe('supabase keep-alive', { concurrency: false }, () => {
test('cron auth requires an exact Bearer CRON_SECRET', () => {
  assert.equal(isCronAuthorized({ headers: { authorization: `Bearer ${SECRET}` } }, SECRET), true)
  assert.equal(isCronAuthorized({ headers: { authorization: `Bearer ${SECRET}` } }, `${SECRET}\n`), true)
  assert.equal(isCronAuthorized({ headers: { authorization: `Bearer ${SECRET}x` } }, SECRET), false)
  assert.equal(isCronAuthorized({ headers: { authorization: 'Bearer wrong-secret-value' } }, SECRET), false)
  assert.equal(isCronAuthorized({ headers: {} }, SECRET), false)
  assert.equal(isCronAuthorized({ headers: { authorization: `Bearer ${SECRET}` } }, ''), false)
})

test('rejects callers that do not present CRON_SECRET and does not call Supabase', async () => {
  await withEnv({ CRON_SECRET: SECRET }, async () => {
    let called = false
    const res = mockRes()
    await handleKeepaliveRequest(
      { method: 'GET', headers: {} },
      res,
      {
        fetchImpl: async () => {
          called = true
          return { ok: true }
        },
      },
    )
    assert.equal(called, false)
    assert.equal(res.statusCode, 401)
    assert.deepEqual(res.body, { ok: false })
  })
})

test('rejects non-GET methods', async () => {
  await withEnv({ CRON_SECRET: SECRET }, async () => {
    const res = mockRes()
    await handleKeepaliveRequest(
      { method: 'POST', headers: { authorization: `Bearer ${SECRET}` } },
      res,
      { fetchImpl: async () => ({ ok: true }) },
    )
    assert.equal(res.statusCode, 405)
    assert.deepEqual(res.body, { ok: false })
  })
})

test('reads one consultation id and stays quiet on success', async () => {
  await withEnv(
    {
      CRON_SECRET: SECRET,
      SUPABASE_URL: 'https://example.supabase.co/',
      SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    },
    async () => {
      const calls = []
      const res = mockRes()
      await handleKeepaliveRequest(
        { method: 'GET', headers: { authorization: `Bearer ${SECRET}` } },
        res,
        {
          fetchImpl: async (url, options = {}) => {
            calls.push({ url: String(url), options })
            return {
              ok: true,
              status: 200,
              json: async () => [{ id: 42, full_name: 'should-not-leak' }],
            }
          },
        },
      )

      assert.equal(calls.length, 1)
      assert.equal(calls[0].options.method, 'GET')
      assert.equal(calls[0].options.body, undefined)
      assert.equal(
        calls[0].url,
        'https://example.supabase.co/rest/v1/consultation_requests?select=id&limit=1',
      )
      assert.equal(calls[0].options.headers.apikey, 'service-role-key')
      assert.equal(calls[0].options.headers.Authorization, 'Bearer service-role-key')
      assert.equal(res.statusCode, 200)
      assert.deepEqual(res.body, { ok: true })
      assert.equal(res.headers['Cache-Control'], 'no-store')
    },
  )
})

test('falls back to the anon key when no service role is configured', async () => {
  await withEnv(
    {
      CRON_SECRET: SECRET,
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    },
    async () => {
      let apiKey = ''
      const res = mockRes()
      await handleKeepaliveRequest(
        { method: 'GET', headers: { authorization: `Bearer ${SECRET}` } },
        res,
        {
          fetchImpl: async (_url, options = {}) => {
            apiKey = options.headers.apikey
            return { ok: true, status: 200 }
          },
        },
      )
      assert.equal(apiKey, 'anon-key')
      assert.equal(res.statusCode, 200)
      assert.deepEqual(res.body, { ok: true })
    },
  )
})

test('reports missing Supabase credentials without calling the network', async () => {
  await withEnv(
    {
      CRON_SECRET: SECRET,
      SUPABASE_URL: undefined,
      VITE_SUPABASE_URL: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      SUPABASE_ANON_KEY: undefined,
      VITE_SUPABASE_ANON_KEY: undefined,
    },
    async () => {
      let called = false
      const res = mockRes()
      await handleKeepaliveRequest(
        { method: 'GET', headers: { authorization: `Bearer ${SECRET}` } },
        res,
        {
          fetchImpl: async () => {
            called = true
            return { ok: true }
          },
        },
      )
      assert.equal(called, false)
      assert.equal(res.statusCode, 500)
      assert.equal(res.body.ok, false)
      assert.match(res.body.error, /SUPABASE_URL/)
    },
  )
})

test('returns 502 when the Supabase read fails', async () => {
  await withEnv(
    {
      CRON_SECRET: SECRET,
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
    },
    async () => {
      const res = mockRes()
      await handleKeepaliveRequest(
        { method: 'GET', headers: { authorization: `Bearer ${SECRET}` } },
        res,
        { fetchImpl: async () => ({ ok: false, status: 401 }) },
      )
      assert.equal(res.statusCode, 502)
      assert.deepEqual(res.body, { ok: false, error: 'Supabase read failed (401).' })
    },
  )
})
})
