import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, RefreshCw, SlidersHorizontal, X } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { formatCurrency } from '../utils/formatters'
import FilterSheet, { FilterSelect } from '../components/FilterSheet'
import { usePersons } from '../context/PersonsContext'

const RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 1 month', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last 1 year', days: 365 },
]
const DEFAULT_RANGE = 30

const PAYMENT_METHODS = ['All', 'UPI', 'Credit Card', 'Debit Card', 'Cash']

const ALL_METHOD_LABEL = {
  UPI: 'All UPI',
  'Credit Card': 'All Credit Cards',
  'Debit Card': 'All Debit Cards',
  Cash: 'All Cash',
}

const CATEGORY_COLORS = {
  Rent: 'bg-blue-900 text-blue-50',
  Groceries: 'bg-blue-700 text-blue-50',
  'Food & Dining': 'bg-blue-600 text-blue-50',
  Transport: 'bg-blue-500 text-blue-50',
  Utilities: 'bg-blue-400 text-blue-50',
  Shopping: 'bg-blue-300 text-blue-900',
  Entertainment: 'bg-blue-200 text-blue-900',
  Health: 'bg-blue-100 text-blue-900',
  Other: 'bg-gray-500 text-gray-50',
}

const PERSON_BADGE_COLORS = ['bg-blue-100 text-blue-800', 'bg-blue-50 text-blue-700']

const METHOD_COLOR = {
  UPI: 'bg-gray-100 text-gray-700',
  'Credit Card': 'bg-gray-200 text-gray-800',
  'Debit Card': 'bg-gray-100 text-gray-700',
  Cash: 'bg-gray-50 text-gray-600',
}

function parseRowDate(str) {
  if (!str) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-')
    return new Date(+y, +m - 1, +d)
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [d, m, y] = str.split('-')
    return new Date(+y, +m - 1, +d)
  }
  return null
}

function formatRowDate(str) {
  const d = parseRowDate(str)
  if (!d) return str
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function dateCutoff(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function Transactions() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dateParam = searchParams.get('date') // e.g. "2026-04-18" — single-day filter from Dashboard

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Applied filters
  const [rangeDays, setRangeDays] = useState(DEFAULT_RANGE)
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [accountFilter, setAccountFilter] = useState('All')

  // Draft filters (while sheet is open)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draftRange, setDraftRange] = useState(DEFAULT_RANGE)
  const [draftPayment, setDraftPayment] = useState('All')
  const [draftAccount, setDraftAccount] = useState('All')

  const hasActiveFilters = rangeDays !== DEFAULT_RANGE || paymentFilter !== 'All' || accountFilter !== 'All'

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sheets/read')
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to load data')
      setRows(data.rows || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function openSheet() {
    setDraftRange(rangeDays)
    setDraftPayment(paymentFilter)
    setDraftAccount(accountFilter)
    setSheetOpen(true)
  }

  function applySheet() {
    setRangeDays(draftRange)
    setPaymentFilter(draftPayment)
    setAccountFilter(draftAccount)
    setSheetOpen(false)
  }

  function clearSheet() {
    setDraftRange(DEFAULT_RANGE)
    setDraftPayment('All')
    setDraftAccount('All')
    setRangeDays(DEFAULT_RANGE)
    setPaymentFilter('All')
    setAccountFilter('All')
    setSheetOpen(false)
  }

  function setDraftPaymentAndReset(val) {
    setDraftPayment(val)
    setDraftAccount('All')
  }

  // Accounts available for the draft payment method in the draft date range
  const accountsForDraft = useMemo(() => {
    if (draftPayment === 'All') return []
    const cutoff = dateCutoff(draftRange)
    return [...new Set(
      rows
        .filter((r) => {
          const d = parseRowDate(r.date)
          return d && d >= cutoff && r.paymentMethod === draftPayment && r.account?.trim()
        })
        .map((r) => r.account.trim())
    )]
  }, [rows, draftRange, draftPayment])

  // Applied filter result
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()

    return rows
      .filter((r) => {
        // Single-day mode (from Dashboard "View all for [date]" link)
        if (dateParam) {
          const rd = parseRowDate(r.date)
          const td = parseRowDate(dateParam)
          if (!rd || !td) return false
          if (rd.toDateString() !== td.toDateString()) return false
        } else {
          const d = parseRowDate(r.date)
          if (!d || d < dateCutoff(rangeDays)) return false
          if (paymentFilter !== 'All' && r.paymentMethod !== paymentFilter) return false
          if (accountFilter !== 'All' && r.account?.trim() !== accountFilter) return false
        }
        if (q) {
          return (
            r.merchant?.toLowerCase().includes(q) ||
            r.category?.toLowerCase().includes(q) ||
            r.account?.toLowerCase().includes(q) ||
            r.paymentMethod?.toLowerCase().includes(q) ||
            r.notes?.toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => {
        const dA = parseRowDate(a.date)
        const dB = parseRowDate(b.date)
        if (dA && dB && dA.getTime() !== dB.getTime()) return dB - dA
        return (b.loggedAt || '').localeCompare(a.loggedAt || '')
      })
  }, [rows, dateParam, rangeDays, paymentFilter, accountFilter, search])

  const total = useMemo(
    () => displayed.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0),
    [displayed]
  )

  const activeRangeLabel = RANGES.find((r) => r.days === rangeDays)?.label ?? 'Custom'

  return (
    <div className="flex flex-col h-full">
      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-4 pb-3 space-y-3">
        {/* Search + filter icon */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search merchant, category, account…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50"
            />
          </div>
          {!dateParam && (
            <button
              onClick={openSheet}
              className="relative flex-shrink-0 p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-600" />
              )}
            </button>
          )}
        </div>

        {/* Single-day mode chip (from Dashboard drill-down) */}
        {dateParam && (
          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-full px-2.5 py-0.5 font-medium flex items-center gap-1">
              {formatRowDate(dateParam)}
              <button onClick={() => navigate('/transactions')} className="ml-0.5 hover:text-primary-900">
                <X className="w-3 h-3" />
              </button>
            </span>
            <span className="text-xs text-gray-400">Showing all transactions for this date</span>
          </div>
        )}

        {!dateParam && hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {rangeDays !== DEFAULT_RANGE && (
              <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-full px-2.5 py-0.5 font-medium">
                {activeRangeLabel}
              </span>
            )}
            {paymentFilter !== 'All' && (
              <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-full px-2.5 py-0.5 font-medium">
                {paymentFilter}
              </span>
            )}
            {accountFilter !== 'All' && (
              <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-full px-2.5 py-0.5 font-medium">
                {accountFilter}
              </span>
            )}
            <button onClick={clearSheet} className="text-xs text-gray-400 underline underline-offset-2">
              Clear
            </button>
          </div>
        )}

      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2">

        {/* Summary card */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-3">
          <div className="flex items-start justify-between">
            <div>
              <p style={{ fontSize: 30 }} className="font-bold leading-tight tracking-tight text-blue-900">
                {formatCurrency(total)}
              </p>
              <p className="text-sm text-blue-800/70 mt-1">
                {displayed.length} transaction{displayed.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={fetchData} className="text-blue-800/50 hover:text-blue-900 mt-0.5">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 my-3">
            {error}
          </div>
        )}
        {loading && rows.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : displayed.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No transactions found</p>
        ) : (
          <div className="space-y-2 py-2">
            {displayed.map((r, i) => <TransactionRow key={i} r={r} />)}
          </div>
        )}
      </div>

      {/* Filter sheet */}
      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onApply={applySheet}
        onClear={clearSheet}
      >
        <FilterSelect label="Date Range" value={draftRange} onChange={(v) => setDraftRange(Number(v))}>
          {RANGES.map(({ label, days }) => (
            <option key={days} value={days}>{label}</option>
          ))}
        </FilterSelect>

        <FilterSelect label="Payment Method" value={draftPayment} onChange={setDraftPaymentAndReset}>
          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </FilterSelect>

        {draftPayment !== 'All' && (
          <FilterSelect label="Account / Card" value={draftAccount} onChange={setDraftAccount}>
            <option value="All">{ALL_METHOD_LABEL[draftPayment] ?? `All ${draftPayment}`}</option>
            {accountsForDraft.map((a) => <option key={a} value={a}>{a}</option>)}
          </FilterSelect>
        )}
      </FilterSheet>
    </div>
  )
}

function TransactionRow({ r }) {
  const { persons } = usePersons()
  const personIdx = persons.indexOf(r.person)
  const personBadge = PERSON_BADGE_COLORS[personIdx] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 truncate flex-1">{r.merchant || '—'}</p>
        <p className="text-sm font-bold text-gray-900 flex-shrink-0">{formatCurrency(parseFloat(r.amount) || 0)}</p>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        <span className="text-xs text-gray-400">{formatRowDate(r.date)}</span>
        <span className="text-gray-200">·</span>
        {r.category && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[r.category] || CATEGORY_COLORS.Other}`}>
            {r.category}
          </span>
        )}
        {r.person && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${personBadge}`}>
            {r.person}
          </span>
        )}
        {r.paymentMethod && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_COLOR[r.paymentMethod] || 'bg-gray-100 text-gray-600'}`}>
            {r.paymentMethod}
          </span>
        )}
      </div>
      {r.account && (
        <p className="text-xs text-gray-400 mt-1 truncate">{r.account}</p>
      )}
    </div>
  )
}
