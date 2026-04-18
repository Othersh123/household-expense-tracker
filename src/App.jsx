import React from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PersonsProvider, usePersons } from './context/PersonsContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import Transactions from './pages/Transactions'
import AuthCallback from './pages/AuthCallback'
import AuthGate from './components/AuthGate'
import OnboardingNames from './components/OnboardingNames'

function PersonsGate() {
  const { loading, isSetupNeeded } = usePersons()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isSetupNeeded) return <OnboardingNames />

  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route element={<AuthGate />}>
        <Route element={<PersonsGate />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/add" element={<AddExpense />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PersonsProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </PersonsProvider>
    </AuthProvider>
  )
}
