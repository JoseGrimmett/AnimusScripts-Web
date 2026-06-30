import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { storeSubmission } = require('../server/contactStore.cjs')
const env = globalThis.process?.env || {}

const RESEND_API_URL = 'https://api.resend.com/emails'
const CONTACT_TO_EMAIL = env.CONTACT_TO_EMAIL || 'info@animusscripts.com'
const RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL || 'Animus Scripts <onboarding@resend.dev>'

function createRequestId() {
  return `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function parseBody(body) {
  if (!body) {
    return {}
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return {}
    }
  }

  return body
}

function sendJson(res, statusCode, payload) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload)
  }

  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
  return payload
}

function toText(payload) {
  if (payload.kind === 'lead') {
    return [
      'New Animus Scripts lead capture',
      '',
      `Email: ${payload.email || 'Not provided'}`,
      `Context: ${payload.context || 'Unknown'}`,
      `Submitted: ${new Date().toISOString()}`,
    ].join('\n')
  }

  return [
    'New Animus Scripts contact inquiry',
    '',
    `Name: ${payload.name || 'Not provided'}`,
    `Company: ${payload.company || 'Not provided'}`,
    `Email: ${payload.email || 'Not provided'}`,
    '',
    'Process to improve:',
    payload.processNeedsImprovement || 'Not provided',
    '',
    'Current tools or systems:',
    payload.currentTools || 'Not provided',
    '',
    `Timeline: ${payload.timeline || 'Not specified'}`,
    `Submitted: ${new Date().toISOString()}`,
  ].join('\n')
}

async function sendNotification(payload, requestId) {
  if (!env.RESEND_API_KEY) {
    console.warn(`[contact-api] ${requestId} notification skipped because RESEND_API_KEY is not configured`)
    return { notified: false, skipped: true }
  }

  const subject = payload.kind === 'lead'
    ? `Animus Scripts lead capture${payload.context ? ` (${payload.context})` : ''}`
    : `Animus Scripts inquiry from ${payload.name}`

  const resendResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [CONTACT_TO_EMAIL],
      reply_to: payload.email,
      subject,
      text: toText(payload),
    }),
  })

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text()
    console.error(`[contact-api] ${requestId} resend request failed`, {
      status: resendResponse.status,
      detail: errorText,
    })
    return { notified: false, skipped: false, error: errorText }
  }

  console.log(`[contact-api] ${requestId} email accepted by provider`, {
    to: CONTACT_TO_EMAIL,
    type: payload.kind === 'lead' ? 'lead' : 'contact',
  })

  return { notified: true, skipped: false }
}

export default async function handler(req, res) {
  const requestId = createRequestId()

  if (req.method !== 'POST') {
    console.warn(`[contact-api] ${requestId} rejected method ${req.method}`)
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const payload = parseBody(req.body)
  const isLead = payload.kind === 'lead'

  console.log(
    `[contact-api] ${requestId} received ${isLead ? 'lead' : 'contact'} submission`,
    {
      email: payload.email || null,
      company: payload.company || null,
      context: payload.context || null,
    },
  )

  if (isLead) {
    if (!payload.email) {
      console.warn(`[contact-api] ${requestId} lead submission missing email`)
      return sendJson(res, 400, { error: 'Email is required' })
    }
  } else if (
    !payload.name ||
    !payload.company ||
    !payload.email ||
    !payload.processNeedsImprovement ||
    !payload.currentTools
  ) {
    console.warn(`[contact-api] ${requestId} contact submission missing required fields`)
    return sendJson(res, 400, { error: 'Missing required contact fields' })
  }

  let stored

  try {
    stored = await storeSubmission(payload, requestId)
  } catch (error) {
    console.error(`[contact-api] ${requestId} failed to store submission`, error)
    return sendJson(res, 500, { error: 'Failed to store submission' })
  }

  console.log(`[contact-api] ${requestId} submission stored`, stored)

  const notification = await sendNotification(payload, requestId)

  return sendJson(res, 200, {
    ok: true,
    stored: true,
    notified: notification.notified,
    notificationSkipped: notification.skipped,
    storage: stored.backend,
    durable: stored.durable,
  })
}
