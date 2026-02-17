'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MenuItem, SideOption } from '@/types'
import { useToastContext } from '@/components/providers/ToastProvider'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { MenuCard } from '@/components/ui/MenuCard'
import { formatPrice } from '@/lib/utils'
import { MenuItemSkeleton } from '@/components/ui/LoadingSkeleton'
import { config } from '@/lib/config'
import { Icon } from '@/components/ui/IconMap'
import { isBusinessOpen, getBusinessStatus } from '@/lib/businessStatus'
import { safeJsonParse, safeJsonStringify } from '@/lib/security'
import { menuAPI } from '@/lib/javaAPI'

export default function MenuPage() {
  const toast = useToastContext()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [sideItems, setSideItems] = useState<MenuItem[]>([])
  const [isOpen, setIsOpen] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [error, setError] = useState<string>('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showSideModal, setShowSideModal] = useState<boolean>(false)
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)
  const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({})
  const [selectedMultipleSides, setSelectedMultipleSides] = useState<{ side: string, quantity: number }[]>([])
  const [showAddMoreSidesModal, setShowAddMoreSidesModal] = useState<boolean>(false)
  const [includedSidesCount, setIncludedSidesCount] = useState<number>(1) // Default: 1 side included
  const [extraSidesCost, setExtraSidesCost] = useState<number>(0)
  const [showPostAddModal, setShowPostAddModal] = useState<boolean>(false)
  const [lastAddedItem, setLastAddedItem] = useState<MenuItem | null>(null)

  // Calculate extra sides cost
  const calculateExtraSidesCost = (selectedSides: string[]) => {
    if (selectedSides.length <= includedSidesCount) return 0

    // Default side price is R10 if not found
    const extraCount = selectedSides.length - includedSidesCount
    return extraCount * 10
  }

  useEffect(() => {
    fetchData()

    // Set up interval to refresh data
    const interval = setInterval(() => {
      if (config.order.autoRefresh) {
        fetchData()
      }
    }, config.order.refreshInterval)

    return () => clearInterval(interval)
  }, [])

  // Periodically check business status
  useEffect(() => {
    const checkBusinessStatus = async () => {
      const localStatus = getBusinessStatus()
      if (!localStatus) {
        try {
          const adminStatus = await isBusinessOpen()
          if (adminStatus !== null) {
            setIsOpen(adminStatus)
          }
        } catch (e) {
          console.warn('Error checking business status:', e)
        }
      } else {
        setIsOpen(localStatus.isOpen)
      }
    }

    checkBusinessStatus()
    const statusInterval = setInterval(checkBusinessStatus, 5 * 60 * 1000)
    return () => clearInterval(statusInterval)
  }, [])

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedImage) {
        setSelectedImage(null)
      }
    }

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [selectedImage])

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      // Fetch from Java Backend
      const items = await menuAPI.getPublicItems()

      setMenuItems(items)


      // Extract sides - accept both 'side' and 'sides' (case-insensitive)
      const sides = items.filter(item => {
        const category = item.category?.toLowerCase()
        return category === 'side' || category === 'sides'
      })
      setSideItems(sides)

      setLastUpdated(new Date())

      if (isRefresh) {
        toast.success('Menu refreshed!')
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load menu data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLastRefresh(new Date())
    }
  }

  // Check if item includes sides
  const includesSides = (item: MenuItem) => {
    const name = item.name.toLowerCase()
    return name.includes('& side') || name.includes('and side')
  }

  // Check if item is combo meal
  const isComboMeal = (item: MenuItem) => {
    return item.category !== 'Sides' && item.category !== 'Drinks' && item.category !== 'Extras'
  }

  const handleAddToCart = (item: MenuItem, quantity: number = 1) => {
    // Show side selection for ALL main meals (not sides, drinks, or extras themselves)
    // This allows customers to add sides to any meal (Full Chicken, Quarter Chicken, etc.)
    const isMainMeal = item.category?.toLowerCase() === 'main'

    if (isMainMeal && availableSideNames.length > 0) {
      // Determine if this item already includes sides (mentioned in name)
      const alreadyIncludesSide = includesSides(item)
      setIncludedSidesCount(alreadyIncludesSide ? 1 : 0) // Free side if name mentions it
      setCurrentItem(item)
      setSelectedQuantity(quantity)
      setSelectedMultipleSides([])
      setExtraSidesCost(0)
      setShowSideModal(true)
    } else {
      addToCart(item, quantity)
    }
  }

  const handleSideSelection = (sideName: string) => {
    if (currentItem) {
      const existingSideIndex = selectedMultipleSides.findIndex(s => s.side === sideName)

      if (existingSideIndex >= 0) {
        const newSides = [...selectedMultipleSides]
        newSides[existingSideIndex].quantity += 1
        setSelectedMultipleSides(newSides)
      } else {
        const newSides = [...selectedMultipleSides, { side: sideName, quantity: 1 }]
        setSelectedMultipleSides(newSides)
      }

      const sideNames = selectedMultipleSides.flatMap(s => Array(s.quantity).fill(s.side))
      // Add the new one we just added/incremented to calculation?
      // Actually standard logic:
      // Rre-calculate from state (which is async) or calculate from new value.
      // Better to recalculate from derived state in render or useEffect, but here simple manual calc:
      // Construct temp array including the new change
      const allSides = [...sideNames, sideName] // Simplified logical approximation
      // Logic above in existing code was buggy potentially with async state? 
      // Re-using existing logic pattern but simplified:

      const updatedSidesList = selectedMultipleSides.map(s => s.side === sideName ? { ...s, quantity: s.quantity } : s)
      if (existingSideIndex === -1) updatedSidesList.push({ side: sideName, quantity: 1 })
      else updatedSidesList[existingSideIndex].quantity += 1 // wait, state update hasn't happened yet in this variable

      // Actually, let's just update state and calculate cost in extensive way
      // But standard way:
      const newSideList = existingSideIndex >= 0
        ? selectedMultipleSides.map((s, i) => i === existingSideIndex ? { ...s, quantity: s.quantity + 1 } : s)
        : [...selectedMultipleSides, { side: sideName, quantity: 1 }]

      const flattened = newSideList.flatMap(s => Array(s.quantity).fill(s.side))
      setExtraSidesCost(calculateExtraSidesCost(flattened))

      setShowSideModal(false)
      setShowAddMoreSidesModal(true)
    }
  }

  const handleAddMoreSides = () => {
    if (currentItem) {
      setShowAddMoreSidesModal(false)
      setShowSideModal(true)
    }
  }

  const handleFinishSides = () => {
    if (currentItem && selectedMultipleSides.length > 0) {
      const sidesText = selectedMultipleSides.map(s => `${s.quantity}x ${s.side}`).join(', ')
      addToCart(currentItem, selectedQuantity, sidesText, extraSidesCost)

      setShowAddMoreSidesModal(false)
      setCurrentItem(null)
      setSelectedQuantity(1)
      setSelectedMultipleSides([])
      setExtraSidesCost(0)
    }
  }

  const handleSkipSide = () => {
    if (currentItem) {
      // Add current item without any sides
      addToCart(currentItem, selectedQuantity)

      setShowSideModal(false)
      setCurrentItem(null)
      setSelectedQuantity(1)
      setSelectedMultipleSides([])
      setExtraSidesCost(0)
    }
  }

  const handleRemoveSide = (sideToRemove: string) => {
    const newSides = selectedMultipleSides.filter(s => s.side !== sideToRemove)
    setSelectedMultipleSides(newSides)

    const sideNames = newSides.flatMap(s => Array(s.quantity).fill(s.side))
    setExtraSidesCost(calculateExtraSidesCost(sideNames))
  }

  const handleAdjustSideQuantity = (sideName: string, change: number) => {
    const newSides = [...selectedMultipleSides]
    const sideIndex = newSides.findIndex(s => s.side === sideName)

    if (sideIndex >= 0) {
      newSides[sideIndex].quantity = Math.max(1, newSides[sideIndex].quantity + change)
      setSelectedMultipleSides(newSides)

      const sideNames = newSides.flatMap(s => Array(s.quantity).fill(s.side))
      setExtraSidesCost(calculateExtraSidesCost(sideNames))
    }
  }

  const addToCart = (item: MenuItem, quantity: number = 1, selectedSide?: string, extraCost: number = 0) => {
    try {
      if (quantity < 1 || quantity > 100) {
        toast.error('Quantity must be between 1 and 100')
        return
      }

      const existingCart = safeJsonParse<any[]>(localStorage.getItem('cart') || '[]', [])
      const basePrice = item.price
      const totalPrice = basePrice + extraCost

      const cartItem = {
        id: `${item.name}-${Date.now()}`,
        name: item.name,
        price: totalPrice.toString(),
        basePrice: item.price.toString(),
        extraSidesCost: extraCost,
        image: item.imageUrl,
        description: item.description,
        quantity: quantity,
        selectedSide: selectedSide,
        isCombo: isComboMeal(item)
      }

      const updatedCart = [...existingCart, cartItem]
      localStorage.setItem('cart', safeJsonStringify(updatedCart))

      const sideText = selectedSide ? ` with ${selectedSide}` : ''
      const quantityText = quantity > 1 ? `${quantity}x ` : ''

      // Instead of just toast, show the smart modal
      setLastAddedItem(item)
      setShowPostAddModal(true)

      // toast.success(`${quantityText}${item.name}${sideText} added to cart!`)
    } catch (err) {
      console.error('Error adding to cart:', err)
      toast.error('Failed to add item to cart')
    }
  }

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category || 'Other')))]

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Available sides for selection - ONLY from database
  const availableSideNames = sideItems.map(s => s.name)

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-6"></div>
            <p className="text-white/60 text-xl">Loading our delicious menu...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {[...Array(8)].map((_, index) => (
              <MenuItemSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center bg-neutral-900/50 backdrop-blur-sm border border-white/10 p-12 rounded-2xl shadow-2xl max-w-md mx-4">
          <p className="text-red-400 mb-6 text-lg">{error}</p>
          <button
            onClick={() => fetchData()}
            className="bg-orange-500 hover:bg-orange-600 border border-orange-400/30 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-orange-500/20"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center bg-neutral-900/50 backdrop-blur-sm border border-white/10 p-12 rounded-2xl shadow-2xl max-w-md mx-4">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-3xl font-bold text-white mb-4">
            We're closed today
          </h1>
          <p className="text-white/60 text-lg">
            See you tomorrow!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Hero Section */}
      <div className="relative bg-neutral-950 border-b border-white/10">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative container mx-auto px-4 py-16">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-12">
            <Link href="/" className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
              <Icon name="arrow-left" size={20} />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => fetchData(true)}
                isLoading={refreshing}
                variant="outline"
                size="md"
                className="border-white/20 text-white/80 hover:bg-white/10"
              >
                <Icon name="refresh" size={18} />
              </Button>
              <Link
                href="/cart"
                className="bg-orange-500 border border-orange-400/30 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Icon name="cart" size={18} />
                <span className="hidden sm:inline">Cart</span>
              </Link>
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center mb-12">
            {/* Business Status Badge */}
            <div className="inline-flex items-center px-4 py-2 backdrop-blur-sm rounded-full mb-8 border bg-green-500/10 border-green-500/30">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span className="text-sm font-medium tracking-wide text-green-400">OPEN NOW</span>
            </div>

            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-white mb-6 font-display tracking-tight">
              OUR MENU
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Flame-grilled perfection, delivered to your door
            </p>
          </div>

          {/* Search and Filter - Modern Pills */}
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Icon name="search" size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search our menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-neutral-900/50 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-lg"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all ${selectedCategory === category
                    ? 'bg-orange-500 text-white border border-orange-400/30 shadow-lg shadow-orange-500/20'
                    : 'bg-neutral-900/50 backdrop-blur-sm text-white/60 border border-white/10 hover:bg-neutral-800/50 hover:text-white'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="container mx-auto px-4 py-16">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="search" size={80} className="mx-auto mb-6 text-white/20" />
            <p className="text-white/60 text-xl mb-6">No items found matching your search.</p>
            <Button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
              }}
              variant="primary"
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {filteredItems.map((item, index) => (
              <MenuCard
                key={index}
                item={item}
                onAddToCart={() => handleAddToCart(item, itemQuantities[item.name] || 1)}
                quantity={itemQuantities[item.name] || 1}
                onQuantityChange={(qty) => setItemQuantities(prev => ({ ...prev, [item.name]: qty }))}
                showQuantityControls={!isComboMeal(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        size="xl"
      >
        {selectedImage && (
          <div className="relative max-h-[90vh] w-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Food item"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={() => toast.error('Failed to load image')}
            />
          </div>
        )}
      </Modal>

      {/* Side Selection Modal */}
      <Modal
        isOpen={showSideModal}
        onClose={() => setShowSideModal(false)}
        size="md"
        title={
          <div className="flex items-center gap-2">
            <Icon name="menu" size={24} className="text-orange-600" />
            Select Sides
          </div>
        }
      >
        {currentItem && (
          <>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                <strong>{currentItem.name}</strong> - {formatPrice(currentItem.price)}
              </p>
              {includesSides(currentItem) ? (
                <p className="text-sm text-green-600 mb-2">First side included free!</p>
              ) : (
                <p className="text-sm text-orange-600 mb-2">Sides cost extra</p>
              )}
            </div>

            {/* Selected Sides Display */}
            {selectedMultipleSides.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Selected Sides:</h4>
                <div className="space-y-2">
                  {selectedMultipleSides.map((sideItem, index) => (
                    <div key={index} className="bg-orange-50 text-orange-800 px-3 py-2 rounded-lg text-sm flex items-center justify-between">
                      <span className="font-medium">{sideItem.side}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold">x{sideItem.quantity}</span>
                        <button
                          onClick={() => handleRemoveSide(sideItem.side)}
                          className="ml-2 text-orange-600 hover:text-orange-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-6">
              {availableSideNames.map((side) => {
                const isSelected = selectedMultipleSides.some(s => s.side === side)
                return (
                  <button
                    key={side}
                    onClick={() => handleSideSelection(side)}
                    className={`p-3 border rounded-lg transition-all text-left ${isSelected
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-orange-500 hover:bg-orange-50'
                      }`}
                  >
                    <span className="font-medium">{side}</span>
                  </button>
                )
              })}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={handleSkipSide}
                className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                I don't want any sides
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Add More Sides confirmation modal omitted for brevity, logic included in side selection flow if needed, 
          but usually one modal is enough. Using simple flow here. */}

      <Modal
        isOpen={showAddMoreSidesModal}
        onClose={() => handleFinishSides()} // Closing finishes selection
        size="sm"
        title="Sides Added"
      >
        <div className="text-center">
          <p className="mb-4">Do you want to add more sides?</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleAddMoreSides} variant="outline">Add More</Button>
            <Button onClick={handleFinishSides} variant="primary">Done</Button>
          </div>
        </div>
      </Modal>

      {/* Post-Add Smart Modal (Upsell & Navigation) */}
      <Modal
        isOpen={showPostAddModal}
        onClose={() => setShowPostAddModal(false)}
        size="md"
        title="Added to Cart!"
      >
        <div className="text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Icon name="check" size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Good Choice!</h3>
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">{lastAddedItem?.name}</span> has been added to your order.
            </p>
          </div>

          {/* Smart Upsell: Show Drinks or Sides if they strictly ordered a main */}
          {lastAddedItem && lastAddedItem.category !== 'Drinks' && lastAddedItem.category !== 'Sides' && (
            <div className="bg-orange-50 rounded-xl p-4 mb-6 text-left">
              <h4 className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-2">
                <Icon name="star" size={16} />
                Complete your meal?
              </h4>
              <div className="space-y-3">
                {/* Suggest a random drink or side (simplified logic: take first 2 drinks/sides) */}
                {menuItems.filter(i => i.category === 'Drinks' || i.category === 'Sides').slice(0, 2).map(suggested => (
                  <div key={suggested.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-orange-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden">
                        {suggested.imageUrl ? (
                          <img src={suggested.imageUrl} alt={suggested.name} className="w-full h-full object-cover" />
                        ) : <Icon name="image" size={16} className="m-auto text-gray-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{suggested.name}</p>
                        <p className="text-xs text-gray-500">{formatPrice(suggested.price)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        addToCart(suggested, 1)
                        toast.success(`Added ${suggested.name} to cart!`)
                      }}
                      className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full font-medium hover:bg-orange-200"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link href="/cart" className="w-full">
              <Button size="lg" className="w-full">
                Proceed to Checkout
                <Icon name="arrowRight" size={18} className="ml-2" />
              </Button>
            </Link>

            <button
              onClick={() => setShowPostAddModal(false)}
              className="text-gray-500 hover:text-gray-700 font-medium text-sm py-2"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </Modal>
    </div >
  )
}
