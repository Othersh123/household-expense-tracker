/**
 * GET /api/auth/url
 * Returns the Google OAuth2 authorization URL.
 */
export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return res.status(500).json({
      error: 'Missing OAuth env vars',
      missing: { clientId: !clientId, redirectUri: !redirectUri },
    })
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    access_type: 'offline',
    prompt: 'consent',
  })

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  res.json({ url })
}
