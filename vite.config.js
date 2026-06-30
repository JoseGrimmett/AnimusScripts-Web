import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
        apply: 'serve',
        configureServer(server) {
          let contactHandlerPromise

          const getContactHandler = async () => {
            if (!contactHandlerPromise) {
              contactHandlerPromise = import('./api/contact.js').then((module) => module.default ?? module)
            }

            return contactHandlerPromise
          }

          server.middlewares.use('/api/contact', async (req, res) => {
            if (req.method === 'POST') {
              req.body = await readRequestBody(req)
            }

            const contactHandler = await getContactHandler()
            await contactHandler(req, res)
          })

          let submissionsHandlerPromise

          const getSubmissionsHandler = async () => {
            if (!submissionsHandlerPromise) {
              submissionsHandlerPromise = import('./api/submissions.js').then((module) => module.default ?? module)
            }

            return submissionsHandlerPromise
          }

          server.middlewares.use('/api/submissions', async (req, res) => {
            const submissionsHandler = await getSubmissionsHandler()
            await submissionsHandler(req, res)
          })
        },
      },
    ],
  }
})
