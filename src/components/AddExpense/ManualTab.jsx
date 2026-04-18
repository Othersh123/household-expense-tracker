import React, { useState } from 'react'
import { CATEGORIES, PAYMENT_METHODS } from '../../constants'
import { todayISO } from '../../utils/formatters'
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

export default function ManualTab({ onReview }) {
  const { persons } = usePersons()
  const [form, setForm] = useState({
    date: todayISO(),
    amount: '',
    merchant: '',
    category: 'Other',
    paymentMethod: 'UPI',
    person: persons[0] || '',
    account: '',
    notes: '',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || !form.merchant) return
    persistAccount(form.account)
    onReview(form)
  }

  const accountOptions = getAccountOptions()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" required>
          <input type="date" value={form.date} onChange={set('date')} className={input} required />
        </Field>
        <Field label="Amount (₹)" required>
          <input
            type="number" min="0" step="0.01" placeholder="0.00"
            value={form.amount} onChange={set('amount')}
            className={input} required
          />
        </Field>
      </div>

      <Field label="Merchant / Description" required>
        <input
          type="text" placeholder="e.g. Swiggy, BigBasket"
          value={form.merchant} onChange={set('merchant')}
          className={input} required
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select value={form.category} onChange={set('category')} className={input}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Payment Method">
          <select value={form.paymentMethod} onChange={set('paymentMethod')} className={input}>
            {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Person">
          <select value={form.person} onChange={set('person')} className={input}>
            <option value="">Select...</option>
            {persons.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Account / Card">
          <input
            list="account-options"
            placeholder="e.g. HDFC xx1234"
            value={form.account}
            onChange={set('account')}
            className={input}
          />
          <datalist id="account-options">
            {accountOptions.map((opt) => <option key={opt} value={opt} />)}
          </datalist>
        </Field>
      </div>

      <Field label="Notes">
        <input
          type="text" placeholder="Optional"
          value={form.notes} onChange={set('notes')}
          className={input}
        />
      </Field>

      <button
        type="submit"
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Review & Confirm →
      </button>
    </form>
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

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white'
