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

          let adminAuthHandlerPromise
          let adminSubmissionsHandlerPromise
          let adminTicketsHandlerPromise
          let adminUsersHandlerPromise
          let adminMicrosoftHandlerPromise
          let portalSignupHandlerPromise
          let portalLoginHandlerPromise
          let portalSessionHandlerPromise
          let portalTicketsHandlerPromise

          const getAdminAuthHandler = async () => {
            if (!adminAuthHandlerPromise) {
              adminAuthHandlerPromise = import('./api/admin/auth.js').then((module) => module.default ?? module)
            }

            return adminAuthHandlerPromise
          }

          const getAdminSubmissionsHandler = async () => {
            if (!adminSubmissionsHandlerPromise) {
              adminSubmissionsHandlerPromise = import('./api/admin/submissions.js').then((module) => module.default ?? module)
            }

            return adminSubmissionsHandlerPromise
          }

          const getAdminTicketsHandler = async () => {
            if (!adminTicketsHandlerPromise) {
              adminTicketsHandlerPromise = import('./api/admin/tickets.js').then((module) => module.default ?? module)
            }

            return adminTicketsHandlerPromise
          }

          const getAdminUsersHandler = async () => {
            if (!adminUsersHandlerPromise) {
              adminUsersHandlerPromise = import('./api/admin/users.js').then((module) => module.default ?? module)
            }

            return adminUsersHandlerPromise
          }

          const getAdminMicrosoftHandler = async () => {
            if (!adminMicrosoftHandlerPromise) {
              adminMicrosoftHandlerPromise = import('./api/admin/microsoft.js').then((module) => module.default ?? module)
            }

            return adminMicrosoftHandlerPromise
          }

          const getPortalSignupHandler = async () => {
            if (!portalSignupHandlerPromise) {
              portalSignupHandlerPromise = import('./api/portal/signup.js').then((module) => module.default ?? module)
            }

            return portalSignupHandlerPromise
          }

          const getPortalLoginHandler = async () => {
            if (!portalLoginHandlerPromise) {
              portalLoginHandlerPromise = import('./api/portal/login.js').then((module) => module.default ?? module)
            }

            return portalLoginHandlerPromise
          }

          const getPortalSessionHandler = async () => {
            if (!portalSessionHandlerPromise) {
              portalSessionHandlerPromise = import('./api/portal/session.js').then((module) => module.default ?? module)
            }

            return portalSessionHandlerPromise
          }

          const getPortalTicketsHandler = async () => {
            if (!portalTicketsHandlerPromise) {
              portalTicketsHandlerPromise = import('./api/portal/tickets.js').then((module) => module.default ?? module)
            }

            return portalTicketsHandlerPromise
          }

          server.middlewares.use('/api/admin/login', async (req, res) => {
            if (req.method === 'POST') {
              req.body = await readRequestBody(req)
              req.url = '/api/admin/auth?action=login'
            }

            const adminAuthHandler = await getAdminAuthHandler()
            await adminAuthHandler(req, res)
          })

          server.middlewares.use('/api/admin/session', async (req, res) => {
            req.url = '/api/admin/auth?action=session'

            const adminAuthHandler = await getAdminAuthHandler()
            await adminAuthHandler(req, res)
          })

          server.middlewares.use('/api/admin/logout', async (req, res) => {
            if (req.method === 'POST') {
              req.body = { action: 'logout' }
              req.url = '/api/admin/auth?action=logout'
            }

            const adminAuthHandler = await getAdminAuthHandler()
            await adminAuthHandler(req, res)
          })

          server.middlewares.use('/api/admin/submissions', async (req, res) => {
            const adminSubmissionsHandler = await getAdminSubmissionsHandler()
            await adminSubmissionsHandler(req, res)
          })

          server.middlewares.use('/api/admin/tickets', async (req, res) => {
            if (req.method === 'POST') {
              req.body = await readRequestBody(req)
            }

            const adminTicketsHandler = await getAdminTicketsHandler()
            await adminTicketsHandler(req, res)
          })

          server.middlewares.use('/api/admin/users', async (req, res) => {
            if (req.method === 'POST') {
              req.body = await readRequestBody(req)
            }

            const adminUsersHandler = await getAdminUsersHandler()
            await adminUsersHandler(req, res)
          })

          server.middlewares.use('/api/admin/microsoft/start', async (req, res) => {
            req.url = '/api/admin/microsoft?action=start'

            const adminMicrosoftHandler = await getAdminMicrosoftHandler()
            await adminMicrosoftHandler(req, res)
          })

          server.middlewares.use('/api/admin/microsoft/callback', async (req, res) => {
            req.url = '/api/admin/microsoft?action=callback'

            const adminMicrosoftHandler = await getAdminMicrosoftHandler()
            await adminMicrosoftHandler(req, res)
          })

          server.middlewares.use('/api/portal/signup', async (req, res) => {
            if (req.method === 'POST') {
              req.body = await readRequestBody(req)
            }

            const portalSignupHandler = await getPortalSignupHandler()
            await portalSignupHandler(req, res)
          })

          server.middlewares.use('/api/portal/login', async (req, res) => {
            if (req.method === 'POST') {
              req.body = await readRequestBody(req)
            }

            const portalLoginHandler = await getPortalLoginHandler()
            await portalLoginHandler(req, res)
          })

          server.middlewares.use('/api/portal/session', async (req, res) => {
            const portalSessionHandler = await getPortalSessionHandler()
            await portalSessionHandler(req, res)
          })

          server.middlewares.use('/api/portal/logout', async (req, res) => {
            req.url = '/api/portal/session?mode=logout'

            const portalSessionHandler = await getPortalSessionHandler()
            await portalSessionHandler(req, res)
          })

          server.middlewares.use('/api/portal/tickets', async (req, res) => {
            if (req.method === 'POST') {
              req.body = await readRequestBody(req)
            }

            const portalTicketsHandler = await getPortalTicketsHandler()
            await portalTicketsHandler(req, res)
          })
        },
      },
    ],
  }
})
