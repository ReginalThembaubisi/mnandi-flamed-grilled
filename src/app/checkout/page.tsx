'use client'

import { useState, useEffect } from 'react'
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
  deliveryType: 'pickup' | 'delivery'
  deliveryAddress?: string
  instructions?: string
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    roomNumber: '',
    phoneNumber: '',
    deliveryType: 'pickup',
    deliveryAddress: '',
    instructions: ''
  })
  const [loading, setLoading] = useState(true)
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartItems(cart)
      
      // Load saved customer info if available
      const savedInfo = localStorage.getItem('customerInfo')
      if (savedInfo) {
        setCustomerInfo(JSON.parse(savedInfo))
      }
    } catch (err) {
      console.error('Error loading cart:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const subtotal = cartItems.reduce((total, item) => {
    const price = parseFloat(item.price) || 0
    return total + (price * item.quantity)
  }, 0)
  
  const deliveryFee = customerInfo.deliveryType === 'delivery' ? 10 : 0
  const totalPrice = subtotal + deliveryFee

  const handleSubmitOrder = () => {
    // Save customer info for future orders
    localStorage.setItem('customerInfo', JSON.stringify(customerInfo))
    
    // Generate a better order confirmation number
    const newOrderNumber = `SHI-${Date.now().toString().slice(-6)}`
    setOrderNumber(newOrderNumber)
    
    // Create order summary
    const orderSummary = {
      customer: customerInfo,
      items: cartItems,
      total: totalPrice,
      timestamp: new Date().toISOString(),
      orderId: newOrderNumber,
      confirmationNumber: newOrderNumber,
      status: 'pending'
    }
    
    // Save order to localStorage (in real app, this would go to a database)
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
    existingOrders.push(orderSummary)
    localStorage.setItem('orders', JSON.stringify(existingOrders))
    
    // Clear cart
    localStorage.removeItem('cart')
    
    setOrderSubmitted(true)
  }

  const isFormValid = customerInfo.name.trim() && 
                     customerInfo.roomNumber.trim() && 
                     customerInfo.phoneNumber.trim()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (cartItems.length === 0 && !orderSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious items to your cart first!</p>
            <Link 
              href="/menu"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>🍽️</span>
              <span>Browse Menu</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Order Confirmed!</h1>
              <p className="text-gray-600 mb-6">
                Thank you, <strong>{customerInfo.name}</strong>! Your order has been received.
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">📋 Order Confirmation Number:</h3>
                <p className="text-2xl font-bold text-blue-900">
                  {JSON.parse(localStorage.getItem('orders') || '[]').slice(-1)[0]?.confirmationNumber || 'SHI-000000'}
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Save this number! You'll need it to track your order.
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">Order Details:</h3>
                <p className="text-green-700">
                  <strong>Room:</strong> {customerInfo.roomNumber}<br/>
                  <strong>Phone:</strong> {customerInfo.phoneNumber}<br/>
                  <strong>Type:</strong> {customerInfo.deliveryType === 'delivery' ? '🚚 Delivery' : '🏃‍♂️ Pickup'}<br/>
                  {customerInfo.instructions && (
                    <>
                      <strong>Instructions:</strong> {customerInfo.instructions}<br/>
                    </>
                  )}
                  <strong>Total:</strong> R{totalPrice.toFixed(2)}
                </p>
              </div>
              
              <p className="text-gray-600 mb-6">
                We'll prepare your order and contact you when it's ready for {customerInfo.deliveryType === 'delivery' ? 'delivery' : 'pickup'}!
              </p>
              
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-orange-800 mb-2">🚫 Need to Cancel?</h4>
                <p className="text-sm text-orange-700">
                  You can cancel your order anytime before we start cooking. Go to the <strong>"Track Order"</strong> page and enter your confirmation number: <strong>{orderNumber}</strong>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/menu"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center justify-center space-x-2"
                >
                  <span>🍽️</span>
                  <span>Order More</span>
                </Link>
                <Link 
                  href="/"
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center justify-center space-x-2"
                >
                  <span>🏠</span>
                  <span>Home</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">📋 Checkout</h1>
            <Link 
              href="/cart"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <span>←</span>
              <span>Back to Cart</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Customer Information Form */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">👤 Customer Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Themba Ubisi"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.roomNumber}
                    onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                    placeholder="e.g., F09-7"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="e.g., 082 123 4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Delivery Options */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🚚 Delivery Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="radio"
                      id="pickup"
                      name="deliveryType"
                      value="pickup"
                      checked={customerInfo.deliveryType === 'pickup'}
                      onChange={(e) => handleInputChange('deliveryType', e.target.value as 'pickup' | 'delivery')}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="pickup" className="flex items-center space-x-2 text-gray-700">
                      <span>🏃‍♂️</span>
                      <span>Pickup (Free)</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <input
                      type="radio"
                      id="delivery"
                      name="deliveryType"
                      value="delivery"
                      checked={customerInfo.deliveryType === 'delivery'}
                      onChange={(e) => handleInputChange('deliveryType', e.target.value as 'pickup' | 'delivery')}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="delivery" className="flex items-center space-x-2 text-gray-700">
                      <span>🚚</span>
                      <span>Delivery (R10 delivery fee)</span>
                    </label>
                  </div>
                </div>

                {/* Delivery Address */}
                {customerInfo.deliveryType === 'delivery' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <textarea
                      value={customerInfo.deliveryAddress || ''}
                      onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                      placeholder="e.g., Inyatsi Building, F09-7"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-20 resize-none"
                      required={customerInfo.deliveryType === 'delivery'}
                    />
                  </div>
                )}

                {/* Order Instructions */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Special Instructions (Optional)
                  </label>
                  <textarea
                    value={customerInfo.instructions || ''}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    placeholder="How do you want your meat? (e.g., 'Normal', 'Mild', 'Hot', 'Extra hot', 'Call when ready')"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-20 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll do our best to accommodate your requests!
                  </p>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Note:</strong> This information will be saved for future orders to make checkout faster!
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">🚫 Cancellation Policy</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• You can cancel your order before we start cooking</li>
                    <li>• Use the "Track Order" page to cancel anytime</li>
                    <li>• Once cooking starts, cancellation is not possible</li>
                    <li>• We'll contact you if there are any issues</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">📋 Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🍽️</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      {item.isCombo && item.selectedSide && (
                        <p className="text-sm text-blue-600 font-medium">
                          🍽️ Side: {item.selectedSide}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        R{(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span>Subtotal:</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Delivery Fee:</span>
                    <span>R{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xl font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">R{totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <button
                onClick={handleSubmitOrder}
                disabled={!isFormValid}
                className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
              >
                {isFormValid ? '✅ Place Order' : '❌ Complete Form First'}
              </button>
              
              {!isFormValid && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  Please fill in all required fields
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
