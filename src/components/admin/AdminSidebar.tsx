'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clearAdminSession } from '@/lib/adminAuth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getBusinessStatusAsync, setBusinessStatus as updateBusinessStatus, BusinessStatusData } from '@/lib/businessStatus'
import { useToastContext } from '@/components/providers/ToastProvider'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const toast = useToastContext()
  const [businessStatus, setBusinessStatus] = useState<BusinessStatusData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    const status = await getBusinessStatusAsync()
    setBusinessStatus(status)
  }

  const handleToggleStatus = async () => {
    if (!businessStatus) return
    setLoading(true)
    try {
      const newIsOpen = !businessStatus.isOpen
      await updateBusinessStatus(newIsOpen, businessStatus.message)
      setBusinessStatus({ ...businessStatus, isOpen: newIsOpen })
      toast.success(`Store is now ${newIsOpen ? 'OPEN' : 'CLOSED'}`)
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/orders', label: 'Orders', icon: '📋' },
    { href: '/admin/menu', label: 'Menu Items', icon: '🍽️' },
    { href: '/admin/customers', label: 'Customers', icon: '👥' },
  ]

  const handleLogout = () => {
    clearAdminSession()
    router.push('/admin/login')
  }


  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      <aside className={`w-64 bg-white shadow-lg min-h-screen fixed left-0 top-0 z-50 border-r border-gray-200 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                👨‍🍳
              </div>
              <div>
                <h2 className="font-bold text-gray-800 text-lg">Admin Panel</h2>
                <p className="text-xs text-gray-500">Mnandi Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="md:hidden text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                      ? 'bg-green-50 text-green-700 font-semibold border-l-4 border-green-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          {/* Business Status Toggle */}
          {/* Business Status Toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Store Status</span>
              {businessStatus ? (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${businessStatus.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {businessStatus.isOpen ? 'OPEN' : 'CLOSED'}
                </span>
              ) : (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 animate-pulse">
                  ...
                </span>
              )}
            </div>
            <button
              onClick={handleToggleStatus}
              disabled={loading || !businessStatus}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${!businessStatus
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : businessStatus.isOpen
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                }`}
            >
              {loading || !businessStatus ? 'Updating...' : (businessStatus.isOpen ? 'Close Store' : 'Open Store')}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

