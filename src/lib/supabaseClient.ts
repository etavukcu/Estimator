const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function assertSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
}

export async function insertConsultationRequest(payload: Record<string, unknown>) {
  assertSupabaseEnv()

  const response = await fetch(`${supabaseUrl}/rest/v1/consultation_requests`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  })

  if (response.ok) return

  let message = 'Unable to submit your consultation request at this time.'
  try {
    const details = await response.json()
    message = details.message || details.error_description || details.error || message
  } catch {
    // Ignore JSON parsing issues and return the default message.
  }

  throw new Error(message)
}
