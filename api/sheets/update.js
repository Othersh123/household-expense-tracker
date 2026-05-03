/**
 * POST /api/sheets/update
 * Body: { rowIndex: number, fields: { date, amount, merchant, category, paymentMethod, person, account, source, notes } }
 * Updates columns A–I of the given sheet row. Column J (Logged At) is not touched.
 */
import { getAccessToken } from '../_lib/getAccessToken.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const accessToken = await getAccessToken(req, res)
    const { rowIndex, fields } = req.body

    if (!rowIndex || !fields) {
      return res.status(400).json({ error: 'rowIndex and fields are required' })
    }

    const { date, amount, merchant, category, paymentMethod, person, account, source, notes } = fields
    const sheetId = process.env.GOOGLE_SHEET_ID
    const range = `Sheet1!A${rowIndex}:I${rowIndex}`
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [[date, amount, merchant, category, paymentMethod, person, account, source, notes]] }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Sheets API error' })

    res.json({ success: true })
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
}
