import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, List, PlusCircle } from 'lucide-react'

const navLinkClass = ({ isActive }) =>
  `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
    isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
  }`

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-white shadow-sm">
      {/* Header */}
      <header className="bg-gray-900 text-white px-4 py-3 safe-top">
        <h1 className="text-lg font-bold tracking-tight">💰 Household Expenses</h1>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 flex safe-bottom">
        <NavLink to="/" end className={navLinkClass}>
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          Dashboard
        </NavLink>
        <NavLink to="/transactions" className={navLinkClass}>
          <List className="w-5 h-5 mb-0.5" />
          Transactions
        </NavLink>
        <NavLink to="/add" className={navLinkClass}>
          <PlusCircle className="w-5 h-5 mb-0.5" />
          Add Expense
        </NavLink>
      </nav>
    </div>
  )
}
