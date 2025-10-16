// ═══════════════════════════════════════════════════════════════════════════
// API SERVICE
// ═══════════════════════════════════════════════════════════════════════════
// Kommunikation mit dem Backend für Kunden-Frontend
// JWT Token Management für authentifizierte Anfragen

class ApiService {
  constructor() {
    // Direkte Verbindung zum Node.js Backend (Port 3001)
    this.baseURL = 'http://localhost:3001/api';
  }

  // Token aus localStorage holen
  getToken() {
    const user = JSON.parse(localStorage.getItem('pizzashop_currentUser') || 'null');
    return user?.token || null;
  }

  // API-Call mit automatischem Token-Header
  async request(endpoint, options = {}) {
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      // Wenn Token abgelaufen ist, logout
      if (response.status === 403 && data.error?.includes('abgelaufen')) {
        this.logout();
        window.location.href = '/';
        throw new Error('Session abgelaufen. Bitte melde dich erneut an.');
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Logout - Token entfernen
  logout() {
    localStorage.removeItem('pizzashop_currentUser');
  }

  // API-Methoden
  async login(email, password) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(username, email, password) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  }

  async getOrders(userId) {
    return this.request(`/orders/${userId}`);
  }

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async cancelOrder(orderId, userId) {
    return this.request(`/orders/${orderId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ userId })
    });
  }

  async deleteOrder(orderId, userId) {
    return this.request(`/orders/${orderId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  }

  async createReview(reviewData) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  async getReviews() {
    return this.request('/reviews');
  }

  async getPizzas() {
    return this.request('/pizzas');
  }

  async getIngredients() {
    return this.request('/ingredients');
  }
}

export default new ApiService();