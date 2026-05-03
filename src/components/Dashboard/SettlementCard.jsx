import React, { useState } from 'react'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { todayISO } from '../../utils/formatters'

export default function SettlementCard({ settlement, onSettled }) {
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!settlement) return null

  if (settlement.settled) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        <p className="text-sm font-medium text-green-800">You're all settled up ✓</p>
      </div>
    )
  }

  const { debtor, creditor, amount } = settlement

  async function handleSettle() {
    setSaving(true)
    setError('')
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    const row = [
      todayISO(),
      amount,
      `Settlement — ${debtor} to ${creditor}`,
      'Settlement',
      '',
      debtor,
      '',
      'Settlement',
      `Settled on ${dateStr}`,
      new Date().toISOString(),
      '',
      'Settlement',
      '',
    ]
    try {
      const res = await fetch('/api/sheets/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save')
      setConfirming(false)
      onSettled()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 space-y-3">
      <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Settlement</p>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{debtor}</span>
        <ArrowRight className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-gray-900">{creditor}</span>
        <span className="ml-auto text-base font-bold text-amber-800">{formatCurrency(amount)}</span>
      </div>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          Mark as Settled
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-amber-700">
            This will log a ₹{formatCurrency(amount).replace('₹', '')} settlement entry. Continue?
          </p>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setConfirming(false); setError('') }}
              className="py-2 rounded-xl border border-amber-200 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSettle}
              disabled={saving}
              className="py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {saving ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
