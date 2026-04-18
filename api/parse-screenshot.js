/**
 * POST /api/parse-screenshot
 * Accepts a base64-encoded image and calls Gemini Flash vision API
 * to extract transaction fields.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageBase64, mimeType = 'image/png' } = req.body

  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' })

  const prompt = `Extract transaction details from this payment screenshot. Return ONLY a valid JSON object with these exact keys: date (YYYY-MM-DD), amount (number only, no currency symbol), merchant (string), category (one of: Rent/Groceries/Food & Dining/Transport/Utilities/Shopping/Entertainment/Health/Other), paymentMethod (one of: UPI/Credit Card/Debit Card/Cash), accountCard (bank/card name if visible). No markdown, no explanation, just the JSON object.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: imageBase64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
        }),
      }
    )

    const result = await response.json()
    if (!response.ok) {
      return res.status(response.status).json({ error: result.error?.message || 'Gemini API error' })
    }

    const finishReason = result.candidates?.[0]?.finishReason
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Extract the JSON object, stripping any markdown fences or surrounding text
    const jsonMatch = text.match(/\{[\s\S]*/)  // greedy — captures from { to end of text
    if (!jsonMatch) {
      return res.status(500).json({ error: `Gemini returned no JSON. Finish reason: ${finishReason}. Raw: ${text.slice(0, 200)}` })
    }

    let jsonStr = jsonMatch[0]

    // If the response was cut off (MAX_TOKENS), attempt to close any open string then close the object
    if (finishReason === 'MAX_TOKENS' && !jsonStr.trimEnd().endsWith('}')) {
      // Drop any trailing incomplete key/value (after the last complete comma or opening brace)
      jsonStr = jsonStr.replace(/,?\s*"[^"]*(?:"[^"]*)?$/, '').trimEnd()
      if (!jsonStr.endsWith('}')) jsonStr += '}'
    }

    let parsed
    try {
      parsed = JSON.parse(jsonStr)
    } catch (parseErr) {
      return res.status(500).json({
        error: `Truncated or malformed JSON from Gemini (finish: ${finishReason}): ${parseErr.message}`,
        raw: jsonStr.slice(0, 300),
      })
    }

    res.json({ parsed })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
