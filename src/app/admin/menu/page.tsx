'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { menuAPI, MenuItem } from '@/lib/javaAPI'
import { useToastContext } from '@/components/providers/ToastProvider'
import { Icon } from '@/components/ui/IconMap'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { config } from '@/lib/config'
import Papa from 'papaparse'

export default function AdminMenuPage() {
    const toast = useToastContext()
    const [items, setItems] = useState<MenuItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>({})
    const [itemToDelete, setItemToDelete] = useState<number | null>(null)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [importing, setImporting] = useState(false)

    // Category management
    const [categories, setCategories] = useState<string[]>([])
    const [newCategory, setNewCategory] = useState('')
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)

    useEffect(() => {
        loadItems()
    }, [])

    const loadItems = async () => {
        setLoading(true)
        try {
            const data = await menuAPI.getAllItems()
            setItems(data)

            const uniquePars = Array.from(new Set(data.map(i => i.category))).filter(Boolean)
            setCategories(uniquePars)
        } catch (error) {
            console.error('Failed to load menu items:', error)
            toast.error('Failed to load menu items')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (item?: MenuItem) => {
        if (item) {
            setCurrentItem({ ...item })
            setShowNewCategoryInput(false)
        } else {
            setCurrentItem({
                name: '',
                description: '',
                price: 0,
                category: categories[0] || 'Main',
                available: true,
                imageUrl: '',
                badge: ''
            })
            setShowNewCategoryInput(false)
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setCurrentItem({})
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        const file = e.target.files[0]
        setUploading(true)
        try {
            const url = await menuAPI.uploadImage(file)
            setCurrentItem(prev => ({ ...prev, imageUrl: url }))
            toast.success('Image uploaded successfully')
        } catch (error) {
            console.error('Upload failed:', error)
            toast.error('Failed to upload image')
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentItem.name || !currentItem.price || !currentItem.category) {
            toast.error('Please fill in all required fields')
            return
        }

        setSaving(true)
        try {
            const finalCategory = showNewCategoryInput && newCategory ? newCategory : currentItem.category
            const itemData = {
                ...currentItem,
                category: finalCategory,
                price: Number(currentItem.price)
            } as MenuItem

            if (currentItem.id) {
                await menuAPI.updateItem(currentItem.id, itemData)
                toast.success('Item updated successfully')
            } else {
                await menuAPI.createItem(itemData)
                toast.success('Item created successfully')
            }

            handleCloseModal()
            loadItems()
        } catch (error) {
            console.error('Save failed:', error)
            toast.error('Failed to save item')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!itemToDelete) return
        try {
            await menuAPI.deleteItem(itemToDelete)
            toast.success('Item deleted')
            loadItems()
            setIsDeleteModalOpen(false)
        } catch (error) {
            console.error('Delete failed:', error)
            toast.error('Failed to delete item')
        }
    }

    const handleImportFromSheets = async () => {
        if (!confirm('This will import items from the Google Sheet configured in settings. Existing items with the same name will be skipped. Continue?')) {
            return
        }

        setImporting(true)
        try {
            const timestamp = Date.now()
            const menuUrl = `${config.googleSheets.menuUrl}${config.googleSheets.menuUrl.includes('?') ? '&' : '?'}t=${timestamp}`
            const response = await fetch(menuUrl)
            if (!response.ok) throw new Error('Failed to fetch from Google Sheets')
            const csvText = await response.text()

            const parsed = Papa.parse(csvText, { header: true })
            if (parsed.errors.length && !parsed.data.length) throw new Error('Failed to parse CSV')

            const existingNames = new Set(items.map(i => i.name.toLowerCase()))
            let importedCount = 0

            // Process sequentially to be safe
            for (const row of parsed.data as any[]) {
                if (!row['Items'] || !row['Price']) continue

                const name = row['Items'].trim()
                if (existingNames.has(name.toLowerCase())) continue

                // Normalize Image URL
                let imageUrl = row['Image URL'] || ''
                if (imageUrl) {
                    if (imageUrl.includes('1drv.ms') && !imageUrl.includes('&download=1')) {
                        imageUrl += '&download=1'
                    }
                    if (imageUrl.includes('imgur.com/a/')) {
                        const albumId = imageUrl.match(/imgur\.com\/a\/([a-zA-Z0-9]+)/)?.[1]
                        if (albumId) imageUrl = `https://i.imgur.com/${albumId}.jpg`
                    } else if (imageUrl.includes('imgur.com/') && !imageUrl.includes('i.imgur.com')) {
                        const imageId = imageUrl.match(/imgur\.com\/([a-zA-Z0-9]+)/)?.[1]
                        if (imageId) imageUrl = `https://i.imgur.com/${imageId}.jpg`
                    }
                }

                const newItem: MenuItem = {
                    name: name,
                    price: parseFloat(row['Price']) || 0,
                    description: row['Description'] || '',
                    category: row['Category'] || 'Main',
                    available: (row['Available']?.toLowerCase() === 'true'),
                    imageUrl: imageUrl,
                    badge: '' // Default empty badge
                }

                try {
                    await menuAPI.createItem(newItem)
                    importedCount++
                } catch (e) {
                    console.error(`Failed to import ${name}:`, e)
                }
            }

            if (importedCount > 0) {
                toast.success(`Successfully imported ${importedCount} items`)
                loadItems()
            } else {
                toast.info('No new items found to import')
            }

        } catch (error) {
            console.error('Import failed:', error)
            toast.error('Failed to import from Google Sheets')
        } finally {
            setImporting(false)
        }
    }

    const handleToggleAvailability = async (item: MenuItem) => {
        try {
            const updatedItem = { ...item, available: !item.available }
            // Optimistic update
            setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i))

            await menuAPI.updateItem(item.id!, updatedItem)
            toast.success(`${item.name} is now ${updatedItem.available ? 'Available' : 'Unavailable'}`)
        } catch (error) {
            console.error('Failed to toggle availability:', error)
            toast.error('Failed to update status')
            // Revert on failure
            loadItems()
        }
    }

    const [searchTerm, setSearchTerm] = useState('')
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
                        <p className="text-gray-600">Add, edit, and manage your menu items</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleImportFromSheets}
                            variant="outline"
                            size="lg"
                            isLoading={importing}
                            disabled={importing || loading}
                        >
                            <Icon name="download" size={20} className="mr-2" />
                            Import from Sheets
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!confirm('This will remove all duplicate menu items, keeping only the most recent version of each. Continue?')) return
                                setLoading(true)
                                try {
                                    const res = await menuAPI.cleanupDuplicates()
                                    toast.success(`Cleanup complete. Removed ${res.deletedCount} duplicates.`)
                                    loadItems()
                                } catch (e) {
                                    console.error(e)
                                    toast.error('Failed to cleanup duplicates')
                                    setLoading(false)
                                }
                            }}
                            variant="danger"
                            size="lg"
                            disabled={loading}
                        >
                            <Icon name="trash" size={20} className="mr-2" />
                            Clean Duplicates
                        </Button>

                        <Button onClick={() => handleOpenModal()} variant="success" size="lg">
                            <Icon name="plus" size={20} className="mr-2" />
                            Add New Item
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="relative">
                        <Icon name="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-gray-700">Image</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700">Category</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700">Price</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                            <Icon name="image" size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 font-medium">{formatPrice(item.price)}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleAvailability(item)}
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${item.available
                                                        ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                                        }`}
                                                    title="Click to toggle availability"
                                                >
                                                    {item.available ? 'Available' : 'Unavailable'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Item"
                                                >
                                                    <Icon name="edit" size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setItemToDelete(item.id!)
                                                        setIsDeleteModalOpen(true)
                                                    }}
                                                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Item"
                                                >
                                                    <Icon name="trash" size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                No items found. Click "Add New Item" or "Import from Sheets" to populate.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentItem.id ? 'Edit Menu Item' : 'Add New Menu Item'}
                size="lg"
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                            <input
                                type="text"
                                required
                                value={currentItem.name || ''}
                                onChange={e => setCurrentItem(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Price */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (R) *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={currentItem.price || ''}
                                onChange={e => setCurrentItem(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Category */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            {!showNewCategoryInput ? (
                                <div className="flex gap-2">
                                    <select
                                        value={currentItem.category || ''}
                                        onChange={e => {
                                            if (e.target.value === 'new') {
                                                setShowNewCategoryInput(true)
                                                setNewCategory('')
                                            } else {
                                                setCurrentItem(prev => ({ ...prev, category: e.target.value }))
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="" disabled>Select Category</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="new">+ Add New Category</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCategory}
                                        onChange={e => setNewCategory(e.target.value)}
                                        placeholder="Enter new category"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewCategoryInput(false)}
                                        className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Badge */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Badge (Optional)</label>
                            <input
                                type="text"
                                value={currentItem.badge || ''}
                                onChange={e => setCurrentItem(prev => ({ ...prev, badge: e.target.value }))}
                                placeholder="e.g. New, Popular, Spicy"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Description */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                rows={3}
                                value={currentItem.description || ''}
                                onChange={e => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                            <div className="flex items-start gap-4">
                                <div className="h-24 w-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                    {currentItem.imageUrl ? (
                                        <img src={currentItem.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                                            <Icon name="image" size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-green-50 file:text-green-700
                                hover:file:bg-green-100"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Supported: JPG, PNG, WEBP</p>
                                    {uploading && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
                                </div>
                            </div>
                        </div>

                        {/* Availability */}
                        <div className="col-span-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={currentItem.available !== false}
                                    onChange={e => setCurrentItem(prev => ({ ...prev, available: e.target.checked }))}
                                    className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                                />
                                <span className="text-sm font-medium text-gray-700">Available for ordering</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                        <Button type="submit" variant="success" isLoading={saving} disabled={uploading}>
                            {currentItem.id ? 'Save Changes' : 'Create Item'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Item"
                size="sm"
            >
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                        <Icon name="trash" size={24} />
                    </div>
                    <p className="text-gray-600 mb-6">
                        Are you sure you want to delete <span className="font-bold text-gray-800">{items.find(i => i.id === itemToDelete)?.name}</span>? This action cannot be undone.
                    </p>
                    <div className="flex justify-center gap-3">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDelete}>Delete Item</Button>
                    </div>
                </div>
            </Modal>

        </AdminLayout>
    )
}
