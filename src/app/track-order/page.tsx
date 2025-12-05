'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Order } from '@/types'
import { Button } from '@/components/ui/Button'
import { formatPrice, getStatusColor, getStatusEmoji, getStatusLabel } from '@/lib/utils'
import { sanitizeOrderNumber, validateOrderNumber, safeJsonParse, safeJsonStringify } from '@/lib/security'

export default function TrackOrderPage() {
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLookup = () => {
    if (!confirmationNumber.trim()) {
      setError('Please enter your confirmation number')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Sanitize order number
      const sanitized = sanitizeOrderNumber(confirmationNumber)
      
      if (!sanitized) {
        setError('Invalid confirmation number format')
        setLoading(false)
        return
      }

      // Validate format
      if (!validateOrderNumber(sanitized)) {
        setError('Invalid confirmation number format. Expected format: SHI-123456')
        setLoading(false)
        return
      }

      const orders = safeJsonParse<Order[]>(localStorage.getItem('orders') || '[]', [])
      const foundOrder = orders.find((o: Order) => 
        o.confirmationNumber?.toUpperCase() === sanitized || 
        o.orderId?.toUpperCase() === sanitized
      )

      if (foundOrder) {
        setOrder(foundOrder)
      } else {
        setError('Order not found. Please check your confirmation number.')
      }
    } catch (err) {
      console.error('Error looking up order:', err)
      setError('Error looking up order. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  const getStatusMessage = (status: string, deliveryType?: string) => {
    switch (status) {
      case 'pending': 
      case 'preparing': 
        return 'Your order has been received and is being prepared.'
      case 'ready': 
        return deliveryType === 'delivery' 
          ? 'Your order is ready! We\'ll deliver it to you soon.'
          : 'Your order is ready for collection! Please come and collect it.'
      case 'completed': 
        return 'Your order has been completed. Thank you!'
      case 'cancelled':
        return 'Your order has been cancelled.'
      default: 
        return 'Order status unknown.'
    }
  }

  const cancelOrder = () => {
    if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      try {
        const orders = safeJsonParse<Order[]>(localStorage.getItem('orders') || '[]', [])
        const updatedOrders = orders.map((o: Order) => 
          o.orderId === order?.orderId ? { ...o, status: 'cancelled' } : o
        )
        localStorage.setItem('orders', safeJsonStringify(updatedOrders))
        setOrder({ ...order!, status: 'cancelled' })
        alert('Order cancelled successfully!')
      } catch (err) {
        console.error('Error cancelling order:', err)
        alert('Failed to cancel order. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              🔍 Track Your Order
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Enter your confirmation number to check your order status
            </p>
          </div>

          {/* Lookup Form */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., SHI-123456"
                  value={confirmationNumber}
                  onChange={(e) => {
                    const sanitized = sanitizeOrderNumber(e.target.value)
                    setConfirmationNumber(sanitized)
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base min-h-[44px]"
                />
              </div>
              <div className="sm:pt-6 flex items-end">
                <button
                  onClick={handleLookup}
                  disabled={loading}
                  className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium min-h-[44px] min-w-[120px]"
                >
                  {loading ? 'Looking up...' : 'Track Order'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Order Details */}
          {order && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Order #{order.confirmationNumber}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status || 'pending')}`}>
                  {getStatusEmoji(order.status || 'pending')} {getStatusLabel(order.status || 'pending')}
                </span>
              </div>

              {/* Status Message */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-blue-800">
                  {getStatusMessage(order.status || 'pending', order.customer.deliveryType)}
                </p>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">👤 Customer Details:</h3>
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
                    <p><strong>Instructions:</strong> {order.customer.instructions}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">🍽️ Order Items:</h3>
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
                        {formatPrice(parseFloat(item.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">{formatPrice(order.total)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Order placed: {new Date(order.timestamp).toLocaleString()}
                </p>
                
                {/* Cancel Order Section */}
                {(order.status === 'pending' || order.status === 'preparing') && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-red-800 mb-2">🚫 Need to Cancel?</h4>
                      <p className="text-sm text-red-700 mb-3">
                        You can cancel your order before we start cooking. Once we start preparing your food, cancellation is not possible.
                      </p>
                      <Button
                        onClick={cancelOrder}
                        variant="danger"
                        size="lg"
                        className="w-full"
                      >
                        🚫 Cancel This Order
                      </Button>
                    </div>
                  </div>
                )}
                
                {order.status === 'ready' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Order Ready</h4>
                      <p className="text-sm text-yellow-700">
                        Your order is ready! Cancellation is no longer possible. Please come collect your order or wait for delivery.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
            <h3 className="font-semibold text-gray-800 mb-3">❓ Need Help?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Your confirmation number was sent to you when you placed your order</p>
              <p>• It looks like: <code className="bg-gray-100 px-1 rounded">SHI-123456</code></p>
              <p>• If you can't find it, contact us with your name and room number</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="text-center mt-8">
            <Link 
              href="/menu"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>🍽️</span>
              <span>Back to Menu</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
