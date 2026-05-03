import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { startOfWeek, startOfMonth } from 'date-fns'
import { RefreshCw, SlidersHorizontal } from 'lucide-react'
import SummaryCards from '../components/Dashboard/SummaryCards'
import CategoryChart from '../components/Dashboard/CategoryChart'
import PersonBreakdown from '../components/Dashboard/PersonBreakdown'
import RecentTransactions from '../components/Dashboard/RecentTransactions'
import SettlementCard from '../components/Dashboard/SettlementCard'
import FilterSheet, { FilterSelect } from '../components/FilterSheet'
import { usePersons } from '../context/PersonsContext'
import { useAuth } from '../context/AuthContext'

const PAYMENT_METHODS = ['All', 'UPI', 'Credit Card', 'Debit Card', 'Cash']

const ALL_METHOD_LABEL = {
  UPI: 'All UPI',
  'Credit Card': 'All Credit Cards',
  'Debit Card': 'All Debit Cards',
  Cash: 'All Cash',
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

export default function Dashboard() {
  const { persons } = usePersons()
  const { revokeAuth } = useAuth()
  const [view, setView] = useState('month')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Applied filters
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [accountFilter, setAccountFilter] = useState('All')

  // Draft filters (while sheet is open)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draftPayment, setDraftPayment] = useState('All')
  const [draftAccount, setDraftAccount] = useState('All')

  const hasActiveFilters = paymentFilter !== 'All' || accountFilter !== 'All'

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
    setDraftPayment(paymentFilter)
    setDraftAccount(accountFilter)
    setSheetOpen(true)
  }

  function applySheet() {
    setPaymentFilter(draftPayment)
    setAccountFilter(draftAccount)
    setSheetOpen(false)
  }

  function clearSheet() {
    setDraftPayment('All')
    setDraftAccount('All')
    setPaymentFilter('All')
    setAccountFilter('All')
    setSheetOpen(false)
  }

  function setDraftPaymentAndReset(val) {
    setDraftPayment(val)
    setDraftAccount('All')
  }

  // --- Filter chain ---

  const now = new Date()
  const cutoff = view === 'week' ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now)

  const dateFiltered = useMemo(() =>
    rows.filter((r) => { const d = parseRowDate(r.date); return d !== null && d >= cutoff && String(r.deleted).toLowerCase() !== 'true' }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, view]
  )

  const methodFiltered = useMemo(() =>
    paymentFilter === 'All' ? dateFiltered : dateFiltered.filter((r) => r.paymentMethod === paymentFilter),
    [dateFiltered, paymentFilter]
  )

  const filtered = useMemo(() =>
    accountFilter === 'All' ? methodFiltered : methodFiltered.filter((r) => r.account?.trim() === accountFilter),
    [methodFiltered, accountFilter]
  )

  // Accounts available for the draft payment method (for the sheet select)
  const accountsForDraft = useMemo(() => {
    if (draftPayment === 'All') return []
    return [...new Set(
      dateFiltered
        .filter((r) => r.paymentMethod === draftPayment && r.account?.trim())
        .map((r) => r.account.trim())
    )]
  }, [dateFiltered, draftPayment])

  // Settlement balance — positive means person is owed money, negative means they owe
  const settlement = useMemo(() => {
    if (persons.length < 2) return null
    const balance = Object.fromEntries(persons.map((p) => [p, 0]))

    filtered.filter((r) => r.splitType === 'Shared' && r.splitDetails).forEach((r) => {
      const payer = r.person
      const amount = parseFloat(r.amount) || 0
      try {
        const details = JSON.parse(r.splitDetails)
        persons.forEach((p) => {
          const owed = parseFloat(details[p] || 0)
          const paid = p === payer ? amount : 0
          balance[p] += paid - owed
        })
      } catch {}
    })

    filtered.filter((r) => r.splitType === 'Settlement').forEach((r) => {
      const payer = r.person
      const receiver = persons.find((p) => p !== payer)
      const amount = parseFloat(r.amount) || 0
      if (receiver) {
        balance[payer] += amount
        balance[receiver] -= amount
      }
    })

    const net = balance[persons[0]]
    if (Math.abs(net) < 0.01) return { settled: true }
    if (net > 0) return { debtor: persons[1], creditor: persons[0], amount: Math.round(net * 100) / 100 }
    return { debtor: persons[0], creditor: persons[1], amount: Math.round(Math.abs(net) * 100) / 100 }
  }, [filtered, persons])

  // --- Aggregations ---

  // Exclude settlement entries from spending calculations
  const spendingRows = filtered.filter((r) => r.splitType !== 'Settlement')

  const totalSpent = spendingRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

  const byCat = {}
  spendingRows.forEach((r) => { byCat[r.category] = (byCat[r.category] || 0) + (parseFloat(r.amount) || 0) })

  const byPerson = Object.fromEntries(persons.map((p) => [p, 0]))
  spendingRows.forEach((r) => {
    if (r.splitType === 'Shared' && r.splitDetails) {
      try {
        const details = JSON.parse(r.splitDetails)
        Object.entries(details).forEach(([person, amt]) => {
          if (person in byPerson) byPerson[person] = (byPerson[person] || 0) + (parseFloat(amt) || 0)
        })
      } catch {
        if (r.person) byPerson[r.person] = (byPerson[r.person] || 0) + (parseFloat(r.amount) || 0)
      }
    } else {
      if (r.person) byPerson[r.person] = (byPerson[r.person] || 0) + (parseFloat(r.amount) || 0)
    }
  })

  const recentRows = [...filtered].sort((a, b) => {
    const dA = parseRowDate(a.date)
    const dB = parseRowDate(b.date)
    if (dA && dB && dA.getTime() !== dB.getTime()) return dB - dA
    return (b.loggedAt || '').localeCompare(a.loggedAt || '')
  })

  return (
    <div className="p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {['week', 'month'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  view === v ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                {v === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          {/* Filter icon */}
          <button
            onClick={openSheet}
            className="relative p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary-600" />
            )}
          </button>

          <button onClick={fetchData} className="p-1.5 text-gray-400 hover:text-gray-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active filter summary badge */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
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
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )
      )}

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <SummaryCards total={totalSpent} view={view} count={filtered.length} />
          <CategoryChart data={byCat} />
          <PersonBreakdown data={byPerson} total={totalSpent} />
          <SettlementCard settlement={settlement} onSettled={fetchData} />
          <RecentTransactions rows={recentRows} />
        </>
      )}

      {/* Filter sheet */}
      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onApply={applySheet}
        onClear={clearSheet}
      >
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
