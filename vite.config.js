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

          let adminLoginHandlerPromise
          let adminSubmissionsHandlerPromise
          let adminSessionHandlerPromise
          let adminLogoutHandlerPromise
          let adminMicrosoftStartHandlerPromise
          let adminMicrosoftCallbackHandlerPromise

          const getAdminLoginHandler = async () => {
            if (!adminLoginHandlerPromise) {
              adminLoginHandlerPromise = import('./api/admin/login.js').then((module) => module.default ?? module)
            }

            return adminLoginHandlerPromise
          }

          const getAdminSubmissionsHandler = async () => {
            if (!adminSubmissionsHandlerPromise) {
              adminSubmissionsHandlerPromise = import('./api/admin/submissions.js').then((module) => module.default ?? module)
            }

            return adminSubmissionsHandlerPromise
          }

          const getAdminSessionHandler = async () => {
            if (!adminSessionHandlerPromise) {
              adminSessionHandlerPromise = import('./api/admin/session.js').then((module) => module.default ?? module)
            }

            return adminSessionHandlerPromise
          }

          const getAdminLogoutHandler = async () => {
            if (!adminLogoutHandlerPromise) {
              adminLogoutHandlerPromise = import('./api/admin/logout.js').then((module) => module.default ?? module)
            }

            return adminLogoutHandlerPromise
          }

          const getAdminMicrosoftStartHandler = async () => {
            if (!adminMicrosoftStartHandlerPromise) {
              adminMicrosoftStartHandlerPromise = import('./api/admin/microsoft/start.js').then((module) => module.default ?? module)
            }

            return adminMicrosoftStartHandlerPromise
          }

          const getAdminMicrosoftCallbackHandler = async () => {
            if (!adminMicrosoftCallbackHandlerPromise) {
              adminMicrosoftCallbackHandlerPromise = import('./api/admin/microsoft/callback.js').then((module) => module.default ?? module)
            }

            return adminMicrosoftCallbackHandlerPromise
          }

          server.middlewares.use('/api/admin/login', async (req, res) => {
            if (req.method === 'POST') {
              req.body = await readRequestBody(req)
            }

            const adminLoginHandler = await getAdminLoginHandler()
            await adminLoginHandler(req, res)
          })

          server.middlewares.use('/api/admin/submissions', async (req, res) => {
            const adminSubmissionsHandler = await getAdminSubmissionsHandler()
            await adminSubmissionsHandler(req, res)
          })

          server.middlewares.use('/api/admin/session', async (req, res) => {
            const adminSessionHandler = await getAdminSessionHandler()
            await adminSessionHandler(req, res)
          })

          server.middlewares.use('/api/admin/logout', async (req, res) => {
            const adminLogoutHandler = await getAdminLogoutHandler()
            await adminLogoutHandler(req, res)
          })

          server.middlewares.use('/api/admin/microsoft/start', async (req, res) => {
            const adminMicrosoftStartHandler = await getAdminMicrosoftStartHandler()
            await adminMicrosoftStartHandler(req, res)
          })

          server.middlewares.use('/api/admin/microsoft/callback', async (req, res) => {
            const adminMicrosoftCallbackHandler = await getAdminMicrosoftCallbackHandler()
            await adminMicrosoftCallbackHandler(req, res)
          })
        },
      },
    ],
  }
})
