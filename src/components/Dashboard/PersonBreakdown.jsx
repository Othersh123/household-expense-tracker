import React from 'react'
import { formatCurrency } from '../../utils/formatters'
import { usePersons } from '../../context/PersonsContext'

const BAR_COLORS = ['bg-blue-600', 'bg-blue-300']

export default function PersonBreakdown({ data, total }) {
  const { persons } = usePersons()
  const entries = Object.entries(data)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">By Person</h3>
      <div className="space-y-3">
        {entries.map(([person, amount]) => {
          const pct = total > 0 ? Math.round((amount / total) * 100) : 0
          const idx = persons.indexOf(person)
          const barColor = BAR_COLORS[idx] ?? 'bg-gray-400'
          return (
            <div key={person}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{person}</span>
                <span className="text-gray-500">{formatCurrency(amount)} <span className="text-gray-400">({pct}%)</span></span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
