'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CartItem } from '@/types'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/IconMap'
import { formatPrice, calculateCartTotal } from '@/lib/utils'
import { CartItemSkeleton } from '@/components/ui/LoadingSkeleton'
import { safeJsonParse, safeJsonStringify } from '@/lib/security'
import { motion } from 'framer-motion'

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
      <div className="min-h-screen bg-orange-50">
        <div className="container mx-auto px-4 py-16">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <CartItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Hero Header */}
      <div className="relative bg-white border-b border-orange-100 shadow-sm">
        {/* Subtle warm pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(180 60 0) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative container mx-auto px-4 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <Link href="/menu" className="text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-2 mb-4 font-medium">
                <Icon name="arrow-left" size={20} />
                <span>Back to Menu</span>
              </Link>
              <h1 className="text-5xl sm:text-6xl font-bold text-orange-600 font-display tracking-tight">
                YOUR CART
              </h1>
              <p className="text-gray-500 mt-3">Review your order before checkout</p>
            </div>
            {cartItems.length > 0 && (
              <div className="bg-orange-100 border-2 border-orange-300 px-6 py-4 rounded-2xl">
                <div className="text-gray-500 text-sm mb-1">Total Items</div>
                <div className="text-3xl font-bold text-orange-600">
                  {cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center bg-white border border-orange-100 p-12 rounded-2xl shadow-lg"
          >
            <Icon name="cart" size={80} className="mx-auto mb-6 text-gray-200" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-8 text-lg">Add some delicious items from our menu!</p>
            <Link
              href="/menu"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg shadow-orange-200 hover:scale-105"
            >
              Browse Menu
            </Link>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-orange-100 rounded-2xl shadow-sm p-6 hover:shadow-md hover:border-orange-300 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl mx-auto sm:mx-0"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-orange-50 rounded-xl flex items-center justify-center mx-auto sm:mx-0">
                          <Icon name="menu" size={40} className="text-orange-200" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                      {item.description && (
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{item.description}</p>
                      )}
                      {item.isCombo && item.selectedSide && (
                        <div className="flex items-center gap-2 text-sm text-orange-600 mb-2 font-medium">
                          <Icon name="check" size={16} />
                          <span>Side: {item.selectedSide}</span>
                        </div>
                      )}
                      {item.extraSidesCost && item.extraSidesCost > 0 && (
                        <div className="flex items-center gap-2 text-sm text-orange-500 mb-2">
                          <Icon name="add" size={16} />
                          <span>Extra sides: +{formatPrice(item.extraSidesCost)}</span>
                        </div>
                      )}
                      <div className="text-orange-500 font-bold text-lg mb-4">
                        {formatPrice(item.price)} each
                        {item.basePrice && item.extraSidesCost && item.extraSidesCost > 0 && (
                          <span className="text-gray-400 text-sm ml-2">
                            ({formatPrice(item.basePrice)} + {formatPrice(item.extraSidesCost)})
                          </span>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-full px-2 py-1">
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                            className="w-10 h-10 hover:bg-orange-100 rounded-full flex items-center justify-center text-gray-500 hover:text-orange-600 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Icon name="remove" size={20} />
                          </button>
                          <span className="w-12 text-center font-bold text-gray-900 text-lg">{item.quantity || 1}</span>
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                            className="w-10 h-10 hover:bg-orange-100 rounded-full flex items-center justify-center text-gray-500 hover:text-orange-600 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Icon name="add" size={20} />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-500 mb-1">
                            {formatPrice(parseFloat(item.price) * (item.quantity || 1))}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1"
                            aria-label="Remove item from cart"
                          >
                            <Icon name="delete" size={16} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 bg-white border border-orange-100 rounded-2xl shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

                <div className="border-t border-gray-100 pt-6 mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900 font-semibold">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-gray-500 text-sm">Delivery</span>
                    <span className="text-green-600 text-sm font-semibold">Free</span>
                  </div>
                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">Total</span>
                      <span className="text-3xl font-bold text-orange-500">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Link
                    href="/checkout"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-full font-bold transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:scale-105"
                  >
                    <Icon name="payment" size={20} />
                    <span>Proceed to Checkout</span>
                  </Link>

                  <Link
                    href="/menu"
                    className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 py-4 rounded-full font-semibold transition-all text-center flex items-center justify-center gap-2"
                  >
                    <Icon name="menu" size={20} />
                    <span>Continue Shopping</span>
                  </Link>

                  <button
                    onClick={clearCart}
                    className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 py-4 rounded-full font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Icon name="delete" size={20} />
                    <span>Clear Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
