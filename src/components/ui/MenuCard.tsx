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
  const price = item.price
  const hasImage = item.imageUrl && item.imageUrl.trim() !== ''
  const includesSides = item.name.toLowerCase().includes('& side') ||
    item.name.toLowerCase().includes('and side')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-neutral-900/50 backdrop-blur-sm border border-white/10 shadow-2xl transition-all duration-500 hover:shadow-orange-500/20 hover:border-orange-500/30"
    >
      {/* Image Container */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900">
        {hasImage ? (
          <>
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent" />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-900/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
            <ChefHat className="h-20 w-20 text-neutral-600" />
          </div>
        )}

        {/* Category Badge - Top Left */}
        {item.category && (
          <div className="absolute top-4 left-4">
            <span className="rounded-full bg-neutral-900/80 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-white/90 border border-white/10">
              {item.category}
            </span>
          </div>
        )}

        {/* Custom Badge (New, Popular, etc) - Top Right */}
        {item.badge && (
          <div className="absolute top-4 right-4">
            <span className="rounded-full bg-orange-500/90 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white border border-orange-400/30">
              {item.badge}
            </span>
          </div>
        )}

        {/* Includes Sides Badge - Below custom badge if exists */}
        {includesSides && (
          <div className={cn("absolute right-4", item.badge ? "top-14" : "top-4")}>
            <span className="rounded-full bg-green-500/90 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-white border border-green-400/30">
              Includes Sides
            </span>
          </div>
        )}

        {/* Quick Add Button - Appears on Hover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddToCart}
            className="flex items-center gap-2 rounded-full bg-orange-500 px-8 py-3 font-bold text-white shadow-2xl transition-all hover:bg-orange-600 border border-orange-400/30"
          >
            <Plus className="h-5 w-5" />
            Quick Add
          </motion.button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Title */}
        <h3 className="mb-3 text-xl font-bold text-white line-clamp-2 tracking-tight">
          {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="mb-4 line-clamp-2 text-sm text-white/60 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Price and Actions */}
        <div className="mt-auto flex items-end justify-between pt-4 border-t border-white/10">
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-orange-500 tracking-tight">
              {formatPrice(price)}
            </span>
            <div className="flex items-center gap-2 text-white/50">
              <Clock className="h-3.5 w-3.5" /> {/* Assuming Icon is a custom component or Clock is intended */}
              <span>Ready soon</span>
            </div>
          </div>

          {/* Quantity Controls or Add Button */}
          {showQuantityControls && onQuantityChange ? (
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-neutral-800/50 backdrop-blur-sm">
              <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="rounded-l-full px-4 py-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center font-bold text-white">{quantity}</span>
              <button
                onClick={() => onQuantityChange(quantity + 1)}
                className="rounded-r-full px-4 py-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                +
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddToCart}
              className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 font-bold text-white transition-all hover:bg-orange-600 border border-orange-400/30 shadow-lg shadow-orange-500/20"
            >
              <Plus className="h-5 w-5" />
              Add
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
