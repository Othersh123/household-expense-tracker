import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const LS_KEY = 'household_users'
const PersonsContext = createContext(null)

function readFromStorage() {
  try {
    const val = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
    return Array.isArray(val) && val.length > 0 ? val : null
  } catch {
    return null
  }
}

export function PersonsProvider({ children }) {
  const { isAuthorized } = useAuth()
  const [persons, setPersons] = useState(() => readFromStorage())
  const [loading, setLoading] = useState(false)
  const [isSetupNeeded, setIsSetupNeeded] = useState(false)

  useEffect(() => {
    if (!isAuthorized) return
    const cached = readFromStorage()
    if (cached) {
      setPersons(cached)
      return
    }
    setLoading(true)
    fetch('/api/sheets/read')
      .then((r) => r.json())
      .then((data) => {
        const rows = data.rows || []
        const unique = []
        for (const r of rows) {
          const p = r.person?.trim()
          if (p && !unique.includes(p)) {
            unique.push(p)
            if (unique.length >= 2) break
          }
        }
        if (unique.length > 0) {
          localStorage.setItem(LS_KEY, JSON.stringify(unique))
          setPersons(unique)
        } else {
          setIsSetupNeeded(true)
        }
      })
      .catch(() => setIsSetupNeeded(true))
      .finally(() => setLoading(false))
  }, [isAuthorized])

  function savePersons(p1, p2) {
    const arr = [p1, p2].filter(Boolean).map((p) => p.trim())
    localStorage.setItem(LS_KEY, JSON.stringify(arr))
    setPersons(arr)
    setIsSetupNeeded(false)
  }

  return (
    <PersonsContext.Provider value={{ persons: persons || [], loading, isSetupNeeded, savePersons }}>
      {children}
    </PersonsContext.Provider>
  )
}

export const usePersons = () => useContext(PersonsContext)
