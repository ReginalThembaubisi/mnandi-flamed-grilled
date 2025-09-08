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
  status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'new' | 'ready' | 'completed'>('new')
  const router = useRouter()

  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/admin/login')
      return
    }

    try {
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]')
      // Add default status to orders that don't have one
      const ordersWithStatus = savedOrders.map((order: Order) => ({
        ...order,
        status: order.status || 'pending'
      }))
      setOrders(ordersWithStatus)
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const updatedOrders = orders.map(order => 
      order.orderId === orderId ? { ...order, status: newStatus } : order
    )
    setOrders(updatedOrders)
    localStorage.setItem('orders', JSON.stringify(updatedOrders))
  }

  const cancelOrder = (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      updateOrderStatus(orderId, 'cancelled')
    }
  }

  const sendWhatsAppNotification = (order: Order) => {
    // Format phone number (remove spaces, add country code if needed)
    let phoneNumber = order.customer.phoneNumber.replace(/\s/g, '')
    
    // Add South African country code if not present
    if (!phoneNumber.startsWith('27')) {
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '27' + phoneNumber.substring(1)
      } else {
        phoneNumber = '27' + phoneNumber
      }
    }

    // Create WhatsApp message
    const message = `🍽️ *Your Mnandi Flame-Grilled Order is Ready!*

Order #${order.orderId.slice(-6)}

📋 *Order Details:*
${order.items.map(item => `• ${item.name} x${item.quantity}`).join('\n')}

💰 *Total: R${order.total.toFixed(2)}*

📍 *Pickup Details:*
• Room: ${order.customer.roomNumber}
• Customer: ${order.customer.name}

✅ Your order is ready for pickup! Please come and collect it.

Thank you for choosing Mnandi Flame-Grilled! 🎉`

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message)
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank')
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'new') {
      // Show only active orders (pending, preparing, ready) - exclude completed and cancelled
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">📋 Orders Management</h1>
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/menu"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>🍽️</span>
              <span>Menu</span>
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('adminLoggedIn')
                localStorage.removeItem('adminLoginTime')
                router.push('/admin/login')
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Orders:</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'new', label: 'Active Orders', emoji: '🔄' },
              { key: 'ready', label: 'Ready to Deliver', emoji: '✅' },
              { key: 'completed', label: 'Completed', emoji: '🎉' }
            ].map(({ key, label, emoji }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === key
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
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No orders found</h2>
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
              <div key={order.orderId} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Order #{order.orderId.slice(-6)}
                    </h3>
                    <p className="text-gray-600">
                      {new Date(order.timestamp).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status || 'pending')}`}>
                      {getStatusEmoji(order.status || 'pending')} {order.status || 'pending'}
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      R{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">👤 Customer Details:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <p><strong>Name:</strong> {order.customer.name}</p>
                    <p><strong>Phone:</strong> {order.customer.phoneNumber}</p>
                    <p><strong>Type:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        order.customer.deliveryType === 'delivery' 
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
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                              <span className="text-sm">🍽️</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{item.name}</p>
                            {item.isCombo && item.selectedSide && (
                              <p className="text-sm text-blue-600 font-medium">
                                🍽️ Side: {item.selectedSide}
                              </p>
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateOrderStatus(order.orderId, 'preparing')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        👨‍🍳 Start Cooking
                      </button>
                      <button
                        onClick={() => cancelOrder(order.orderId)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        🚫 Cancel Order
                      </button>
                    </div>
                  )}
                  {order.status === 'preparing' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          updateOrderStatus(order.orderId, 'ready')
                          sendWhatsAppNotification(order)
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        ✅ Ready & Notify Customer
                      </button>
                      <button
                        onClick={() => cancelOrder(order.orderId)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        🚫 Cancel Order
                      </button>
                    </div>
                  )}
                  {order.status === 'ready' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateOrderStatus(order.orderId, 'completed')}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        {order.customer.deliveryType === 'delivery' ? '🚚 Mark Delivered' : '🏃‍♂️ Mark Collected'}
                      </button>
                      <button
                        onClick={() => sendWhatsAppNotification(order)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
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
    </div>
  )
}
