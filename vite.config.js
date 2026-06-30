import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)
const contactHandler = require('../api/contact.js')
const currentDir = dirname(fileURLToPath(import.meta.url))

const readRequestBody = (req) =>
  new Promise((resolve, reject) => {
    let data = ''

    req.on('data', (chunk) => {
      data += chunk
    })

    req.on('end', () => resolve(data))
    req.on('error', reject)
  })

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  Object.assign(globalThis['process'].env, loadEnv(mode, currentDir, ''))

  return {
    plugins: [
      react(),
      {
        name: 'local-contact-api',
        configureServer(server) {
          server.middlewares.use('/api/contact', async (req, res, next) => {
            if (req.url && req.url !== '/' && req.url !== '') {
              next()
              return
            }

            if (req.method === 'POST') {
              req.body = await readRequestBody(req)
            }

            await contactHandler(req, res)
          })
        },
      },
    ],
  }
})
