import { parse, serialize } from 'cookie'

/**
 * Returns a valid Google access token, refreshing if necessary.
 * Mutates `res` to set refreshed cookies when a token refresh occurs.
 */
export async function getAccessToken(req, res) {
  const cookies = parse(req.headers.cookie || '')
  let { g_access_token, g_refresh_token } = cookies

  if (g_access_token) return g_access_token

  if (!g_refresh_token) throw new Error('Not authenticated. Please re-authorize.')

  // Refresh the access token
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: g_refresh_token,
    grant_type: 'refresh_token',
  })

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const tokens = await resp.json()
  if (tokens.error) throw new Error(`Token refresh failed: ${tokens.error}`)

  // Set the new access token cookie
  res.setHeader('Set-Cookie',
    serialize('g_access_token', tokens.access_token, {
      httpOnly: true, secure: true, sameSite: 'strict', path: '/',
      maxAge: tokens.expires_in,
    })
  )

  return tokens.access_token
}
