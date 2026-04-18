import React, { useState } from 'react'
import { parseSMS } from '../../utils/smsParser'

export default function SmsTab({ onParsed }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  function handleParse() {
    setError('')
    const result = parseSMS(text.trim())
    if (!result) {
      setError('Could not parse this SMS. Please check the format or use Manual entry.')
      return
    }
    onParsed(result)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Paste bank / UPI SMS
        </label>
        <textarea
          rows={6}
          placeholder={`e.g.\nRs.500.00 debited from a/c xx1234 on 17-Apr-25 trf to SWIGGY. UPI:123456789\n\nSupported: HDFC, ICICI, Axis, SBI, Kotak`}
          value={text}
          onChange={(e) => { setText(e.target.value); setError('') }}
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono bg-white"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleParse}
        disabled={!text.trim()}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Parse SMS →
      </button>

      <p className="text-xs text-gray-400 text-center">
        Supports HDFC · ICICI · Axis · SBI · Kotak bank formats
      </p>
    </div>
  )
}
