'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { safeJsonParse, sanitizeText, sanitizePhoneForWhatsApp, sanitizeMessageForWhatsApp, validateAndSanitizePhone } from '../../lib/security'
import { orderAPI } from '../../lib/javaAPI'

interface CartItem {
  id: string
  name: string
  price: string
  image?: string
  description?: string
  quantity: number
  selectedSide?: string
  isCombo?: boolean
}

interface CustomerInfo {
  name: string
  roomNumber: string
  phoneNumber: string
  deliveryType?: 'pickup' | 'delivery'
  deliveryAddress?: string
  instructions?: string
}

interface Order {
  customer: CustomerInfo
  items: CartItem[]
  total: number
  timestamp: string
  orderId: string
  backendId?: number
  status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'new' | 'ready' | 'completed'>('new')
  const router = useRouter()
  const { isAuthenticated, isChecking } = useAdminAuth()

  const mapApiOrders = (response: any[]): Order[] => {
    return response.map((r: any) => ({
      customer: {
        name: r.customerName,
        roomNumber: r.customerRoom,
        phoneNumber: r.customerPhone,
        deliveryType: (r.customerResidence && r.customerResidence !== 'Pickup' ? 'delivery' : 'pickup') as 'pickup' | 'delivery',
        deliveryAddress: r.customerResidence !== 'Pickup' ? r.customerResidence : undefined,
        instructions: r.notes,
      },
      items: safeJsonParse<CartItem[]>(r.items, []),
      total: r.total,
      timestamp: r.createdAt || new Date().toISOString(),
      orderId: r.confirmationNumber || String(r.id),
      backendId: r.id,
      status: (r.status || 'pending') as Order['status'],
    }))
  }

  const loadOrders = async () => {
    try {
      const response = await orderAPI.getAll()
      setOrders(mapApiOrders(response))
      setError(null)
    } catch (err) {
      console.error('Error loading orders from backend:', err)
      setError('Could not connect to the backend. Please check server status.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isChecking) return
    if (!isAuthenticated) return

    loadOrders()

    // Poll for new orders every 5 seconds
    const interval = setInterval(loadOrders, 5000)
    return () => clearInterval(interval)
  }, [isAuthenticated, isChecking])

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    // Optimistic update
    setOrders(prev =>
      prev.map(order => order.orderId === orderId ? { ...order, status: newStatus } : order)
    )

    const targetOrder = orders.find(o => o.orderId === orderId)
    if (targetOrder?.backendId) {
      try {
        await orderAPI.updateStatus(targetOrder.backendId, newStatus!)
      } catch (e) {
        console.error('Failed to update order status on backend:', e)
        // Revert on failure
        setOrders(prev =>
          prev.map(order => order.orderId === orderId ? { ...order, status: targetOrder.status } : order)
        )
      }
    }
  }

  const cancelOrder = (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      updateOrderStatus(orderId, 'cancelled')
    }
  }

  const sendWhatsAppNotification = (order: Order) => {
    try {
      const phoneValidation = validateAndSanitizePhone(order.customer.phoneNumber)
      if (!phoneValidation.valid) {
        alert(`Invalid phone number: ${phoneValidation.error}`)
        return
      }

      let phoneNumber = phoneValidation.sanitized
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '27' + phoneNumber.substring(1)
      } else if (!phoneNumber.startsWith('27')) {
        phoneNumber = '27' + phoneNumber
      }

      const sanitizedPhone = sanitizePhoneForWhatsApp(phoneNumber)

      const deliveryInfo = order.customer.deliveryType === 'delivery'
        ? `🚚 *Delivery Details:*\n• Address: ${sanitizeText(order.customer.deliveryAddress || '')}\n• Customer: ${sanitizeText(order.customer.name)}\n\n✅ Your order is ready for delivery! We'll be coming to deliver it soon.`
        : `📍 *Pickup Details:*\n• Room: ${sanitizeText(order.customer.roomNumber)}\n• Customer: ${sanitizeText(order.customer.name)}\n\n✅ Your order is ready for pickup! Please come and collect it.`

      const message = `🍽️ *Your Mnandi Flame-Grilled Order is Ready!*\n\nOrder #${sanitizeText(order.orderId.slice(-6))}\n\n📋 *Order Details:*\n${order.items.map(item => `• ${sanitizeText(item.name)} x${item.quantity}`).join('\n')}\n\n💰 *Total: R${order.total.toFixed(2)}*\n\n${deliveryInfo}\n\nThank you for choosing Mnandi Flame-Grilled! 🎉`

      const sanitizedMessage = sanitizeMessageForWhatsApp(message)
      const encodedMessage = encodeURIComponent(sanitizedMessage)
      const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank')
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error)
      alert('Error sending WhatsApp notification. Please check the phone number format.')
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'new') {
      return order.status === 'pending' || order.status === 'preparing' || order.status === 'ready'
    }
    return order.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'preparing': return 'bg-blue-100 text-blue-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'preparing': return '👨‍🍳'
      case 'ready': return '✅'
      case 'completed': return '🎉'
      case 'cancelled': return '🚫'
      default: return '❓'
    }
  }

  if (isChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Orders Management</h1>
          <p className="text-gray-600">Track and manage customer orders</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Filter Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Filter Orders</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'new', label: 'Active Orders', emoji: '🔄' },
              { key: 'ready', label: 'Ready to Deliver', emoji: '✅' },
              { key: 'completed', label: 'Completed', emoji: '🎉' }
            ].map(({ key, label, emoji }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2.5 rounded-lg transition-colors font-medium min-h-[44px] ${filter === key
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                <span className="mr-2">{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-600">
              {filter === 'new'
                ? "No active orders to manage."
                : filter === 'ready'
                  ? "No orders ready for delivery."
                  : "No completed orders."
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOrders.map((order) => (
              <div key={order.orderId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                      Order #{order.orderId.slice(-6)}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      {new Date(order.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(order.status || 'pending')}`}>
                      {getStatusEmoji(order.status || 'pending')} {order.status || 'pending'}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">
                      R{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">👤 Customer Details:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    <p><strong>Name:</strong> {order.customer.name}</p>
                    <p><strong>Phone:</strong> {order.customer.phoneNumber}</p>
                    <p><strong>Type:</strong>
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${order.customer.deliveryType === 'delivery'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                        }`}>
                        {order.customer.deliveryType === 'delivery' ? '🚚 Delivery' : '🏃‍♂️ Pickup'}
                      </span>
                    </p>
                    <p><strong>
                      {order.customer.deliveryType === 'delivery' ? 'Address:' : 'Room:'}
                    </strong> {
                        order.customer.deliveryType === 'delivery'
                          ? order.customer.deliveryAddress
                          : order.customer.roomNumber
                      }</p>
                    {order.customer.instructions && (
                      <p className="md:col-span-2"><strong>Instructions:</strong> {order.customer.instructions}</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">🍽️ Order Items:</h4>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-lg"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                              <span className="text-sm">🍽️</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{item.name}</p>
                            {item.isCombo && item.selectedSide && (
                              <p className="text-sm text-blue-600 font-medium">🍽️ Side: {item.selectedSide}</p>
                            )}
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-green-600">
                          R{(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {order.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => updateOrderStatus(order.orderId, 'preparing')}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px] flex-1 sm:flex-none"
                      >
                        👨‍🍳 Start Cooking
                      </button>
                      <button
                        onClick={() => cancelOrder(order.orderId)}
                        className="bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium min-h-[44px] flex-1 sm:flex-none"
                      >
                        🚫 Cancel Order
                      </button>
                    </div>
                  )}
                  {order.status === 'preparing' && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          updateOrderStatus(order.orderId, 'ready')
                          sendWhatsAppNotification(order)
                        }}
                        className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium min-h-[44px] flex-1 sm:flex-none"
                      >
                        ✅ Ready & Notify Customer
                      </button>
                      <button
                        onClick={() => cancelOrder(order.orderId)}
                        className="bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium min-h-[44px] flex-1 sm:flex-none"
                      >
                        🚫 Cancel Order
                      </button>
                    </div>
                  )}
                  {order.status === 'ready' && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => updateOrderStatus(order.orderId, 'completed')}
                        className="bg-gray-600 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium min-h-[44px] flex-1 sm:flex-none"
                      >
                        {order.customer.deliveryType === 'delivery' ? '🚚 Mark Delivered' : '🏃‍♂️ Mark Collected'}
                      </button>
                      <button
                        onClick={() => sendWhatsAppNotification(order)}
                        className="bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium min-h-[44px] flex-1 sm:flex-none"
                      >
                        📱 Send WhatsApp
                      </button>
                    </div>
                  )}
                  {order.status === 'completed' && (
                    <span className="text-gray-500 text-sm px-4 py-2">
                      ✅ {order.customer.deliveryType === 'delivery' ? 'Order delivered' : 'Order collected'}
                    </span>
                  )}
                  {order.status === 'cancelled' && (
                    <span className="text-red-500 text-sm px-4 py-2">
                      🚫 Order cancelled
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
