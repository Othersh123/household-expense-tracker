/**
 * GET /api/auth/status
 * Returns whether the server has a valid (or refreshable) Google token.
 */
import { parse } from 'cookie'

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '')
  const hasToken = !!(cookies.g_access_token || cookies.g_refresh_token)
  res.json({ authorized: hasToken })
}
