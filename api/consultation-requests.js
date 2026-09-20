import { handleLeadHttpRequest } from '../lib/leadNotification.js'

export default async function handler(req, res) {
  await handleLeadHttpRequest(req, res)
}
