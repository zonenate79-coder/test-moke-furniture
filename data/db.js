// Moke Furniture - Simple Client-Side Database Engine (MokeDB)
// Provides structured collections: 'products', 'users', 'orders' with JSON export/import

const MokeDB = {
  KEYS: {
    USERS: 'moke_db_users',
    CURRENT_USER: 'moke_db_current_user',
    ORDERS: 'moke_db_orders',
    CUSTOM_PRODUCTS: 'moke_custom_products'
  },

  // Initialize database with default structure if empty
  init() {
    if (!localStorage.getItem(this.KEYS.USERS)) {
      localStorage.setItem(this.KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.KEYS.ORDERS)) {
      localStorage.setItem(this.KEYS.ORDERS, JSON.stringify([]));
    }
  },

  // --- USERS COLLECTION ---
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.USERS)) || [];
    } catch (e) {
      return [];
    }
  },

  getUserByEmail(email) {
    if (!email) return null;
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  saveUser(userData) {
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === userData.email.toLowerCase().trim());
    
    const user = {
      id: existingIndex >= 0 ? users[existingIndex].id : 'usr_' + Date.now(),
      name: userData.name || '',
      email: userData.email.toLowerCase().trim(),
      phone: userData.phone || '',
      address: userData.address || '',
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      user.createdAt = new Date().toISOString();
      users.push(user);
    }

    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(user);
    return user;
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem(this.KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.KEYS.CURRENT_USER);
    }
    window.dispatchEvent(new CustomEvent('moke_auth_changed', { detail: user }));
  },

  signOut() {
    this.setCurrentUser(null);
  },

  // --- ORDERS COLLECTION ---
  getOrders(userEmail = null) {
    try {
      const allOrders = JSON.parse(localStorage.getItem(this.KEYS.ORDERS)) || [];
      if (userEmail) {
        return allOrders.filter(o => o.customerEmail && o.customerEmail.toLowerCase() === userEmail.toLowerCase().trim());
      }
      return allOrders;
    } catch (e) {
      return [];
    }
  },

  createOrder(orderData) {
    const orders = this.getOrders();
    const newOrder = {
      id: 'ord_' + Date.now(),
      orderNumber: 'MOKE-' + Math.floor(100000 + Math.random() * 900000),
      customerName: orderData.name,
      customerEmail: orderData.email ? orderData.email.toLowerCase().trim() : '',
      customerPhone: orderData.phone,
      deliveryAddress: orderData.address,
      deliveryNotes: orderData.notes || '',
      paymentMethod: orderData.paymentMethod || 'CBE Bank',
      paymentAccount: orderData.paymentAccount || '100000838',
      paymentStatus: '100% Full Payment (Verified on Telegram)',
      receiptName: orderData.receiptName || 'Attached in Telegram',
      items: orderData.items || [],
      subtotal: orderData.subtotal,
      deliveryTier: orderData.subtotal >= 1500 ? 'Complimentary White-Glove In-Home Assembly' : 'Standard Delivery',
      createdAt: new Date().toISOString(),
      status: 'Confirmed - Preparing Delivery'
    };

    orders.unshift(newOrder); // newest first
    localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
    return newOrder;
  },

  deleteOrder(orderId) {
    let orders = this.getOrders();
    orders = orders.filter(o => o.id !== orderId);
    localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
  },

  // --- EXPORT DATABASE AS JSON ---
  exportDatabase() {
    const backup = {
      exportedAt: new Date().toISOString(),
      store: 'Moke Furniture',
      users: this.getUsers(),
      orders: this.getOrders(),
      customProducts: JSON.parse(localStorage.getItem(this.KEYS.CUSTOM_PRODUCTS) || '[]')
    };
    return JSON.stringify(backup, null, 2);
  }
};

// Auto-initialize on script load
MokeDB.init();
