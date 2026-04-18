import React, { useState, useRef } from 'react'
import { Upload, Image } from 'lucide-react'

export default function ScreenshotTab({ onParsed }) {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef()

  function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setPreview({ src: dataUrl, base64: dataUrl.split(',')[1], mimeType: file.type })
    }
    reader.readAsDataURL(file)
    setError('')
  }

  async function handleParse() {
    if (!preview?.base64) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/parse-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: preview.base64, mimeType: preview.mimeType }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to parse screenshot')

      onParsed({
        date: data.parsed.date || '',
        amount: data.parsed.amount || '',
        merchant: data.parsed.merchant || '',
        paymentMethod: data.parsed.paymentMethod || 'UPI',
        account: data.parsed.accountCard || data.parsed.account || '',
        notes: data.parsed.notes || '',
        category: data.parsed.category || 'Other',
        person: '',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors bg-gray-50 min-h-[180px]"
      >
        {preview ? (
          <img src={preview.src} alt="preview" className="max-h-48 rounded-lg object-contain" />
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-600">Tap to upload screenshot</p>
            <p className="text-xs text-gray-400 mt-1">GPay, PhonePe, Paytm</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {preview && (
        <button
          onClick={() => { setPreview(null); setError('') }}
          className="text-xs text-gray-400 underline block mx-auto"
        >
          Remove image
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleParse}
        disabled={!preview || loading}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Analysing with AI...
          </>
        ) : (
          'Parse with Gemini →'
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Image is sent to Gemini Flash via your secure backend
      </p>
    </div>
  )
}
