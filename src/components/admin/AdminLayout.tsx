'use client'

import { AdminSidebar } from './AdminSidebar'
import { useState } from 'react'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 ml-0 md:ml-64">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <span className="text-2xl">☰</span>
        </button>
        
        <div className="p-4 md:p-6 pt-16 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}

