/**
 * GET /api/sheets/read
 * Returns all rows from the Sheet as JSON.
 */
import { getAccessToken } from '../_lib/getAccessToken.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const accessToken = await getAccessToken(req, res)
    const sheetId = process.env.GOOGLE_SHEET_ID
    const range = 'Sheet1!A2:M'  // skip header row; K=Deleted, L=SplitType, M=SplitDetails
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Sheets API error' })

    const rows = (data.values || []).map((r, index) => ({
      rowIndex: index + 2, // +2: row 1 is the header
      date: r[0] || '',
      amount: parseFloat(String(r[1] ?? '').replace(/[₹,\s]/g, '')) || 0,
      merchant: r[2] || '',
      category: r[3] || 'Other',
      paymentMethod: r[4] || '',
      person: r[5] || '',
      account: r[6] || '',
      source: r[7] || '',
      notes: r[8] || '',
      loggedAt: r[9] || '',
      deleted: r[10] || '',
      splitType: r[11] || '',
      splitDetails: r[12] || '',
    }))

    res.json({ rows })
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
}
