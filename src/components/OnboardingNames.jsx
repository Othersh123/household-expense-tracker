import React, { useState } from 'react'
import { Users } from 'lucide-react'
import { usePersons } from '../context/PersonsContext'

export default function OnboardingNames() {
  const { savePersons } = usePersons()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!p1.trim()) return
    savePersons(p1.trim(), p2.trim())
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Who's in your household?</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter the names used in your expense sheet. These will appear in all dropdowns and charts.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Person 1 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Person 2</label>
            <input
              type="text"
              placeholder="e.g. Priya (optional)"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={!p1.trim()}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors mt-2"
          >
            Get Started →
          </button>
        </form>
      </div>
    </div>
  )
}
