import React, { useState } from 'react'
import { Keyboard, MessageSquare, Camera } from 'lucide-react'
import ManualTab from '../components/AddExpense/ManualTab'
import SmsTab from '../components/AddExpense/SmsTab'
import ScreenshotTab from '../components/AddExpense/ScreenshotTab'
import ReviewForm from '../components/AddExpense/ReviewForm'
import { SOURCES } from '../constants'
import { todayISO } from '../utils/formatters'
import { usePersons } from '../context/PersonsContext'

const TABS = [
  { id: 'manual', label: 'Manual', Icon: Keyboard },
  { id: 'sms', label: 'SMS', Icon: MessageSquare },
  { id: 'screenshot', label: 'Screenshot', Icon: Camera },
]

export default function AddExpense() {
  const { persons } = usePersons()
  const [activeTab, setActiveTab] = useState('manual')
  const [reviewData, setReviewData] = useState(null)
  const [source, setSource] = useState(SOURCES.MANUAL)
  const [successMsg, setSuccessMsg] = useState('')

  const emptyForm = () => ({
    date: todayISO(),
    amount: '',
    merchant: '',
    category: 'Other',
    paymentMethod: 'UPI',
    person: persons[0] || '',
    account: '',
    notes: '',
  })

  function handleParsed(data, src) {
    setSource(src)
    setReviewData({ ...emptyForm(), ...data })
  }

  function handleManualEdit(fields) {
    setSource(SOURCES.MANUAL)
    setReviewData({ ...emptyForm(), ...fields })
  }

  function handleBack() {
    setReviewData(null)
    setSuccessMsg('')
  }

  function handleSuccess() {
    setReviewData(null)
    setSuccessMsg('Expense saved!')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  if (reviewData) {
    return (
      <ReviewForm
        initial={reviewData}
        source={source}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Add Expense</h2>

      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
          ✓ {successMsg}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5 gap-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'manual' && (
        <ManualTab onReview={handleManualEdit} />
      )}
      {activeTab === 'sms' && (
        <SmsTab onParsed={(data) => handleParsed(data, SOURCES.SMS)} />
      )}
      {activeTab === 'screenshot' && (
        <ScreenshotTab onParsed={(data) => handleParsed(data, SOURCES.SCREENSHOT)} />
      )}
    </div>
  )
}
