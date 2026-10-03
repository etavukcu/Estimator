import { handleKeepaliveRequest } from '../../lib/supabaseKeepalive.js'

export default async function handler(req, res) {
  await handleKeepaliveRequest(req, res)
}
