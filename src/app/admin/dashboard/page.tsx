'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { setAdminPassword, verifyPasswordForChange, clearAdminSession, validateAdminSession, formatTimeRemaining } from '../../../lib/adminAuth'
import { setBusinessStatus, getBusinessStatus, BusinessStatusData } from '../../../lib/businessStatus'
import { AdminLayout } from '../../../components/admin/AdminLayout'
import { useToastContext } from '@/components/providers/ToastProvider'
import { sanitizeText, sanitizePhoneForWhatsApp, sanitizeMessageForWhatsApp, validateAndSanitizePhone, safeJsonParse, safeJsonStringify } from '../../../lib/security'

interface CartItem {
  id: string
  name: string
  price: string
  image?: string
  description?: string
  quantity: number
}

interface CustomerInfo {
  name: string
  roomNumber: string
  phoneNumber: string
  deliveryType: 'pickup' | 'delivery'
  deliveryAddress?: string
}

interface Order {
  customer: CustomerInfo
  items: CartItem[]
  total: number
  timestamp: string
  orderId: string
  status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
}

interface DailySales {
  date: string
  totalRevenue: number
  orderCount: number
  items: { [key: string]: number }
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [loading, setLoading] = useState(true)
  const [liveOrderCount, setLiveOrderCount] = useState(0)
  const [businessStatus, setBusinessStatus] = useState<BusinessStatusData>({isOpen: true, timestamp: new Date().toISOString()})
  const [newOrderNotification, setNewOrderNotification] = useState<Order | null>(null)
  const [lastOrderCount, setLastOrderCount] = useState(0)
  const [lastOrderIds, setLastOrderIds] = useState<string[]>([])
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const router = useRouter()
  const { isAuthenticated, isChecking, session } = useAdminAuth()
  const [sessionWarning, setSessionWarning] = useState<string | null>(null)
  const toast = useToastContext()

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      return
    }

    if (!isAuthenticated) {
      return
    }

    loadData()
    loadBusinessStatus()

    // Realtime updates from Supabase (if configured)
    const supabase = getSupabase()
    let channel: any = null
    if (supabase) {
      channel = supabase
        .channel('orders-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          loadData()
        })
        .subscribe()
    }

    // Initialize order tracking
    const storedOrders = localStorage.getItem('orders')
    if (storedOrders) {
      const currentOrders = safeJsonParse<Order[]>(storedOrders, [])
      setLastOrderCount(currentOrders.length)
      setLastOrderIds(currentOrders.map(order => order.orderId))
    }

    // Set up real-time order monitoring
    const orderInterval = setInterval(() => {
      checkForNewOrders()
    }, 5000) // Check every 5 seconds

    return () => {
      clearInterval(orderInterval)
      if (supabase && channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [router, isAuthenticated, isChecking])

  // Check session timeout warning
  useEffect(() => {
    if (!isAuthenticated || !session.isValid) return

    const checkSession = () => {
      const authSession = validateAdminSession()
      if (authSession.isValid && authSession.timeRemaining) {
        // Show warning if less than 30 minutes remaining
        if (authSession.timeRemaining < 30 * 60 * 1000) {
          setSessionWarning(formatTimeRemaining(authSession.timeRemaining))
        } else {
          setSessionWarning(null)
        }
      }
    }

    checkSession()
    const interval = setInterval(checkSession, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [isAuthenticated, session.isValid])

  // Real-time order monitoring
  const checkForNewOrders = () => {
    const storedOrders = localStorage.getItem('orders')
    if (storedOrders) {
      const currentOrders = safeJsonParse<Order[]>(storedOrders, [])
      const currentOrderIds = currentOrders.map(order => order.orderId)
      
      // Check for truly new orders (not just count changes)
      const newOrderIds = currentOrderIds.filter(id => !lastOrderIds.includes(id))
      
      if (newOrderIds.length > 0) {
        // Find the newest order that's not completed/cancelled
        const newActiveOrder = currentOrders
          .filter(order => newOrderIds.includes(order.orderId))
          .filter(order => order.status !== 'completed' && order.status !== 'cancelled')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        
        if (newActiveOrder) {
          setNewOrderNotification(newActiveOrder)
          
          // Auto-hide notification after 10 seconds
          setTimeout(() => {
            setNewOrderNotification(null)
          }, 10000)
        }
      }
      
      setLastOrderCount(currentOrders.length)
      setLastOrderIds(currentOrderIds)
    }
  }

  // Load business status
  const loadBusinessStatus = async () => {
    const status = getBusinessStatus()
    if (status) {
      setBusinessStatus(status)
    } else {
      // Try to get from Supabase
      const { getBusinessStatusFromSupabase } = await import('../../../lib/businessStatus')
      const supabaseStatus = await getBusinessStatusFromSupabase()
      if (supabaseStatus) {
        setBusinessStatus(supabaseStatus)
      }
    }
  }

  // Toggle business status
  const toggleBusinessStatus = async () => {
    const newIsOpen = !businessStatus.isOpen
    await setBusinessStatus(newIsOpen, businessStatus.message)
    
    // Update local state
    const updatedStatus: BusinessStatusData = {
      ...businessStatus,
      isOpen: newIsOpen,
      timestamp: new Date().toISOString()
    }
    setBusinessStatus(updatedStatus)
  }

  // Update order status
  const updateOrderStatus = (orderId: string, newStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled') => {
    const updatedOrders = orders.map(order => 
      order.orderId === orderId ? { ...order, status: newStatus } : order
    )
    setOrders(updatedOrders)
    localStorage.setItem('orders', safeJsonStringify(updatedOrders))

    // Persist to Supabase (if configured)
    ;(async () => {
      try {
        const supabase = getSupabase()
        if (supabase) {
          await supabase.from('orders').update({ status: newStatus }).eq('order_id', orderId)
        }
      } catch (e) {
        // no-op; local state already updated
      }
    })()
    
    // Clear notification if this order was being shown and is now completed/cancelled
    if ((newStatus === 'completed' || newStatus === 'cancelled') && 
        newOrderNotification && 
        newOrderNotification.orderId === orderId) {
      setNewOrderNotification(null)
    }
    
    // Send WhatsApp notification when order is ready
    if (newStatus === 'ready') {
      const order = updatedOrders.find(o => o.orderId === orderId)
      if (order) {
        sendWhatsAppNotification(order)
      }
    }
  }

  // Format phone number for WhatsApp (with security)
  const formatPhoneNumber = (phoneNumber: string) => {
    try {
      const validation = validateAndSanitizePhone(phoneNumber)
      if (!validation.valid) {
        throw new Error('Invalid phone number')
      }
      
      let cleanNumber = validation.sanitized
      
      // If number starts with 0, replace with 27 (South Africa)
      if (cleanNumber.startsWith('0')) {
        cleanNumber = '27' + cleanNumber.substring(1)
      }
      // If number doesn't start with country code, add 27
      else if (!cleanNumber.startsWith('27')) {
        cleanNumber = '27' + cleanNumber
      }
      
      // Final security check
      return sanitizePhoneForWhatsApp(cleanNumber)
    } catch (error) {
      console.error('Error formatting phone number:', error)
      throw new Error('Invalid phone number format')
    }
  }

  // Send WhatsApp notification
  const sendWhatsAppNotification = (order: Order) => {
    try {
      const deliveryInfo = order.customer.deliveryType === 'delivery' 
        ? `🚚 *Delivery Details:*
• Address: ${sanitizeText(order.customer.deliveryAddress || '')}
• Customer: ${sanitizeText(order.customer.name)}

✅ Your order is ready for delivery! We'll be coming to deliver it soon.`
        : `📍 *Pickup Details:*
• Room: ${sanitizeText(order.customer.roomNumber)}
• Customer: ${sanitizeText(order.customer.name)}

✅ Your order is ready for pickup! Please come and collect it.`

      const message = `🍽️ *Your Mnandi Flame-Grilled Order is Ready!*

📋 *Order #${sanitizeText(order.orderId)}*

📦 *Order Details:*
${order.items.map(item => `• ${sanitizeText(item.name)} x${item.quantity}`).join('\n')}

💰 *Total: R${order.total.toFixed(2)}*

${deliveryInfo}

🙏 Thank you for choosing Mnandi Flame-Grilled!`
      
      const phoneNumber = formatPhoneNumber(order.customer.phoneNumber)
      const sanitizedMessage = sanitizeMessageForWhatsApp(message)
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(sanitizedMessage)}`
      
      // Send WhatsApp notification
      window.open(whatsappUrl, '_blank')
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error)
      alert('Error sending WhatsApp notification. Please check the phone number format.')
    }
  }

  const loadData = () => {
    try {
      // Fetch from Supabase first (if configured)
      ;(async () => {
        const supabase = getSupabase()
        if (supabase) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('timestamp', { ascending: false })
          if (!error && data) {
          const mapped: Order[] = data.map((r: any) => ({
            customer: r.customer,
            items: r.items,
            total: Number(r.total) || 0,
            timestamp: r.timestamp,
            orderId: r.order_id,
            status: r.status || 'pending'
          }))
          setOrders(mapped)
          calculateDailySales(mapped)
          const active = mapped.filter(o => o.status !== 'completed' && o.status !== 'cancelled')
          setLiveOrderCount(active.length)
          setLoading(false)
          return
          }
        }
        // Fallback to localStorage
        const savedOrders = safeJsonParse<Order[]>(localStorage.getItem('orders') || '[]', [])
        const ordersWithStatus: Order[] = savedOrders.map((order: Order) => ({
          ...order,
          status: order.status || 'pending'
        }))
        setOrders(ordersWithStatus)
        calculateDailySales(ordersWithStatus)
        const activeOrders = ordersWithStatus.filter(order => order.status !== 'completed' && order.status !== 'cancelled')
        setLiveOrderCount(activeOrders.length)
        setLoading(false)
      })()
      
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      // setLoading handled above
    }
  }

  const calculateDailySales = (ordersData: Order[]) => {
    const salesMap: { [key: string]: DailySales } = {}

    ordersData.forEach(order => {
      const date = new Date(order.timestamp).toISOString().split('T')[0]
      
      if (!salesMap[date]) {
        salesMap[date] = {
          date,
          totalRevenue: 0,
          orderCount: 0,
          items: {}
        }
      }

      salesMap[date].totalRevenue += order.total
      salesMap[date].orderCount += 1

      // Count items sold
      order.items.forEach(item => {
        if (!salesMap[date].items[item.name]) {
          salesMap[date].items[item.name] = 0
        }
        salesMap[date].items[item.name] += item.quantity
      })
    })

    const dailySalesArray = Object.values(salesMap).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    setDailySales(dailySalesArray)
  }

  const handleLogout = () => {
    clearAdminSession()
    router.push('/admin/login')
  }

  const getTodaySales = () => {
    const today = new Date().toISOString().split('T')[0]
    return dailySales.find(sales => sales.date === today) || {
      date: today,
      totalRevenue: 0,
      orderCount: 0,
      items: {}
    }
  }



  const getTotalCustomers = () => {
    const customerPhones = new Set(orders.map(order => order.customer.phoneNumber))
    return customerPhones.size
  }

  const getWeeklySummary = () => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay()) // Start of current week (Sunday)
    
    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(weekStart.getDate() - 7)
    const lastWeekEnd = new Date(weekStart)
    lastWeekEnd.setDate(weekStart.getDate() - 1)

    const thisWeekOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp)
      return orderDate >= weekStart
    })

    const lastWeekOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp)
      return orderDate >= lastWeekStart && orderDate <= lastWeekEnd
    })

    const thisWeekRevenue = thisWeekOrders.reduce((sum, order) => sum + order.total, 0)
    const lastWeekRevenue = lastWeekOrders.reduce((sum, order) => sum + order.total, 0)

    return {
      thisWeek: { revenue: thisWeekRevenue, orders: thisWeekOrders.length },
      lastWeek: { revenue: lastWeekRevenue, orders: lastWeekOrders.length },
      change: thisWeekRevenue - lastWeekRevenue,
      changePercent: lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100) : 0
    }
  }

  const getCustomerAnalytics = () => {
    const customerMap = new Map()
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    orders.forEach(order => {
      const phone = order.customer.phoneNumber
      const orderDate = new Date(order.timestamp)
      
      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          firstOrder: orderDate,
          orderCount: 0,
          totalSpent: 0,
          lastOrder: orderDate
        })
      }
      
      const customer = customerMap.get(phone)
      customer.orderCount += 1
      customer.totalSpent += order.total
      if (orderDate > customer.lastOrder) {
        customer.lastOrder = orderDate
      }
    })

    const customers = Array.from(customerMap.values())
    const newCustomers = customers.filter(c => c.firstOrder >= thirtyDaysAgo).length
    const returningCustomers = customers.filter(c => c.orderCount > 1).length
    const averageOrderValue = customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0

    return {
      total: customers.length,
      new: newCustomers,
      returning: returningCustomers,
      averageOrderValue: averageOrderValue
    }
  }

  const getMonthlyAnalytics = () => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp)
      return orderDate >= thirtyDaysAgo
    })

    const totalRevenue = monthlyOrders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = monthlyOrders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Group by week for trend analysis
    const weeklyData = []
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(thirtyDaysAgo)
      weekStart.setDate(thirtyDaysAgo.getDate() + (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      
      const weekOrders = monthlyOrders.filter(order => {
        const orderDate = new Date(order.timestamp)
        return orderDate >= weekStart && orderDate <= weekEnd
      })
      
      const weekRevenue = weekOrders.reduce((sum, order) => sum + order.total, 0)
      const weekOrderCount = weekOrders.length
      
      weeklyData.push({
        week: i + 1,
        revenue: weekRevenue,
        orders: weekOrderCount,
        label: `Week ${i + 1}`
      })
    }

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      weeklyData
    }
  }

  const clearAllData = () => {
    if (confirm('⚠️ WARNING: This will delete ALL data including orders, customers, and cart items. This cannot be undone!\n\nAre you sure you want to continue?')) {
      // Clear all localStorage data
      localStorage.removeItem('orders')
      localStorage.removeItem('cart')
      localStorage.removeItem('customerInfo')
      localStorage.removeItem('customers')
      localStorage.removeItem('specials')
      
      // Reload the page to refresh all data
      window.location.reload()
    }
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    
    // Verify current password
    if (!verifyPasswordForChange(currentPassword)) {
      setPasswordError('Current password is incorrect')
      return
    }
    
    // Validate new password
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long')
      return
    }
    
    // Update password (stores hashed version)
    setAdminPassword(newPassword)
    
    // Reset form
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowChangePassword(false)
    setPasswordError('')
    
    toast.success('Password updated successfully!')
  }

  const resetChangePassword = () => {
    setShowChangePassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
  }

  if (isChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect via useAdminAuth
  }

  const todaySales = getTodaySales()

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-sm sm:text-base text-gray-600">Monitor your business performance and manage orders</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => setShowChangePassword(true)}
            className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2 text-sm font-medium min-h-[44px]"
          >
            <span>🔐</span>
            <span>Change Password</span>
          </button>
          <button
            onClick={clearAllData}
            className="px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center space-x-2 text-sm font-medium min-h-[44px]"
          >
            <span>🗑️</span>
            <span>Clear All Data</span>
          </button>
        </div>

        {/* Session Timeout Warning */}
        {sessionWarning && (
          <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⏰</span>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">Session Expiring Soon</h3>
                  <p className="text-yellow-700">
                    Your session will expire in {sessionWarning}. Please save your work.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSessionWarning(null)}
                className="text-yellow-600 hover:text-yellow-800 text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* New Order Notification */}
        {newOrderNotification && (
          <div className="mb-6 bg-green-100 border-l-4 border-green-500 p-4 rounded-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🔔</span>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">New Order Alert!</h3>
                  <p className="text-green-700">
                    Order #{newOrderNotification.orderId} from {newOrderNotification.customer.name} - R{newOrderNotification.total.toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setNewOrderNotification(null)
                  // Also update the last order IDs to prevent re-showing
                  if (newOrderNotification) {
                    setLastOrderIds(prev => [...prev, newOrderNotification.orderId])
                  }
                }}
                className="text-green-600 hover:text-green-800 text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Business Status Control */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xl">
                🏪
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Business Status</h2>
                <p className="text-sm text-gray-500">Control when customers can place orders</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                businessStatus.isOpen 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {businessStatus.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
              </div>
              <button
                onClick={toggleBusinessStatus}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all text-sm ${
                  businessStatus.isOpen 
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                }`}
              >
                {businessStatus.isOpen ? 'Close Business' : 'Open Business'}
              </button>
            </div>
          </div>
          {businessStatus.message && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">{businessStatus.message}</p>
            </div>
          )}
        </div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
                  🔐
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Change Password</h2>
              </div>
              <button
                onClick={resetChangePassword}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                  minLength={6}
                />
              </div>
              
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{passwordError}</p>
                </div>
              )}
              
              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={resetChangePassword}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Today's Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm font-medium mb-1">Today's Revenue</p>
                <p className="text-3xl font-bold text-green-900">R{todaySales.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-1">Total sales today</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center text-white text-xl">
                💰
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm font-medium mb-1">Today's Orders</p>
                <p className="text-3xl font-bold text-blue-900">{todaySales.orderCount}</p>
                <p className="text-xs text-blue-600 mt-1">Orders received</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xl">
                📋
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm font-medium mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-purple-900">{getTotalCustomers()}</p>
                <p className="text-xs text-purple-600 mt-1">All-time customers</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center text-white text-xl">
                👥
              </div>
            </div>
          </div>
        </div>

        {/* Live Order Counter & Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Live Order Count</p>
                <p className="text-4xl font-bold mb-1">{liveOrderCount}</p>
                <p className="text-green-100 text-xs">Active orders in queue</p>
              </div>
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl">
                📊
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Average Order Value</p>
                <p className="text-4xl font-bold mb-1">R{getCustomerAnalytics().averageOrderValue.toFixed(0)}</p>
                <p className="text-blue-100 text-xs">Per customer</p>
              </div>
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl">
                💰
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-xl">
              📅
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Weekly Summary</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">This Week</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue:</span>
                  <span className="font-semibold text-green-600">R{getWeeklySummary().thisWeek.revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Orders:</span>
                  <span className="font-semibold text-blue-600">{getWeeklySummary().thisWeek.orders}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">vs Last Week</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Change:</span>
                  <span className={`font-semibold ${getWeeklySummary().change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {getWeeklySummary().change >= 0 ? '+' : ''}R{getWeeklySummary().change.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Change %:</span>
                  <span className={`font-semibold ${getWeeklySummary().changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {getWeeklySummary().changePercent >= 0 ? '+' : ''}{getWeeklySummary().changePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl">
              📊
            </div>
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">Monthly Performance (Last 30 Days)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold">R{getMonthlyAnalytics().totalRevenue.toFixed(2)}</p>
                  <p className="text-green-100 text-xs mt-1">Last 30 days</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold">{getMonthlyAnalytics().totalOrders}</p>
                  <p className="text-blue-100 text-xs mt-1">Last 30 days</p>
                </div>
                <div className="text-3xl">📋</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Avg Order Value</p>
                  <p className="text-3xl font-bold">R{getMonthlyAnalytics().averageOrderValue.toFixed(2)}</p>
                  <p className="text-purple-100 text-xs mt-1">Per order</p>
                </div>
                <div className="text-3xl">📈</div>
              </div>
            </div>
          </div>
          
          {/* Weekly Trend Chart */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">📈 Weekly Trend (Last 4 Weeks)</h3>
            <div className="space-y-3">
              {getMonthlyAnalytics().weeklyData.map((week, index) => {
                const maxRevenue = Math.max(...getMonthlyAnalytics().weeklyData.map(w => w.revenue))
                const barWidth = maxRevenue > 0 ? (week.revenue / maxRevenue) * 100 : 0
                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-16 text-sm text-gray-600 font-medium">
                      {week.label}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-500 h-8 rounded-full flex items-center justify-end pr-3"
                        style={{ width: `${barWidth}%` }}
                      >
                        {week.revenue > 0 && (
                          <span className="text-white text-sm font-medium">
                            R{week.revenue.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-20 text-sm text-gray-600 text-right">
                      {week.orders} orders
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Customer Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 text-xl">
              👥
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Customer Analytics</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">New Customers</p>
                  <p className="text-2xl font-bold text-purple-700">{getCustomerAnalytics().new}</p>
                  <p className="text-purple-500 text-xs">Last 30 days</p>
                </div>
                <div className="text-2xl">🆕</div>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Returning Customers</p>
                  <p className="text-2xl font-bold text-orange-700">{getCustomerAnalytics().returning}</p>
                  <p className="text-orange-500 text-xs">Multiple orders</p>
                </div>
                <div className="text-2xl">🔄</div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Customer Loyalty</p>
                  <p className="text-2xl font-bold text-green-700">
                    {getCustomerAnalytics().total > 0 ? Math.round((getCustomerAnalytics().returning / getCustomerAnalytics().total) * 100) : 0}%
                  </p>
                  <p className="text-green-500 text-xs">Return rate</p>
                </div>
                <div className="text-2xl">❤️</div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl">
              📈
            </div>
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">Daily Revenue (Last 7 Days)</h2>
          </div>
          <div className="space-y-3">
            {dailySales.slice(0, 7).map((day, index) => {
              const maxRevenue = Math.max(...dailySales.slice(0, 7).map(d => d.totalRevenue))
              const barWidth = maxRevenue > 0 ? (day.totalRevenue / maxRevenue) * 100 : 0
              return (
                <div key={index} className="flex items-center space-x-2 sm:space-x-4">
                  <div className="w-12 sm:w-20 text-xs sm:text-sm text-gray-600 flex-shrink-0">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-5 sm:h-6 relative min-w-0">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-500 h-5 sm:h-6 rounded-full flex items-center justify-end pr-1 sm:pr-2"
                      style={{ width: `${barWidth}%` }}
                    >
                      {day.totalRevenue > 0 && (
                        <span className="text-white text-xs font-medium">
                          R{day.totalRevenue.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 sm:w-16 text-xs sm:text-sm text-gray-600 text-right flex-shrink-0">
                    {day.orderCount} orders
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-xl">
              🗑️
            </div>
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">Data Management</h2>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-800">Clear All Data</h3>
                <p className="text-red-700 text-sm">
                  This will permanently delete all orders, customers, cart items, and other data. Use this when testing or starting fresh.
                </p>
              </div>
              <button
                onClick={clearAllData}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                🗑️ Clear Everything
              </button>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 text-xl">
              📋
            </div>
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">Recent Orders</h2>
          </div>
          {orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled').length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active orders</p>
          ) : (
            <div className="space-y-4">
              {orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled').slice(0, 5).map((order) => (
                <div key={order.orderId} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                        Order #{order.orderId.slice(-6)}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    <span className="text-green-600 font-bold text-lg sm:text-xl">R{order.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-gray-600 mb-3 space-y-1">
                    <p><strong>Customer:</strong> {order.customer.name}</p>
                    <p><strong>Phone:</strong> {order.customer.phoneNumber}</p>
                    <p><strong>Type:</strong> {order.customer.deliveryType === 'delivery' ? '🚚 Delivery' : '🏃‍♂️ Pickup'}</p>
                    {order.customer.deliveryType === 'delivery' && order.customer.deliveryAddress && (
                      <p><strong>Address:</strong> {order.customer.deliveryAddress}</p>
                    )}
                    {order.customer.deliveryType === 'pickup' && (
                      <p><strong>Room:</strong> {order.customer.roomNumber}</p>
                    )}
                    <p><strong>Time:</strong> {new Date(order.timestamp).toLocaleString()}</p>
                    <p><strong>Items:</strong> {order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}</p>
                  </div>

                  {/* Simplified Order Controls */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => {
                        const phoneNumber = formatPhoneNumber(order.customer.phoneNumber)
                        window.open(`tel:${phoneNumber}`, '_self')
                      }}
                      className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 min-h-[44px]"
                    >
                      <span>📞</span>
                      <span>Call Customer</span>
                    </button>
                    
                    <button
                      onClick={() => updateOrderStatus(order.orderId, 'ready')}
                      className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2 min-h-[44px] ${
                        order.status === 'ready' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      <span>✅</span>
                      <span>Mark Ready</span>
                    </button>
                    
                    <button
                      onClick={() => updateOrderStatus(order.orderId, 'completed')}
                      className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2 min-h-[44px] ${
                        order.status === 'completed' 
                          ? 'bg-gray-600 text-white' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      <span>✔️</span>
                      <span>Complete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
