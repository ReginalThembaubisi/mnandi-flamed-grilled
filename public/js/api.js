// API Integration Module
const API_URL = 'http://localhost:8080/api';

// API Helper Functions
const api = {
    // Menu endpoints
    async getMenu() {
        try {
            const response = await fetch(`${API_URL}/menu`);
            if (!response.ok) throw new Error('Failed to fetch menu');
            return await response.json();
        } catch (error) {
            console.error('Error fetching menu:', error);
            throw error;
        }
    },

    async getBusinessStatus() {
        try {
            const response = await fetch(`${API_URL}/menu/status`);
            if (!response.ok) throw new Error('Failed to fetch business status');
            return await response.json();
        } catch (error) {
            console.error('Error fetching business status:', error);
            throw error;
        }
    },

    async checkHealth() {
        try {
            const response = await fetch(`${API_URL}/menu/health`);
            if (!response.ok) throw new Error('Health check failed');
            return await response.json();
        } catch (error) {
            console.error('Health check error:', error);
            throw error;
        }
    },

    // Order endpoints
    async createOrder(orderData) {
        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            if (!response.ok) throw new Error('Failed to create order');
            return await response.json();
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },

    async getAllOrders() {
        try {
            const response = await fetch(`${API_URL}/orders`);
            if (!response.ok) throw new Error('Failed to fetch orders');
            return await response.json();
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },

    async getOrderByConfirmation(confirmationNumber) {
        try {
            const response = await fetch(`${API_URL}/orders/${confirmationNumber}`);
            if (!response.ok) throw new Error('Order not found');
            return await response.json();
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    },

    async updateOrderStatus(orderId, status) {
        try {
            const response = await fetch(`${API_URL}/orders/${orderId}/status?status=${status}`, {
                method: 'PATCH'
            });
            if (!response.ok) throw new Error('Failed to update order status');
            return await response.json();
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    },

    async getTodayOrders() {
        try {
            const response = await fetch(`${API_URL}/orders/today`);
            if (!response.ok) throw new Error('Failed to fetch today orders');
            return await response.json();
        } catch (error) {
            console.error('Error fetching today orders:', error);
            throw error;
        }
    },

    async getOrderStats() {
        try {
            const response = await fetch(`${API_URL}/orders/stats`);
            if (!response.ok) throw new Error('Failed to fetch order stats');
            return await response.json();
        } catch (error) {
            console.error('Error fetching order stats:', error);
            throw error;
        }
    },

    // Customer endpoints
    async getAllCustomers() {
        try {
            const response = await fetch(`${API_URL}/customers`);
            if (!response.ok) throw new Error('Failed to fetch customers');
            return await response.json();
        } catch (error) {
            console.error('Error fetching customers:', error);
            throw error;
        }
    },

    async getCustomerStats() {
        try {
            const response = await fetch(`${API_URL}/customers/stats`);
            if (!response.ok) throw new Error('Failed to fetch customer stats');
            return await response.json();
        } catch (error) {
            console.error('Error fetching customer stats:', error);
            throw error;
        }
    }
};

// Cart Management (Local Storage)
const cart = {
    get() {
        const cartData = localStorage.getItem('mnandi_cart');
        return cartData ? JSON.parse(cartData) : [];
    },

    add(item) {
        const currentCart = this.get();
        const existingItem = currentCart.find(i => i.name === item.name);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            currentCart.push({ ...item, quantity: 1 });
        }
        
        localStorage.setItem('mnandi_cart', JSON.stringify(currentCart));
        this.updateCartCount();
        return currentCart;
    },

    remove(itemName) {
        const currentCart = this.get();
        const filteredCart = currentCart.filter(i => i.name !== itemName);
        localStorage.setItem('mnandi_cart', JSON.stringify(filteredCart));
        this.updateCartCount();
        return filteredCart;
    },

    updateQuantity(itemName, quantity) {
        const currentCart = this.get();
        const item = currentCart.find(i => i.name === itemName);
        if (item) {
            item.quantity = quantity;
            if (quantity <= 0) {
                return this.remove(itemName);
            }
        }
        localStorage.setItem('mnandi_cart', JSON.stringify(currentCart));
        this.updateCartCount();
        return currentCart;
    },

    clear() {
        localStorage.removeItem('mnandi_cart');
        this.updateCartCount();
    },

    getTotal() {
        const currentCart = this.get();
        return currentCart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    getItemCount() {
        const currentCart = this.get();
        return currentCart.reduce((count, item) => count + item.quantity, 0);
    },

    updateCartCount() {
        const countElement = document.querySelector('.cart-count');
        if (countElement) {
            const count = this.getItemCount();
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'flex' : 'none';
        }
    }
};

// Utility Functions
const utils = {
    formatCurrency(amount) {
        return `R${amount.toFixed(2)}`;
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    showLoading(container) {
        container.innerHTML = '<div class="spinner"></div>';
    },

    showError(container, message) {
        container.innerHTML = `
            <div class="alert alert-error">
                <strong>Error:</strong> ${message}
            </div>
        `;
    },

    showSuccess(container, message) {
        container.innerHTML = `
            <div class="alert alert-success">
                <strong>Success:</strong> ${message}
            </div>
        `;
    }
};
