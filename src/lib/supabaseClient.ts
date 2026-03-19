const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const DEFAULT_SUPABASE_URL = 'https://hmtfftkinidggkfbjytj.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdGZmdGtpbmlkZ2drZmJqeXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MjA3NzgsImV4cCI6MjA4OTQ5Njc3OH0.FXnLRoJ6OMzQsMiqvkRAO9X6Sk9i5yTsMLcivTZAYP8'

const directSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const directSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

async function parseErrorMessage(response: Response) {
  const fallback = `Unable to submit your consultation request right now (HTTP ${response.status}).`
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      const details = await response.json()
      return details.message || details.error_description || details.error || fallback
    } catch {
      return fallback
    }
  }

  try {
    const text = await response.text()
    if (!text) return fallback
    if (text.startsWith('<!doctype html') || text.startsWith('<html')) {
      return 'Consultation API endpoint not found. The app will automatically retry with the configured Supabase project.'
    }
    return text
  } catch {
    return fallback
  }
}

async function postToServerApi(payload: Record<string, unknown>) {
  const endpoint = apiBaseUrl ? `${apiBaseUrl}/api/consultation-requests` : '/api/consultation-requests'
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

async function postDirectToSupabase(payload: Record<string, unknown>) {
  return fetch(`${directSupabaseUrl}/rest/v1/consultation_requests`, {
    method: 'POST',
    headers: {
      apikey: directSupabaseAnonKey,
      Authorization: `Bearer ${directSupabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  })
}

export async function insertConsultationRequest(payload: Record<string, unknown>) {
  let apiResponse: Response | null = null
  try {
    apiResponse = await postToServerApi(payload)
    if (apiResponse?.ok) return
  } catch {
    // Fall through and try direct Supabase.
  }

  const directResponse = await postDirectToSupabase(payload)
  if (directResponse?.ok) return
  if (directResponse && !directResponse.ok) {
    throw new Error(await parseErrorMessage(directResponse))
  }

  if (apiResponse) {
    throw new Error(await parseErrorMessage(apiResponse))
  }

  throw new Error('Consultation submit endpoint is unavailable right now. Please try again in a moment.')
}
