/**
 * POST /api/sheets/delete
 * Body: { rowIndex: number }
 * Soft-deletes a row by writing "true" to column K (Deleted).
 * The row is never removed from the sheet.
 */
import { getAccessToken } from '../_lib/getAccessToken.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const accessToken = await getAccessToken(req, res)
    const { rowIndex } = req.body

    if (!rowIndex) {
      return res.status(400).json({ error: 'rowIndex is required' })
    }

    const sheetId = process.env.GOOGLE_SHEET_ID
    const range = `Sheet1!K${rowIndex}`
    // RAW stores the literal string "true" (lowercase). USER_ENTERED would convert it to
    // the boolean TRUE, which reads back as "TRUE" and breaks strict equality checks.
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [['true']] }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Sheets API error' })

    res.json({ success: true })
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
}
