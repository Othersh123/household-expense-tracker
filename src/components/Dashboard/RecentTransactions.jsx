import React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatters'
import { usePersons } from '../../context/PersonsContext'

const CATEGORY_EMOJI = {
  Rent: '🏠',
  Groceries: '🛒',
  'Food & Dining': '🍽️',
  Transport: '🚗',
  Utilities: '⚡',
  Shopping: '🛍️',
  Entertainment: '🎬',
  Health: '💊',
  Other: '📝',
}

const PERSON_BADGE_COLORS = ['bg-blue-100 text-blue-700', 'bg-blue-50 text-blue-600']

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

function formatDateHeading(str) {
  const d = parseRowDate(str)
  if (!d) return str
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
}

const MAX_PER_GROUP = 5
const MAX_GROUPS = 3

export default function RecentTransactions({ rows }) {
  const navigate = useNavigate()
  const { persons } = usePersons()

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Transactions</h3>
        <p className="text-sm text-gray-400 text-center py-4">No transactions yet</p>
      </div>
    )
  }

  const groups = []
  const seen = new Map()

  for (const r of rows) {
    const key = r.date
    if (!seen.has(key)) {
      seen.set(key, groups.length)
      groups.push({ date: key, items: [] })
    }
    groups[seen.get(key)].items.push(r)
  }

  const visibleGroups = groups.slice(0, MAX_GROUPS)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Transactions</h3>

      <div className="space-y-4">
        {visibleGroups.map(({ date, items }) => {
          const shown = items.slice(0, MAX_PER_GROUP)
          const overflow = items.length - MAX_PER_GROUP

          return (
            <div key={date}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {formatDateHeading(date)}
              </p>

              <div className="space-y-1">
                {shown.map((r, i) => {
                  const personIdx = persons.indexOf(r.person)
                  const badgeColor = PERSON_BADGE_COLORS[personIdx] ?? 'bg-gray-100 text-gray-600'
                  const initial = r.person?.[0]?.toUpperCase() ?? '?'

                  return (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                        {CATEGORY_EMOJI[r.category] || '📝'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-gray-900 truncate">{r.merchant || '—'}</p>
                          {r.person && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${badgeColor}`}>
                              {initial}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{r.category}</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 flex-shrink-0">
                        {formatCurrency(parseFloat(r.amount) || 0)}
                      </div>
                    </div>
                  )
                })}
              </div>

              {overflow > 0 && (
                <button
                  onClick={() => navigate(`/transactions?date=${encodeURIComponent(date)}`)}
                  className="mt-2 text-xs text-primary-600 font-medium hover:underline"
                >
                  View all {items.length} for {formatDateHeading(date)} →
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={() => navigate('/transactions')}
        className="mt-4 pt-3 border-t border-gray-100 w-full text-xs text-primary-600 font-medium hover:underline text-center block"
      >
        View all transactions →
      </button>
    </div>
  )
}
