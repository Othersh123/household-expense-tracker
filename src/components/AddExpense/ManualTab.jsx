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

  // Split state
  const [txType, setTxType] = useState('Personal')
  const [splitMode, setSplitMode] = useState('amount')
  const [splits, setSplits] = useState({})

  const canSplit = persons.length >= 2
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function getTotalAmount() {
    return parseFloat(String(form.amount).replace(/[₹,\s]/g, '')) || 0
  }

  function initSplits(mode) {
    const amount = getTotalAmount()
    if (mode === 'amount') {
      const half = Math.round((amount / 2) * 100) / 100
      const other = parseFloat((amount - half).toFixed(2))
      setSplits({ [persons[0]]: half, [persons[1]]: other })
    } else {
      setSplits({ [persons[0]]: 50, [persons[1]]: 50 })
    }
  }

  function handleTxTypeChange(type) {
    setTxType(type)
    if (type === 'Shared') initSplits(splitMode)
  }

  function handleSplitModeChange(mode) {
    if (mode === splitMode) return
    const amount = getTotalAmount()
    if (amount > 0 && Object.keys(splits).length >= 2) {
      if (mode === 'pct') {
        setSplits(Object.fromEntries(
          persons.map((p) => [p, parseFloat(((parseFloat(splits[p] || 0) / amount) * 100).toFixed(1))])
        ))
      } else {
        setSplits(Object.fromEntries(
          persons.map((p) => [p, parseFloat(((parseFloat(splits[p] || 0) / 100) * amount).toFixed(2))])
        ))
      }
    } else {
      initSplits(mode)
    }
    setSplitMode(mode)
  }

  const totalAmount = getTotalAmount()
  const splitSum = persons.reduce((s, p) => s + (parseFloat(splits[p] || 0)), 0)
  const splitsValid =
    txType !== 'Shared' ||
    (splitMode === 'amount'
      ? Math.abs(splitSum - totalAmount) < 0.01
      : Math.abs(splitSum - 100) < 0.1)

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || !form.merchant) return
    persistAccount(form.account)

    let splitDetails = ''
    if (txType === 'Shared') {
      const detailAmounts = {}
      if (splitMode === 'amount') {
        persons.forEach((p) => { detailAmounts[p] = parseFloat(splits[p] || 0) })
      } else {
        persons.forEach((p) => {
          detailAmounts[p] = parseFloat(((parseFloat(splits[p] || 0) / 100) * totalAmount).toFixed(2))
        })
      }
      splitDetails = JSON.stringify(detailAmounts)
    }

    onReview({ ...form, txType, splitDetails })
  }

  const accountOptions = getAccountOptions()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" required>
          <input type="date" value={form.date} onChange={set('date')} className={inp} required />
        </Field>
        <Field label="Amount (₹)" required>
          <input
            type="number" min="0" step="0.01" placeholder="0.00"
            value={form.amount} onChange={set('amount')}
            className={inp} required
          />
        </Field>
      </div>

      <Field label="Merchant / Description" required>
        <input
          type="text" placeholder="e.g. Swiggy, BigBasket"
          value={form.merchant} onChange={set('merchant')}
          className={inp} required
        />
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
            list="account-options"
            placeholder="e.g. HDFC xx1234"
            value={form.account}
            onChange={set('account')}
            className={inp}
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
          className={inp}
        />
      </Field>

      {/* Transaction Type */}
      {canSplit && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Transaction Type</p>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {['Personal', 'Shared'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTxTypeChange(type)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  txType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Split section */}
      {txType === 'Shared' && canSplit && (
        <SplitSection
          persons={persons}
          totalAmount={totalAmount}
          splitMode={splitMode}
          splits={splits}
          onSplitModeChange={handleSplitModeChange}
          onSplitsChange={setSplits}
        />
      )}

      <button
        type="submit"
        disabled={!splitsValid}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Review & Confirm →
      </button>
    </form>
  )
}

function SplitSection({ persons, totalAmount, splitMode, splits, onSplitModeChange, onSplitsChange }) {
  const isAmountMode = splitMode === 'amount'
  const splitSum = persons.reduce((s, p) => s + (parseFloat(splits[p] || 0)), 0)
  const balanced = isAmountMode
    ? Math.abs(splitSum - totalAmount) < 0.01
    : Math.abs(splitSum - 100) < 0.1

  function handleChange(person, value) {
    onSplitsChange((prev) => ({ ...prev, [person]: value }))
  }

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-3">
      {/* Mode toggle */}
      <div className="flex bg-white border border-indigo-100 rounded-lg p-0.5">
        {['amount', 'pct'].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onSplitModeChange(mode)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
              splitMode === mode ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            {mode === 'amount' ? 'By Amount' : 'By Percentage'}
          </button>
        ))}
      </div>

      {/* Per-person inputs */}
      <div className="space-y-2">
        {persons.map((person) => {
          const val = splits[person] ?? ''
          const amtFromPct = !isAmountMode
            ? Math.round((parseFloat(val || 0) / 100) * totalAmount * 100) / 100
            : null

          return (
            <div key={person} className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 w-16 truncate flex-shrink-0">{person}</span>
              <div className="flex items-center gap-1 flex-1">
                {isAmountMode && <span className="text-xs text-gray-400 flex-shrink-0">₹</span>}
                <input
                  type="number"
                  min="0"
                  step={isAmountMode ? '0.01' : '0.1'}
                  value={val}
                  onChange={(e) => handleChange(person, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                />
                {!isAmountMode && <span className="text-xs text-gray-400 flex-shrink-0">%</span>}
              </div>
              {!isAmountMode && (
                <span className="text-xs text-gray-500 w-14 text-right flex-shrink-0 tabular-nums">
                  ₹{isNaN(amtFromPct) ? '0' : amtFromPct.toFixed(0)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Validation line */}
      <div className={`text-xs font-medium ${balanced ? 'text-green-600' : 'text-amber-600'}`}>
        {balanced ? (
          isAmountMode
            ? `✓ Totals match ₹${totalAmount.toFixed(2)}`
            : '✓ Adds up to 100%'
        ) : (
          isAmountMode
            ? `₹${splitSum.toFixed(2)} of ₹${totalAmount.toFixed(2)} — ₹${Math.abs(totalAmount - splitSum).toFixed(2)} ${splitSum > totalAmount ? 'over' : 'remaining'}`
            : `${splitSum.toFixed(1)}% of 100% — ${Math.abs(100 - splitSum).toFixed(1)}% ${splitSum > 100 ? 'over' : 'remaining'}`
        )}
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
