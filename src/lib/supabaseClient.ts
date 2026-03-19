const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export async function insertConsultationRequest(payload: Record<string, unknown>) {
  const endpoint = `${apiBaseUrl}/api/consultation-requests`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
