'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  const [businessStatus, setBusinessStatus] = useState<{isOpen: boolean, message?: string}>({isOpen: true})
  const [newOrderNotification, setNewOrderNotification] = useState<Order | null>(null)
  const [lastOrderCount, setLastOrderCount] = useState(0)
  const [lastOrderIds, setLastOrderIds] = useState<string[]>([])
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/admin/login')
      return
    }

    loadData()
    loadBusinessStatus()

    // Initialize order tracking
    const storedOrders = localStorage.getItem('orders')
    if (storedOrders) {
      const currentOrders: Order[] = JSON.parse(storedOrders)
      setLastOrderCount(currentOrders.length)
      setLastOrderIds(currentOrders.map(order => order.orderId))
    }

    // Set up real-time order monitoring
    const orderInterval = setInterval(() => {
      checkForNewOrders()
    }, 5000) // Check every 5 seconds

    return () => clearInterval(orderInterval)
  }, [router])

  // Real-time order monitoring
  const checkForNewOrders = () => {
    const storedOrders = localStorage.getItem('orders')
    if (storedOrders) {
      const currentOrders: Order[] = JSON.parse(storedOrders)
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

  // Load business status from localStorage
  const loadBusinessStatus = () => {
    const status = localStorage.getItem('businessStatus')
    if (status) {
      setBusinessStatus(JSON.parse(status))
    }
  }

  // Toggle business status
  const toggleBusinessStatus = () => {
    const newStatus = { ...businessStatus, isOpen: !businessStatus.isOpen }
    setBusinessStatus(newStatus)
    localStorage.setItem('businessStatus', JSON.stringify(newStatus))
  }

  // Update order status
  const updateOrderStatus = (orderId: string, newStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled') => {
    const updatedOrders = orders.map(order => 
      order.orderId === orderId ? { ...order, status: newStatus } : order
    )
    setOrders(updatedOrders)
    localStorage.setItem('orders', JSON.stringify(updatedOrders))
    
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

  // Format phone number for WhatsApp
  const formatPhoneNumber = (phoneNumber: string) => {
    // Clean phone number and add South African country code if missing
    let cleanNumber = phoneNumber.replace(/\D/g, '')
    
    // If number starts with 0, replace with +27 (South Africa)
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '27' + cleanNumber.substring(1)
    }
    // If number doesn't start with country code, add +27
    else if (!cleanNumber.startsWith('27')) {
      cleanNumber = '27' + cleanNumber
    }
    
    return cleanNumber
  }

  // Send WhatsApp notification
  const sendWhatsAppNotification = (order: Order) => {
    const deliveryInfo = order.customer.deliveryType === 'delivery' 
      ? `🚚 *Delivery Details:*
• Address: ${order.customer.deliveryAddress}
• Customer: ${order.customer.name}

✅ Your order is ready for delivery! We'll be coming to deliver it soon.`
      : `📍 *Pickup Details:*
• Room: ${order.customer.roomNumber}
• Customer: ${order.customer.name}

✅ Your order is ready for pickup! Please come and collect it.`

    const message = `🍽️ *Your Mnandi Flame-Grilled Order is Ready!*

📋 *Order #${order.orderId}*

📦 *Order Details:*
${order.items.map(item => `• ${item.name} x${item.quantity}`).join('\n')}

💰 *Total: R${order.total.toFixed(2)}*

${deliveryInfo}

🙏 Thank you for choosing Mnandi Flame-Grilled!`
    
    const phoneNumber = formatPhoneNumber(order.customer.phoneNumber)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    
    // Send WhatsApp notification
    
    window.open(whatsappUrl, '_blank')
  }

  const loadData = () => {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]')
      const ordersWithStatus: Order[] = savedOrders.map((order: Order) => ({
        ...order,
        status: order.status || 'pending'
      }))
      setOrders(ordersWithStatus)
      
      // Calculate daily sales
      calculateDailySales(ordersWithStatus)
      
      // Update live order count (only active orders)
      const activeOrders = ordersWithStatus.filter(order => order.status !== 'completed' && order.status !== 'cancelled')
      setLiveOrderCount(activeOrders.length)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
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
    localStorage.removeItem('adminLoggedIn')
    localStorage.removeItem('adminLoginTime')
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
    
    // Get current password from localStorage
    const storedPassword = localStorage.getItem('adminPassword')
    const currentStoredPassword = storedPassword || 'mnandi2024'
    
    // Verify current password
    if (currentPassword !== currentStoredPassword) {
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
    
    // Update password
    localStorage.setItem('adminPassword', newPassword)
    
    // Reset form
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowChangePassword(false)
    setPasswordError('')
    
    alert('Password updated successfully!')
  }

  const resetChangePassword = () => {
    setShowChangePassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const todaySales = getTodaySales()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 md:mb-0">
            👨‍🍳 Admin Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/customers"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <span>👥</span>
              <span>Customers</span>
            </Link>
            <Link 
              href="/orders"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <span>📋</span>
              <span>Orders</span>
            </Link>
            <button
              onClick={() => setShowChangePassword(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <span>🔐</span>
              <span>Change Password</span>
            </button>
            <button
              onClick={clearAllData}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
            >
              <span>🗑️</span>
              <span>Clear All Data</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

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
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-800">🏪 Business Status</h2>
              <div className={`px-4 py-2 rounded-full text-white font-semibold ${
                businessStatus.isOpen ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {businessStatus.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
              </div>
            </div>
            <button
              onClick={toggleBusinessStatus}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                businessStatus.isOpen 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {businessStatus.isOpen ? '🔴 Close Business' : '🟢 Open Business'}
            </button>
          </div>
          {businessStatus.message && (
            <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded">
              <p className="text-yellow-800">{businessStatus.message}</p>
            </div>
          )}
        </div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">🔐 Change Password</h2>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>
              
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{passwordError}</p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={resetChangePassword}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Simple Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Revenue</p>
                <p className="text-3xl font-bold text-green-600">R{todaySales.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Orders</p>
                <p className="text-3xl font-bold text-blue-600">{todaySales.orderCount}</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Customers</p>
                <p className="text-3xl font-bold text-purple-600">{getTotalCustomers()}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
        </div>

        {/* Live Order Counter & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Live Order Count</p>
                <p className="text-4xl font-bold">{liveOrderCount}</p>
                <p className="text-green-100 text-xs mt-1">Active orders</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Average Order Value</p>
                <p className="text-4xl font-bold">R{getCustomerAnalytics().averageOrderValue.toFixed(0)}</p>
                <p className="text-blue-100 text-xs mt-1">Per customer</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📅 Weekly Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📊 Monthly Performance (Last 30 Days)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">👥 Customer Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📈 Daily Revenue (Last 7 Days)</h2>
          <div className="space-y-3">
            {dailySales.slice(0, 7).map((day, index) => {
              const maxRevenue = Math.max(...dailySales.slice(0, 7).map(d => d.totalRevenue))
              const barWidth = maxRevenue > 0 ? (day.totalRevenue / maxRevenue) * 100 : 0
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-20 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${barWidth}%` }}
                    >
                      {day.totalRevenue > 0 && (
                        <span className="text-white text-xs font-medium">
                          R{day.totalRevenue.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {day.orderCount} orders
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🗑️ Data Management</h2>
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
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📋 Recent Orders</h2>
          {orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled').length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active orders</p>
          ) : (
            <div className="space-y-4">
              {orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled').slice(0, 5).map((order) => (
                <div key={order.orderId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-800">
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
                    <span className="text-green-600 font-bold">R{order.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
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
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        const phoneNumber = formatPhoneNumber(order.customer.phoneNumber)
                        window.open(`tel:${phoneNumber}`, '_self')
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <span>📞</span>
                      <span>Call Customer</span>
                    </button>
                    
                    <button
                      onClick={() => updateOrderStatus(order.orderId, 'ready')}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 ${
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
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 ${
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
    </div>
  )
}
