'use client'

import { motion } from 'framer-motion'
import { Clock, Plus, ChefHat } from 'lucide-react'
// Using regular img tag for external images
import { MenuItem } from '@/types'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/cn'

interface MenuCardProps {
  item: MenuItem
  onAddToCart: () => void
  quantity?: number
  onQuantityChange?: (quantity: number) => void
  showQuantityControls?: boolean
}

export function MenuCard({
  item,
  onAddToCart,
  quantity = 1,
  onQuantityChange,
  showQuantityControls = false
}: MenuCardProps) {
  const price = parseFloat(item['Price']) || 0
  const hasImage = item['Image URL'] && item['Image URL'].trim() !== ''
  const includesSides = item['Items'].toLowerCase().includes('& side') || 
                       item['Items'].toLowerCase().includes('and side')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-xl"
    >
      {/* Image Container */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-orange-100 to-red-100">
        {hasImage ? (
          <>
            <img
              src={item['Image URL']}
              alt={item['Items']}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <ChefHat className="h-16 w-16 text-orange-300" />
          </div>
        )}

        {/* Category Badge */}
        {item['Category'] && (
          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-orange-700 backdrop-blur-sm">
              {item['Category']}
            </span>
          </div>
        )}

        {/* Includes Sides Badge */}
        {includesSides && (
          <div className="absolute top-3 right-3">
            <span className="rounded-full bg-green-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              Includes Sides
            </span>
          </div>
        )}

        {/* Add Button - Appears on Hover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddToCart}
            className="hidden items-center gap-2 rounded-full bg-white px-6 py-2.5 font-semibold text-orange-600 shadow-lg transition-all hover:bg-orange-50 group-hover:flex"
          >
            <Plus className="h-4 w-4" />
            Add to Cart
          </motion.button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <h3 className="mb-2 text-lg font-bold text-gray-900 line-clamp-2">
          {item['Items']}
        </h3>

        {/* Description */}
        {item['Description'] && (
          <p className="mb-3 line-clamp-2 text-sm text-gray-600">
            {item['Description']}
          </p>
        )}

        {/* Price and Actions */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-orange-600">
              {formatPrice(price)}
            </span>
            {item['Category'] && (
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>Ready in 15-20 mins</span>
              </div>
            )}
          </div>

          {/* Quantity Controls or Add Button */}
          {showQuantityControls && onQuantityChange ? (
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50">
              <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="rounded-l-full px-3 py-1.5 text-gray-600 transition-colors hover:bg-gray-200"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center font-semibold">{quantity}</span>
              <button
                onClick={() => onQuantityChange(quantity + 1)}
                className="rounded-r-full px-3 py-1.5 text-gray-600 transition-colors hover:bg-gray-200"
              >
                +
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddToCart}
              className="flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              Add
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

