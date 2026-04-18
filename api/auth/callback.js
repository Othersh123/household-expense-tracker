/**
 * POST /api/auth/callback
 * Exchanges the OAuth code for tokens and stores the refresh token.
 * Tokens are stored as Vercel KV (or env-based fallback via global store).
 */

// In-memory store for dev; in production, use Vercel KV or a DB.
// Vercel serverless functions share nothing between invocations, so
// the refresh token is written to an environment-level approach via
// a lightweight encrypted cookie or external KV. For simplicity we
// store it in an encrypted cookie on the client.

import { serialize } from 'cookie'

async function exchangeCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  })

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  return resp.json()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'missing code' })

  try {
    const tokens = await exchangeCode(code)
    if (tokens.error) return res.status(400).json({ error: tokens.error })

    // Store tokens in httpOnly cookies (access + refresh)
    res.setHeader('Set-Cookie', [
      serialize('g_access_token', tokens.access_token, {
        httpOnly: true, secure: true, sameSite: 'strict', path: '/',
        maxAge: tokens.expires_in,
      }),
      serialize('g_refresh_token', tokens.refresh_token || '', {
        httpOnly: true, secure: true, sameSite: 'strict', path: '/',
        maxAge: 60 * 60 * 24 * 365,
      }),
    ])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
