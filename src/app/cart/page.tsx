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
      <div className="min-h-screen bg-neutral-950">
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
    <div className="min-h-screen bg-neutral-950">
      {/* Hero Header */}
      <div className="relative bg-neutral-950 border-b border-white/10">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative container mx-auto px-4 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <Link href="/menu" className="text-white/60 hover:text-white transition-colors flex items-center gap-2 mb-4">
                <Icon name="arrow-left" size={20} />
                <span>Back to Menu</span>
              </Link>
              <h1 className="text-5xl sm:text-6xl font-bold text-white font-display tracking-tight">
                YOUR CART
              </h1>
              <p className="text-white/60 mt-3">Review your order before checkout</p>
            </div>
            {cartItems.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 px-6 py-4 rounded-2xl backdrop-blur-sm">
                <div className="text-white/60 text-sm mb-1">Total Items</div>
                <div className="text-3xl font-bold text-orange-500">
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
            className="max-w-md mx-auto text-center bg-neutral-900/50 backdrop-blur-sm border border-white/10 p-12 rounded-2xl shadow-2xl"
          >
            <Icon name="cart" size={80} className="mx-auto mb-6 text-white/20" />
            <h2 className="text-3xl font-bold text-white mb-4">Your cart is empty</h2>
            <p className="text-white/60 mb-8 text-lg">Add some delicious items from our menu!</p>
            <Link
              href="/menu"
              className="inline-block bg-orange-500 hover:bg-orange-600 border border-orange-400/30 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg shadow-orange-500/20"
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
                  className="bg-neutral-900/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-6 hover:border-orange-500/30 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl mx-auto sm:mx-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-neutral-800 rounded-xl flex items-center justify-center mx-auto sm:mx-0">
                          <Icon name="menu" size={40} className="text-neutral-600" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                      {item.description && (
                        <p className="text-white/60 text-sm mb-3 line-clamp-2">{item.description}</p>
                      )}
                      {item.isCombo && item.selectedSide && (
                        <div className="flex items-center gap-2 text-sm text-orange-400 mb-2">
                          <Icon name="check" size={16} />
                          <span>Side: {item.selectedSide}</span>
                        </div>
                      )}
                      {item.extraSidesCost && item.extraSidesCost > 0 && (
                        <div className="flex items-center gap-2 text-sm text-orange-400 mb-2">
                          <Icon name="add" size={16} />
                          <span>Extra sides: +{formatPrice(item.extraSidesCost)}</span>
                        </div>
                      )}
                      <div className="text-orange-500 font-bold text-lg mb-4">
                        {formatPrice(item.price)} each
                        {item.basePrice && item.extraSidesCost && item.extraSidesCost > 0 && (
                          <span className="text-white/40 text-sm ml-2">
                            ({formatPrice(item.basePrice)} + {formatPrice(item.extraSidesCost)})
                          </span>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-neutral-800/50 backdrop-blur-sm border border-white/10 rounded-full px-2 py-1">
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                            className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Icon name="remove" size={20} />
                          </button>
                          <span className="w-12 text-center font-bold text-white text-lg">{item.quantity || 1}</span>
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                            className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
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
                            className="text-red-400 hover:text-red-300 font-medium text-sm flex items-center gap-1"
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
              <div className="sticky top-8 bg-neutral-900/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>

                <div className="border-t border-white/10 pt-6 mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60">Subtotal</span>
                    <span className="text-white font-semibold">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-white/60 text-sm">Delivery</span>
                    <span className="text-green-400 text-sm font-semibold">Free</span>
                  </div>
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-white">Total</span>
                      <span className="text-3xl font-bold text-orange-500">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Link
                    href="/checkout"
                    className="w-full bg-orange-500 hover:bg-orange-600 border border-orange-400/30 text-white py-4 rounded-full font-bold transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                  >
                    <Icon name="payment" size={20} />
                    <span>Proceed to Checkout</span>
                  </Link>

                  <Link
                    href="/menu"
                    className="w-full bg-neutral-800/50 hover:bg-neutral-800 border border-white/10 text-white py-4 rounded-full font-semibold transition-all text-center flex items-center justify-center gap-2"
                  >
                    <Icon name="menu" size={20} />
                    <span>Continue Shopping</span>
                  </Link>

                  <button
                    onClick={clearCart}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-4 rounded-full font-semibold transition-all flex items-center justify-center gap-2"
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
