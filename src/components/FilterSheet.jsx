import React from 'react'
import { X } from 'lucide-react'

/**
 * Generic bottom-sheet filter panel.
 * onApply() — commit draft and close
 * onClear()  — reset to defaults and close
 * onClose()  — discard draft and close
 */
export default function FilterSheet({ open, onClose, onApply, onClear, children }) {
  if (!open) return null
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-2xl z-50 shadow-2xl">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Filters</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter fields */}
        <div className="px-4 py-4 space-y-4">
          {children}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-4 pt-2 pb-8 border-t border-gray-100">
          <button
            onClick={onClear}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear filters
          </button>
          <button
            onClick={onApply}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  )
}

export function FilterSelect({ label, value, onChange, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
      >
        {children}
      </select>
    </div>
  )
}
