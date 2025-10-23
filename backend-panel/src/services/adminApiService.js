/**
 * ADMIN API SERVICE
 * Kommunikation zwischen Admin-Panel und Backend
 * 
 * Funktionen:
 * - Dashboard-Statistiken abrufen
 * - Benutzerverwaltung (Liste, Bearbeiten, Löschen)
 * - Bestellverwaltung (Liste, Akzeptieren, Ablehnen)
 * - Bewertungsverwaltung (Liste, Löschen)
 * 
 * Hinweis: Keine Token-Authentifizierung im Entwicklungsmodus
 */

const API_BASE_URL = 'http://10.115.2.19:8081';

class AdminApiService {

  /**
   * Gibt Standard-HTTP-Header zurück
   * @returns {object} Headers für Fetch-Requests
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Logout-Funktion
   * Schließt das Admin-Panel Fenster
   */
  logout() {
    window.close();
  }

  // ========================================================================
  // DASHBOARD STATISTICS
  // ========================================================================

  /**
   * Lädt Dashboard-Statistiken
   * Enthält: Neue Benutzer, Bestellungen, verkaufte Pizzas, etc.
   * @returns {Promise<object>} Statistik-Daten
   */
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/admin/stats`);
    return await response.json();
  }

  // ========================================================================
  // USER MANAGEMENT
  // ========================================================================

  /**
   * Lädt alle Benutzer
   * @returns {Promise<object>} Liste aller registrierten Benutzer
   */
  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/admin/users`);
    return await response.json();
  }

  /**
   * Aktualisiert Benutzerdaten
   * @param {number} userId - Benutzer-ID
   * @param {string} username - Neuer Benutzername
   * @param {string} email - Neue E-Mail-Adresse
   * @returns {Promise<object>} Erfolgs- oder Fehlermeldung
   */
  async updateUser(userId, username, email) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, email })
    });
    return await response.json();
  }

  /**
   * Löscht einen Benutzer
   * @param {number} userId - Benutzer-ID
   * @param {string} reason - Grund für die Löschung
   * @returns {Promise<object>} Erfolgs- oder Fehlermeldung
   */
  async deleteUser(userId, reason) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    return await response.json();
  }

  // ========================================================================
  // ORDER MANAGEMENT
  // ========================================================================

  /**
   * Lädt alle Bestellungen
   * @returns {Promise<object>} Liste aller Bestellungen mit Details
   */
  async getOrders() {
    const response = await fetch(`${API_BASE_URL}/admin/orders`);
    return await response.json();
  }

  /**
   * Akzeptiert eine Bestellung
   * @param {number} orderId - Bestellungs-ID
   * @returns {Promise<object>} Erfolgs- oder Fehlermeldung
   */
  async acceptOrder(orderId) {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/accept`, {
      method: 'PUT',
      headers: this.getHeaders()
    });
    return await response.json();
  }

  /**
   * Lehnt eine Bestellung ab
   * @param {number} orderId - Bestellungs-ID
   * @param {string} reason - Ablehnungsgrund
   * @returns {Promise<object>} Erfolgs- oder Fehlermeldung
   */
  async rejectOrder(orderId, reason) {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/reject`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    return await response.json();
  }

  // ========================================================================
  // REVIEW MANAGEMENT
  // ========================================================================

  /**
   * Lädt alle Bewertungen
   * @returns {Promise<object>} Liste aller Kundenbewertungen
   */
  async getReviews() {
    const response = await fetch(`${API_BASE_URL}/admin/reviews`);
    return await response.json();
  }

  /**
   * Löscht eine Bewertung
   * @param {number} reviewId - Bewertungs-ID
   * @param {string} reason - Grund für die Löschung
   * @returns {Promise<object>} Erfolgs- oder Fehlermeldung
   */
  async deleteReview(reviewId, reason) {
    const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    return await response.json();
  }

  /**
   * Lädt Admin-Aktionsprotokoll (optional)
   * @returns {Promise<object>} Liste aller Admin-Aktionen
   */
  async getAdminActions() {
    const response = await fetch(`${API_BASE_URL}/admin/actions`);
    return await response.json();
  }
}

// Exportiere Singleton-Instanz
export default new AdminApiService();