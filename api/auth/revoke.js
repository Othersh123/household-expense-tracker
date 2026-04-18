import { serialize } from 'cookie'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  res.setHeader('Set-Cookie', [
    serialize('g_access_token', '', { httpOnly: true, secure: true, path: '/', maxAge: 0 }),
    serialize('g_refresh_token', '', { httpOnly: true, secure: true, path: '/', maxAge: 0 }),
  ])
  res.json({ success: true })
}
