import React from 'react'
import { TrendingDown, Receipt } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'

export default function SummaryCards({ total, view, count }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2 text-blue-800">
          <TrendingDown className="w-4 h-4" />
          <span className="text-xs font-medium">{view === 'week' ? 'This Week' : 'This Month'}</span>
        </div>
        <div className="text-2xl font-bold text-blue-900">{formatCurrency(total)}</div>
        <div className="text-xs text-blue-800/60 mt-1">Total spent</div>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2 text-gray-500">
          <Receipt className="w-4 h-4" />
          <span className="text-xs font-medium">Transactions</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{count}</div>
        <div className="text-xs text-gray-400 mt-1">Entries logged</div>
      </div>
    </div>
  )
}
