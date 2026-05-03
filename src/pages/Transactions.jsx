import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, RefreshCw, SlidersHorizontal, X, Pencil, Trash2, ChevronDown, CheckCircle2 } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { formatCurrency } from '../utils/formatters'
import FilterSheet, { FilterSelect } from '../components/FilterSheet'
import { usePersons } from '../context/PersonsContext'
import EditTransactionModal from '../components/Transactions/EditTransactionModal'

const RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 1 month', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last 1 year', days: 365 },
]
const DEFAULT_RANGE = 30

const PAYMENT_METHODS = ['All', 'UPI', 'Credit Card', 'Debit Card', 'Cash']
const CATEGORIES_FILTER = ['All', 'Rent', 'Groceries', 'Food & Dining', 'Transport', 'Utilities', 'Shopping', 'Entertainment', 'Health', 'Other', 'Settlement']

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

// Handles "true" (RAW write), "TRUE" (USER_ENTERED boolean read-back), and boolean true
function isRowDeleted(r) {
  return String(r.deleted).toLowerCase() === 'true'
}

export default function Transactions() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dateParam = searchParams.get('date')

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [editingRow, setEditingRow] = useState(null)
  const [toast, setToast] = useState('')

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Applied filters
  const [rangeDays, setRangeDays] = useState(DEFAULT_RANGE)
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [accountFilter, setAccountFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showDeleted, setShowDeleted] = useState(false)

  // Draft filters (while sheet is open)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draftRange, setDraftRange] = useState(DEFAULT_RANGE)
  const [draftPayment, setDraftPayment] = useState('All')
  const [draftAccount, setDraftAccount] = useState('All')
  const [draftCategory, setDraftCategory] = useState('All')
  const [draftShowDeleted, setDraftShowDeleted] = useState(false)

  const hasActiveFilters = rangeDays !== DEFAULT_RANGE || paymentFilter !== 'All' || accountFilter !== 'All' || categoryFilter !== 'All' || showDeleted

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
    setDraftCategory(categoryFilter)
    setDraftShowDeleted(showDeleted)
    setSheetOpen(true)
  }

  function applySheet() {
    setRangeDays(draftRange)
    setPaymentFilter(draftPayment)
    setAccountFilter(draftAccount)
    setCategoryFilter(draftCategory)
    setShowDeleted(draftShowDeleted)
    setSheetOpen(false)
  }

  function clearSheet() {
    setDraftRange(DEFAULT_RANGE)
    setDraftPayment('All')
    setDraftAccount('All')
    setDraftCategory('All')
    setDraftShowDeleted(false)
    setRangeDays(DEFAULT_RANGE)
    setPaymentFilter('All')
    setAccountFilter('All')
    setCategoryFilter('All')
    setShowDeleted(false)
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
          return d && d >= cutoff && r.paymentMethod === draftPayment && r.account?.trim() && !isRowDeleted(r)
        })
        .map((r) => r.account.trim())
    )]
  }, [rows, draftRange, draftPayment])

  // Applied filter result
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()

    return rows
      .filter((r) => {
        if (!showDeleted && isRowDeleted(r)) return false

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
          if (categoryFilter !== 'All' && r.category !== categoryFilter) return false
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
  }, [rows, dateParam, rangeDays, paymentFilter, accountFilter, categoryFilter, search, showDeleted])

  // Total excludes deleted rows and settlement entries
  const total = useMemo(
    () => displayed.filter((r) => !isRowDeleted(r) && r.splitType !== 'Settlement').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0),
    [displayed]
  )

  const activeRangeLabel = RANGES.find((r) => r.days === rangeDays)?.label ?? 'Custom'

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleEditSuccess() {
    setEditingRow(null)
    showToast('Transaction updated')
    fetchData()
  }

  function openDeleteConfirm(row) {
    setConfirmDelete(row)
    setDeleteError('')
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/sheets/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: confirmDelete.rowIndex }),
      })
      const data = await res.json()
      console.log('[Delete] API response:', data, 'for rowIndex:', confirmDelete.rowIndex)
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to delete')

      // Optimistic update — mark the row deleted in local state immediately without
      // waiting for a re-fetch. This is the source of truth for the visual treatment.
      const targetIndex = confirmDelete.rowIndex
      setRows((prev) => {
        const updated = prev.map((r) =>
          r.rowIndex === targetIndex ? { ...r, deleted: 'true' } : r
        )
        console.log('[Delete] Row after optimistic update:', updated.find((r) => r.rowIndex === targetIndex))
        console.log('[Delete] All rows passed to render:', updated)
        return updated
      })

      setConfirmDelete(null)
      showToast('Transaction deleted')
      fetchData() // background sync — keeps sheet and local state in agreement
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {editingRow && (
        <EditTransactionModal
          row={editingRow}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingRow(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl w-full max-w-md px-5 pt-5 pb-8 space-y-3">
            <h3 className="text-base font-semibold text-gray-900">Delete this transaction?</h3>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{confirmDelete.merchant}</span>
              {' — '}
              {formatCurrency(parseFloat(confirmDelete.amount) || 0)}
            </p>
            <p className="text-sm text-gray-400">This cannot be undone.</p>
            {deleteError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {deleteError}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setConfirmDelete(null)}
                className="py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg pointer-events-none">
          {toast}
        </div>
      )}

      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-4 pb-3 space-y-3">
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
            {categoryFilter !== 'All' && (
              <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-full px-2.5 py-0.5 font-medium">
                {categoryFilter}
              </span>
            )}
            {showDeleted && (
              <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2.5 py-0.5 font-medium">
                Including deleted
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
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-3">
          <div className="flex items-start justify-between">
            <div>
              <p style={{ fontSize: 30 }} className="font-bold leading-tight tracking-tight text-blue-900">
                {formatCurrency(total)}
              </p>
              <p className="text-sm text-blue-800/70 mt-1">
                {displayed.filter((r) => !isRowDeleted(r)).length} transaction{displayed.filter((r) => !isRowDeleted(r)).length !== 1 ? 's' : ''}
                {showDeleted && displayed.some((r) => isRowDeleted(r)) && (
                  <span className="text-red-400/70 ml-1">
                    + {displayed.filter((r) => isRowDeleted(r)).length} deleted
                  </span>
                )}
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
            {displayed.map((r, i) => (
              <TransactionRow
                key={r.rowIndex ?? i}
                r={r}
                onEdit={setEditingRow}
                onDelete={openDeleteConfirm}
              />
            ))}
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

        <FilterSelect label="Category" value={draftCategory} onChange={setDraftCategory}>
          {CATEGORIES_FILTER.map((c) => <option key={c} value={c}>{c}</option>)}
        </FilterSelect>

        {/* Show deleted toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Show deleted</label>
          <button
            onClick={() => setDraftShowDeleted((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${draftShowDeleted ? 'bg-primary-600' : 'bg-gray-200'}`}
            aria-label="Toggle show deleted"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${draftShowDeleted ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </FilterSheet>
    </div>
  )
}

function TransactionRow({ r, onEdit, onDelete }) {
  const { persons } = usePersons()
  const [showSplit, setShowSplit] = useState(false)
  const personIdx = persons.indexOf(r.person)
  const personBadge = PERSON_BADGE_COLORS[personIdx] ?? 'bg-gray-100 text-gray-600'
  const deleted = isRowDeleted(r)
  const isShared = !deleted && r.splitType === 'Shared'
  const isSettlement = !deleted && r.splitType === 'Settlement'

  let splitAmounts = null
  if (isShared && r.splitDetails) {
    try { splitAmounts = JSON.parse(r.splitDetails) } catch {}
  }

  return (
    <div className={`border rounded-2xl px-4 py-3 shadow-sm ${deleted ? 'bg-gray-50 border-gray-100 opacity-50' : 'bg-white border-gray-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-semibold truncate flex-1 ${deleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {r.merchant || '—'}
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <p className={`text-sm font-bold ${deleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {formatCurrency(parseFloat(r.amount) || 0)}
          </p>
          {!deleted && !isSettlement && (
            <>
              <button
                onClick={() => onEdit(r)}
                className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
                aria-label="Edit transaction"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(r)}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors -mr-1"
                aria-label="Delete transaction"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        <span className="text-xs text-gray-400">{formatRowDate(r.date)}</span>
        <span className="text-gray-200">·</span>
        {deleted && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">
            Deleted
          </span>
        )}
        {isSettlement ? (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Settled
          </span>
        ) : !deleted && r.category && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[r.category] || CATEGORY_COLORS.Other}`}>
            {r.category}
          </span>
        )}
        {!deleted && r.person && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${personBadge}`}>
            {r.person}
          </span>
        )}
        {!deleted && r.paymentMethod && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_COLOR[r.paymentMethod] || 'bg-gray-100 text-gray-600'}`}>
            {r.paymentMethod}
          </span>
        )}
        {isShared && (
          <button
            onClick={() => setShowSplit((v) => !v)}
            className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
          >
            Shared
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showSplit ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {!deleted && r.account && (
        <p className="text-xs text-gray-400 mt-1 truncate">{r.account}</p>
      )}

      {/* Expandable split breakdown */}
      {showSplit && splitAmounts && (
        <div className="mt-2 pt-2 border-t border-violet-100">
          <div className="flex gap-4">
            {Object.entries(splitAmounts).map(([person, amt]) => (
              <div key={person} className="flex items-baseline gap-1">
                <span className="text-xs text-gray-500">{person}</span>
                <span className="text-xs font-semibold text-violet-700 tabular-nums">
                  {formatCurrency(parseFloat(amt) || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
