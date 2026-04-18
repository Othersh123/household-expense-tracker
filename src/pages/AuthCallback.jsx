import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const { handleCallback } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('Processing...')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      setStatus(`Authorization denied: ${error}`)
      setTimeout(() => navigate('/'), 2000)
      return
    }

    if (!code) {
      setStatus('No authorization code received.')
      setTimeout(() => navigate('/'), 2000)
      return
    }

    handleCallback(code)
      .then((ok) => {
        if (ok) {
          setStatus('Connected! Redirecting...')
          setTimeout(() => navigate('/'), 800)
        } else {
          setStatus('Authorization failed. Please try again.')
          setTimeout(() => navigate('/'), 2000)
        }
      })
      .catch((err) => {
        setStatus(`Error: ${err.message}`)
        setTimeout(() => navigate('/'), 2000)
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}
