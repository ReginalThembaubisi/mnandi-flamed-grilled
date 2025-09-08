'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CartItem {
  id: string
  name: string
  price: string
  basePrice?: string
  extraSidesCost?: number
  image?: string
  description?: string
  quantity: number
  selectedSide?: string
  isCombo?: boolean
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCartItems()
  }, [])

  const loadCartItems = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartItems(cart)
    } catch (err) {
      console.error('Error loading cart:', err)
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = (itemId: string) => {
    try {
      const updatedCart = cartItems.filter(item => item.id !== itemId)
      setCartItems(updatedCart)
      localStorage.setItem('cart', JSON.stringify(updatedCart))
    } catch (err) {
      console.error('Error removing from cart:', err)
    }
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        removeFromCart(itemId)
        return
      }
      
      const updatedCart = cartItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
      setCartItems(updatedCart)
      localStorage.setItem('cart', JSON.stringify(updatedCart))
    } catch (err) {
      console.error('Error updating quantity:', err)
    }
  }

  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('cart')
  }

  const totalPrice = cartItems.reduce((total, item) => {
    const price = parseFloat(item.price) || 0
    const quantity = item.quantity || 1
    return total + (price * quantity)
  }, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">🛒 Your Cart</h1>
          <Link 
            href="/menu"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <span>🍽️</span>
            <span>Back to Menu</span>
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious items from our menu!</p>
            <Link 
              href="/menu"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 mb-8">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🍽️</span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                    {item.description && (
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    )}
                    {item.isCombo && item.selectedSide && (
                      <p className="text-blue-600 text-sm font-medium">
                        🍽️ Side: {item.selectedSide}
                      </p>
                    )}
                    {item.extraSidesCost && item.extraSidesCost > 0 && (
                      <p className="text-orange-600 text-sm font-medium">
                        💰 Extra sides: +R{item.extraSidesCost.toFixed(2)}
                      </p>
                    )}
                    <p className="text-green-600 font-medium">
                      R{item.price} each
                      {item.basePrice && item.extraSidesCost && item.extraSidesCost > 0 && (
                        <span className="text-gray-500 text-xs ml-2">
                          (R{item.basePrice} + R{item.extraSidesCost.toFixed(2)})
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity || 1}</span>
                      <button
                        onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        R{(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-gray-800">Total:</span>
                <span className="text-3xl font-bold text-green-600">R{totalPrice.toFixed(2)}</span>
              </div>
              
              <div className="space-y-3">
                <Link 
                  href="/checkout"
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-medium text-lg flex items-center justify-center space-x-2"
                >
                  <span>💳</span>
                  <span>Proceed to Checkout</span>
                </Link>
                
                <div className="flex space-x-3">
                  <button
                    onClick={clearCart}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clear Cart
                  </button>
                  <Link 
                    href="/menu"
                    className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors text-center"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
