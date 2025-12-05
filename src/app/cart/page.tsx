'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CartItem } from '@/types'
import { Button } from '@/components/ui/Button'
import { formatPrice, calculateCartTotal } from '@/lib/utils'
import { CartItemSkeleton } from '@/components/ui/LoadingSkeleton'
import { safeJsonParse, safeJsonStringify } from '@/lib/security'

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCartItems()
  }, [])

  const loadCartItems = () => {
    try {
      const cart = safeJsonParse<CartItem[]>(localStorage.getItem('cart') || '[]', [])
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
      localStorage.setItem('cart', safeJsonStringify(updatedCart))
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
      
      // Validate quantity (prevent DoS with extremely large numbers)
      if (newQuantity > 100) {
        alert('Maximum quantity is 100 per item')
        return
      }
      
      const updatedCart = cartItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
      setCartItems(updatedCart)
      localStorage.setItem('cart', safeJsonStringify(updatedCart))
    } catch (err) {
      console.error('Error updating quantity:', err)
    }
  }

  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('cart')
  }

  const totalPrice = calculateCartTotal(cartItems)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <CartItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">🛒 Your Cart</h1>
          <Link 
            href="/menu"
            className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto min-h-[44px]"
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
            <div className="grid gap-4 mb-6 sm:mb-8">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg mx-auto sm:mx-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
                          <span className="text-2xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">{item.name}</h3>
                      {item.description && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                      )}
                      {item.isCombo && item.selectedSide && (
                        <p className="text-blue-600 text-sm font-medium mb-1">
                          🍽️ Side: {item.selectedSide}
                        </p>
                      )}
                      {item.extraSidesCost && item.extraSidesCost > 0 && (
                        <p className="text-orange-600 text-sm font-medium mb-1">
                          💰 Extra sides: +R{item.extraSidesCost.toFixed(2)}
                        </p>
                      )}
                      <p className="text-green-600 font-medium text-sm sm:text-base mb-4">
                        {formatPrice(item.price)} each
                        {item.basePrice && item.extraSidesCost && item.extraSidesCost > 0 && (
                          <span className="text-gray-500 text-xs ml-2 block sm:inline">
                            ({formatPrice(item.basePrice)} + {formatPrice(item.extraSidesCost)})
                          </span>
                        )}
                      </p>
                      
                      {/* Mobile: Quantity and Price */}
                      <div className="flex items-center justify-between sm:hidden">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 min-h-[44px] min-w-[44px]"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-medium text-lg">{item.quantity || 1}</span>
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 min-h-[44px] min-w-[44px]"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {formatPrice(parseFloat(item.price) * (item.quantity || 1))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop: Quantity and Price */}
                    <div className="hidden sm:flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                          className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 min-h-[44px] min-w-[44px]"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity || 1}</span>
                        <button
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 min-h-[44px] min-w-[44px]"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(parseFloat(item.price) * (item.quantity || 1))}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm mt-1 min-h-[44px] px-2"
                          aria-label="Remove item from cart"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-bold text-gray-800">Total:</span>
                <span className="text-2xl sm:text-3xl font-bold text-green-600">{formatPrice(totalPrice)}</span>
              </div>
              
              <div className="space-y-3">
                <Link 
                  href="/checkout"
                  className="w-full bg-green-600 text-white py-3.5 rounded-lg hover:bg-green-700 transition-colors text-center font-medium text-base sm:text-lg flex items-center justify-center space-x-2 min-h-[44px]"
                >
                  <span>💳</span>
                  <span>Proceed to Checkout</span>
                </Link>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={clearCart}
                    variant="danger"
                    className="flex-1 min-h-[44px]"
                  >
                    Clear Cart
                  </Button>
                  <Link 
                    href="/menu"
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors text-center flex items-center justify-center min-h-[44px]"
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
