import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { CATEGORIES, PAYMENT_METHODS } from '../../constants'
import { usePersons } from '../../context/PersonsContext'

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

function toInputDate(str) {
  if (!str) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [d, m, y] = str.split('-')
    return `${y}-${m}-${d}`
  }
  return str
}

export default function EditTransactionModal({ row, onSuccess, onCancel }) {
  const { persons } = usePersons()
  const [form, setForm] = useState({
    date: toInputDate(row.date),
    amount: row.amount,
    merchant: row.merchant,
    category: row.category || 'Other',
    paymentMethod: row.paymentMethod || 'UPI',
    person: row.person || '',
    account: row.account || '',
    notes: row.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    if (!form.amount || !form.merchant || !form.date) return
    setSaving(true)
    setError('')

    const amount = parseFloat(String(form.amount).replace(/[₹,\s]/g, ''))

    try {
      const res = await fetch('/api/sheets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex: row.rowIndex,
          fields: {
            date: form.date,
            amount: isNaN(amount) ? 0 : amount,
            merchant: form.merchant,
            category: form.category,
            paymentMethod: form.paymentMethod,
            person: form.person,
            account: form.account,
            source: row.source,
            notes: form.notes,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to update')
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const accountOptions = getAccountOptions()

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 flex-shrink-0">
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 flex-1">Edit Transaction</h2>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              list="edit-account-suggestions"
              value={form.account}
              onChange={set('account')}
              placeholder="e.g. HDFC xx1234"
              className={inp}
            />
            <datalist id="edit-account-suggestions">
              {accountOptions.map((opt) => <option key={opt} value={opt} />)}
            </datalist>
          </Field>
        </div>

        <Field label="Notes">
          <input type="text" value={form.notes} onChange={set('notes')} className={inp} placeholder="Optional" />
        </Field>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={onCancel}
            className="w-full border border-gray-300 text-gray-700 font-semibold py-3.5 rounded-xl transition-colors hover:bg-gray-50 text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.amount || !form.merchant || !form.date}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
          >
            {saving ? (
              <>
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>

        {/* Bottom padding for safe area */}
        <div className="h-4" />
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
