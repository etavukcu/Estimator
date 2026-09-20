import { handleLeadHttpRequest } from './lib/leadNotification.js'

function applyLocalEnv(env) {
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value
  }
}

function isConsultationApi(url) {
  const path = (url || '').split('?')[0]
  return path === '/api/consultation-requests'
}

export function leadNotificationPlugin(env = {}) {
  applyLocalEnv(env)
  return {
    name: 'lead-notification-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!isConsultationApi(req.url)) {
          next()
          return
        }
        await handleLeadHttpRequest(req, res)
      })
    },
  }
}
