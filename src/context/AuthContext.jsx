import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/auth/status')
      const data = await res.json()
      setIsAuthorized(data.authorized === true)
    } catch {
      setIsAuthorized(false)
    } finally {
      setIsChecking(false)
    }
  }

  async function startAuth() {
    const res = await fetch('/api/auth/url')
    const data = await res.json()
    if (!res.ok || !data.url) {
      console.error('Failed to get OAuth URL:', data)
      throw new Error(data.error || 'Could not build OAuth URL')
    }
    window.location.href = data.url
  }

  async function handleCallback(code) {
    const res = await fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    if (data.success) setIsAuthorized(true)
    return data.success
  }

  async function revokeAuth() {
    await fetch('/api/auth/revoke', { method: 'POST' })
    setIsAuthorized(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthorized, isChecking, startAuth, handleCallback, revokeAuth, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
