const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const directSupabaseUrl = import.meta.env.VITE_SUPABASE_URL
const directSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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
      return 'Consultation API endpoint not found. Set VITE_API_BASE_URL to your server URL or provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    }
    return text
  } catch {
    return fallback
  }
}

async function postToServerApi(payload: Record<string, unknown>) {
  const endpoint = `${apiBaseUrl}/api/consultation-requests`
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

async function postDirectToSupabase(payload: Record<string, unknown>) {
  if (!directSupabaseUrl || !directSupabaseAnonKey) return null
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
    if (apiResponse.ok) return
  } catch {
    // Fall through and try direct Supabase if configured.
  }

  const directResponse = await postDirectToSupabase(payload)
  if (directResponse?.ok) return
  if (directResponse && !directResponse.ok) {
    throw new Error(await parseErrorMessage(directResponse))
  }

  if (apiResponse) {
    throw new Error(await parseErrorMessage(apiResponse))
  }

  throw new Error('Unable to reach the consultation service. Check your API URL or Supabase configuration.')
}
