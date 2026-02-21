'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/IconMap'
import { motion } from 'framer-motion'
import { getBusinessStatus, isBusinessOpen } from '@/lib/businessStatus'

// Icon Components
const MenuIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const OrdersIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)

export default function Home() {
  const [isOpen, setIsOpen] = useState<boolean>(true)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await isBusinessOpen()
        if (status !== null) {
          setIsOpen(status)
        }
      } catch (error) {
        console.error('Failed to fetch business status:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const cards = [
    {
      icon: 'menu' as const,
      title: 'Browse Menu',
      description: 'Explore our flame-grilled specials',
      href: '/menu',
      IconComponent: MenuIcon,
    },
    {
      icon: 'orders' as const,
      title: 'Manage Orders',
      description: 'Admin dashboard',
      href: '/admin/login',
      IconComponent: OrdersIcon,
    },
  ]

  return (
    <main className="min-h-screen bg-orange-50">
      {/* Hero Section - Light & Warm */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with light overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-chicken.png"
            alt="Flame Grilled Chicken"
            className="w-full h-full object-cover opacity-30"
          />
          {/* Warm light gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-orange-50/90 via-orange-50/70 to-orange-50"></div>
        </div>

        {/* Subtle warm dot pattern */}
        <div className="absolute inset-0 opacity-[0.06] z-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(180 60 0) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative container mx-auto px-4 py-20 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`inline-flex items-center px-4 py-2 rounded-full mb-12 border-2 ${isInitializing
                ? 'bg-gray-100 border-gray-300 text-gray-500'
                : isOpen
                  ? 'bg-green-100 border-green-400 text-green-700'
                  : 'bg-red-100 border-red-400 text-red-700'
                }`}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${isInitializing ? 'bg-gray-400 animate-pulse' : isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm font-semibold tracking-wide">
                {isInitializing ? 'CHECKING STATUS...' : isOpen ? 'OPEN NOW' : 'CLOSED'}
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-orange-600 mb-6 font-display leading-none tracking-tight"
            >
              MNANDI
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl sm:text-3xl md:text-4xl text-gray-700 mb-8 font-medium tracking-wider"
            >
              FLAME-GRILLED PERFECTION
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-lg sm:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Skip the WhatsApp hassle. Order premium chicken with just a few clicks.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Link
                href="/menu"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-12 py-5 rounded-full transition-all duration-300 text-lg tracking-wide shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:scale-105"
              >
                VIEW MENU
              </Link>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-20"
            >
              <div className="inline-flex flex-col items-center text-orange-400">
                <span className="text-xs tracking-widest mb-2">SCROLL</span>
                <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-white py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4 font-display tracking-tight">
              Quick Actions
            </h2>
            <div className="w-20 h-1 bg-orange-500 mx-auto mt-6"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {cards.map((card, index) => (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <Link href={card.href} className="block group">
                  <div className="bg-orange-50 hover:bg-orange-500 p-10 transition-all duration-500 h-full border-2 border-orange-100 hover:border-orange-500 rounded-2xl shadow-sm hover:shadow-xl">
                    {/* Icon */}
                    <div className="w-16 h-16 mb-8 text-orange-500 group-hover:text-white group-hover:scale-110 transition-all duration-500">
                      <card.IconComponent />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-white mb-4 font-display tracking-tight transition-colors duration-500">
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 group-hover:text-white/80 mb-6 transition-colors duration-500">
                      {card.description}
                    </p>

                    {/* Arrow */}
                    <div className="flex items-center text-orange-500 group-hover:text-white font-semibold uppercase text-sm tracking-wider group-hover:translate-x-2 transition-all duration-500">
                      <span>Explore</span>
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features - Light warm */}
      <div className="bg-orange-50 py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16 max-w-5xl mx-auto">
            {[
              {
                title: 'Fast',
                desc: 'Quick service',
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              {
                title: 'Fresh',
                desc: 'Always hot',
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                )
              },
              {
                title: 'Easy',
                desc: 'Simple ordering',
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                title: 'Quality',
                desc: 'Premium food',
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                )
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 text-orange-500 bg-white rounded-2xl p-3 shadow-md">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-white py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center px-4"
        >
          <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 font-display tracking-tight">
            Ready to Order?
          </h2>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
            Experience the finest flame-grilled chicken
          </p>
          <Link
            href="/menu"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-12 py-5 rounded-full transition-all duration-300 text-lg tracking-wide shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:scale-105"
          >
            BROWSE MENU
          </Link>
        </motion.div>
      </div>
    </main>
  )
}
