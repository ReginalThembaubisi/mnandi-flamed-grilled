// Java Spring Boot API Integration for Next.js Frontend
// Replaces Supabase with Spring Boot backend

export const API_BASE_URL = (typeof window !== 'undefined')
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api');

export interface Order {
    id?: number;
    confirmationNumber?: string;
    customerName: string;
    customerPhone: string;
    customerRoom: string;
    customerResidence: string;
    items: string; // JSON string of cart items
    total: number;
    status?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface OrderResponse extends Order {
    id: number;
    confirmationNumber: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

// Order API
export const orderAPI = {
    // Create a new order
    async create(orderData: Order): Promise<OrderResponse> {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            throw new Error(`Failed to create order: ${response.statusText}`);
        }

        return await response.json();
    },

    // Get all orders (admin)
    async getAll(): Promise<OrderResponse[]> {
        const response = await fetch(`${API_BASE_URL}/orders`);

        if (!response.ok) {
            throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }

        return await response.json();
    },

    // Get order by confirmation number
    async getByConfirmation(confirmationNumber: string): Promise<OrderResponse> {
        const response = await fetch(`${API_BASE_URL}/orders/${confirmationNumber}`);

        if (!response.ok) {
            throw new Error(`Order not found: ${response.statusText}`);
        }

        return await response.json();
    },

    // Update order status
    async updateStatus(orderId: number, status: string): Promise<OrderResponse> {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update order status: ${response.statusText}`);
        }

        return await response.json();
    },

    // Get today's orders
    async getToday(): Promise<OrderResponse[]> {
        const response = await fetch(`${API_BASE_URL}/orders/today`);

        if (!response.ok) {
            throw new Error(`Failed to fetch today's orders: ${response.statusText}`);
        }

        return await response.json();
    },

    // Get order statistics
    async getStats(): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/orders/stats`);

        if (!response.ok) {
            throw new Error(`Failed to fetch order stats: ${response.statusText}`);
        }

        return await response.json();
    },
    // Delete all orders
    async deleteAll(): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete orders: ${response.statusText}`);
        }
    },
};

// Customer API
export const customerAPI = {
    async getAll() {
        const response = await fetch(`${API_BASE_URL}/customers`);
        if (!response.ok) throw new Error('Failed to fetch customers');
        return await response.json();
    },

    async getByPhone(phone: string) {
        const response = await fetch(`${API_BASE_URL}/customers/phone/${phone}`);
        if (!response.ok) throw new Error('Customer not found');
        return await response.json();
    },

    async getStats() {
        const response = await fetch(`${API_BASE_URL}/customers/stats`);
        if (!response.ok) throw new Error('Failed to fetch customer stats');
        return await response.json();
    },
};

// Menu API (Database-backed)
export interface MenuItem {
    id?: number;
    name: string;
    description: string;
    price: number;
    category: string;
    available: boolean;
    imageUrl: string;
    badge?: string;
}

export const menuAPI = {
    // Get all items (for admin table)
    async getAllItems(): Promise<MenuItem[]> {
        const response = await fetch(`${API_BASE_URL}/menu`);
        if (!response.ok) throw new Error('Failed to fetch menu items');
        return await response.json();
    },

    // Get public items (available only)
    async getPublicItems(): Promise<MenuItem[]> {
        const response = await fetch(`${API_BASE_URL}/menu/public`);
        if (!response.ok) throw new Error('Failed to fetch public menu');
        return await response.json();
    },

    // Create item
    async createItem(item: MenuItem): Promise<MenuItem> {
        const response = await fetch(`${API_BASE_URL}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
        if (!response.ok) throw new Error('Failed to create menu item');
        return await response.json();
    },

    // Update item
    async updateItem(id: number, item: MenuItem): Promise<MenuItem> {
        const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
        if (!response.ok) throw new Error('Failed to update menu item');
        return await response.json();
    },

    // Delete item
    async deleteItem(id: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete menu item');
    },

    // Upload image
    async uploadImage(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/menu/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Failed to upload image');
        const data = await response.json();
        return data.url; // Returns the full URL to the uploaded image
    },

    async cleanupDuplicates(): Promise<{ message: string, deletedCount: number }> {
        const response = await fetch(`${API_BASE_URL}/menu/cleanup`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to cleanup duplicates');
        return response.json();
    },

    async healthCheck() {
        const response = await fetch(`${API_BASE_URL}/menu/health`);
        if (!response.ok) throw new Error('Backend is down');
        return await response.json();
    },
};

// Business Config API
export const configAPI = {
    // Get business status
    async getStatus() {
        const response = await fetch(`${API_BASE_URL}/config/status?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Failed to fetch business status');
        return await response.json();
    },

    // Update business status
    async updateStatus(isOpen: boolean, message: string) {
        const response = await fetch(`${API_BASE_URL}/config/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isOpen, message }),
        });

        if (!response.ok) throw new Error('Failed to update business status');
        return await response.json();
    },
};

export default {
    orders: orderAPI,
    customers: customerAPI,
    menu: menuAPI,
    config: configAPI,
};
