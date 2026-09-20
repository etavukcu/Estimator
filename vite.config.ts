import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { leadNotificationPlugin } from './vite-lead-api.mjs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react(), leadNotificationPlugin(env)],
  }
})
