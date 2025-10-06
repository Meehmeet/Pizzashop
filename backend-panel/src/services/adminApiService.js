// ===== ADMIN API SERVICE =====
// Kommunikation mit dem Backend für Admin-Funktionen

const API_BASE_URL = 'http://localhost:3001';

class AdminApiService {

  // Einfache Header - kein Token nötig
  getHeaders() {
    return {
      'Content-Type': 'application/json'
    };
  }

  // ===== LOGOUT =====
  logout() {
    window.close();
  }

  // ===== DASHBOARD STATISTICS =====
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/admin/stats`);
    return await response.json();
  }

  // ===== USER MANAGEMENT =====
  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/admin/users`);
    return await response.json();
  }

  async deleteUser(userId, reason) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    return await response.json();
  }

  // ===== ORDER MANAGEMENT =====
  async getOrders() {
    const response = await fetch(`${API_BASE_URL}/admin/orders`);
    return await response.json();
  }

  async acceptOrder(orderId) {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/accept`, {
      method: 'PUT',
      headers: this.getHeaders()
    });
    return await response.json();
  }

  async rejectOrder(orderId, reason) {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/reject`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    return await response.json();
  }

  // ===== REVIEW MANAGEMENT =====
  async getReviews() {
    const response = await fetch(`${API_BASE_URL}/admin/reviews`);
    return await response.json();
  }

  async deleteReview(reviewId, reason) {
    const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    return await response.json();
  }

  // ===== ADMIN ACTIONS LOG =====
  async getAdminActions() {
    const response = await fetch(`${API_BASE_URL}/admin/actions`);
    return await response.json();
  }
}

export default new AdminApiService();