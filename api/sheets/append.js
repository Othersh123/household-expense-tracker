/**
 * POST /api/sheets/append
 * Body: { row: [Date, Amount, Merchant, Category, PaymentMethod, Person, Account, Source, Notes, LoggedAt] }
 * Appends one row to the configured Google Sheet.
 */
import { getAccessToken } from '../_lib/getAccessToken.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const accessToken = await getAccessToken(req, res)
    const { row } = req.body

    if (!Array.isArray(row) || row.length === 0) {
      return res.status(400).json({ error: 'row must be a non-empty array' })
    }

    const sheetId = process.env.GOOGLE_SHEET_ID
    const range = 'Sheet1!A:M'
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Sheets API error' })

    res.json({ success: true, updatedRange: data.updates?.updatedRange })
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
}
