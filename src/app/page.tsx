'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/IconMap'
import { motion } from 'framer-motion'

export default function Home() {
  const cards = [
    {
      icon: 'menu' as const,
      title: 'Browse Menu',
      description: 'Check out our delicious menu items with real-time updates from Google Sheets',
      href: '/menu',
      color: 'bg-primary-600 hover:bg-primary-700',
    },
    {
      icon: 'orders' as const,
      title: 'Manage Orders',
      description: 'View and manage all customer orders with customer details',
      href: '/admin/login',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      icon: 'search' as const,
      title: 'Track Order',
      description: 'Check your order status with your confirmation number',
      href: '/track-order',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 font-display px-2">
            Welcome to Mnandi Flame-Grilled
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 px-4">
            Delicious food, easy ordering, no WhatsApp hassle!
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {cards.map((card, index) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center hover:shadow-2xl transition-all duration-300"
            >
              <div className="mb-4 sm:mb-6 flex justify-center">
                <div className="rounded-full bg-primary-100 p-3 sm:p-4">
                  <Icon name={card.icon} size={32} className="sm:w-10 sm:h-10 text-primary-600" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 font-display">{card.title}</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                {card.description}
              </p>
              <Link 
                href={card.href}
                className={`${card.color} text-white px-6 py-3 rounded-lg transition-colors inline-block font-semibold text-sm sm:text-base min-h-[44px] flex items-center justify-center`}
              >
                {card.title === 'Browse Menu' ? 'View Menu' : card.title}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  )
}
