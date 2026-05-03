import React, { useState } from 'react'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { CATEGORIES, PAYMENT_METHODS } from '../../constants'
import { usePersons } from '../../context/PersonsContext'
import { useAuth } from '../../context/AuthContext'

const SOURCE_BADGE = {
  Manual: 'bg-blue-100 text-blue-700',
  SMS: 'bg-amber-100 text-amber-700',
  Screenshot: 'bg-purple-100 text-purple-700',
}

const LS_KEY = 'saved_accounts'
const DEFAULT_ACCOUNTS = ['HDFC Regalia', 'ICICI Amazon Pay', 'Axis Bank UPI', 'SBI UPI', 'GPay', 'PhonePe']

function getAccountOptions() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    return [...new Set([...DEFAULT_ACCOUNTS, ...saved])]
  } catch {
    return [...DEFAULT_ACCOUNTS]
  }
}

function persistAccount(value) {
  const trimmed = value?.trim()
  if (!trimmed || DEFAULT_ACCOUNTS.includes(trimmed)) return
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    if (!saved.includes(trimmed)) {
      localStorage.setItem(LS_KEY, JSON.stringify([...saved, trimmed]))
    }
  } catch {}
}

export default function ReviewForm({ initial, source, onBack, onSuccess }) {
  const { persons } = usePersons()
  const { revokeAuth } = useAuth()
  const [form, setForm] = useState({ ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleConfirm() {
    if (!form.amount || !form.merchant || !form.date) return
    setSaving(true)
    setError('')

    const amount = parseFloat(String(form.amount).replace(/[₹,\s]/g, ''))
    persistAccount(form.account)

    const row = [
      form.date,
      isNaN(amount) ? 0 : amount,
      form.merchant,
      form.category,
      form.paymentMethod,
      form.person,
      form.account,
      source,
      form.notes,
      new Date().toISOString(), // J: Logged At
      '',                        // K: Deleted (blank for new rows)
      form.txType || 'Personal', // L: Split Type
      form.splitDetails || '',   // M: Split Details
    ]

    try {
      const res = await fetch('/api/sheets/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save')
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const accountOptions = getAccountOptions()

  // Parse split summary for read-only display
  let splitSummary = null
  if (form.txType === 'Shared' && form.splitDetails) {
    try { splitSummary = JSON.parse(form.splitDetails) } catch {}
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 flex-1">Review & Confirm</h2>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${SOURCE_BADGE[source] || 'bg-gray-100 text-gray-600'}`}>
          {source}
        </span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required>
            <input type="date" value={form.date} onChange={set('date')} className={inp} required />
          </Field>
          <Field label="Amount (₹)" required>
            <input
              type="number" min="0" step="0.01"
              value={form.amount} onChange={set('amount')}
              className={inp} required
            />
          </Field>
        </div>

        <Field label="Merchant / Description" required>
          <input type="text" value={form.merchant} onChange={set('merchant')} className={inp} required />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select value={form.category} onChange={set('category')} className={inp}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Payment Method">
            <select value={form.paymentMethod} onChange={set('paymentMethod')} className={inp}>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Person">
            <select value={form.person} onChange={set('person')} className={inp}>
              <option value="">Select...</option>
              {persons.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Account / Card">
            <input
              list="account-suggestions"
              value={form.account}
              onChange={set('account')}
              placeholder="e.g. HDFC xx1234"
              className={inp}
            />
            <datalist id="account-suggestions">
              {accountOptions.map((opt) => <option key={opt} value={opt} />)}
            </datalist>
          </Field>
        </div>

        <Field label="Notes">
          <input type="text" value={form.notes} onChange={set('notes')} className={inp} placeholder="Optional" />
        </Field>

        {/* Read-only split summary (set on the previous screen) */}
        {splitSummary && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">Shared split</p>
            <div className="flex gap-6">
              {Object.entries(splitSummary).map(([person, amt]) => (
                <div key={person}>
                  <p className="text-xs text-indigo-400">{person}</p>
                  <p className="text-sm font-semibold text-indigo-800">
                    ₹{parseFloat(amt).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          error.includes('invalid_grant') ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 space-y-3">
              <p className="text-sm font-medium text-amber-800">Your Google connection has expired. Please reconnect.</p>
              <button
                onClick={revokeAuth}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Reconnect Google Sheets
              </button>
            </div>
          ) : (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )
        )}

        <button
          onClick={handleConfirm}
          disabled={saving || !form.amount || !form.merchant || !form.date}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
        >
          {saving ? (
            <>
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Confirm & Save
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white'
