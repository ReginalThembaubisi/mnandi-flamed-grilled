'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clearAdminSession } from '@/lib/adminAuth'
import { useRouter } from 'next/navigation'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/orders', label: 'Orders', icon: '📋' },
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
      
      <aside className={`w-64 bg-white shadow-lg min-h-screen fixed left-0 top-0 z-50 border-r border-gray-200 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
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
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
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

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
    </>
  )
}

