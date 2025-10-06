import React, { useState, useEffect } from 'react';
import adminApiService from '../services/adminApiService';

const Dashboard = ({ addPopup }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const result = await adminApiService.getDashboardStats();
      
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.message || 'Fehler beim Laden der Statistiken');
      }
    } catch (err) {
      setError('Verbindungsfehler beim Laden der Statistiken');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="content-section">
        <h2 className="section-title">📊 Dashboard wird geladen...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-section">
        <h2 className="section-title">❌ Fehler</h2>
        <p style={{ color: '#dc3545' }}>{error}</p>
        <button className="btn-primary" onClick={loadStats}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="content-section">
        <h2 className="section-title">📊 Dashboard - Übersicht</h2>
        
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.new_users_30_days || 0}</div>
              <div className="stat-label">Neue Benutzer (30 Tage)</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-number">{stats.orders_30_days || 0}</div>
              <div className="stat-label">Bestellungen (30 Tage)</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-number">{stats.pizzas_sold_30_days || 0}</div>
              <div className="stat-label">Verkaufte Pizzen (30 Tage)</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-number">{stats.total_active_users || 0}</div>
              <div className="stat-label">Aktive Benutzer gesamt</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-number">{stats.pending_orders || 0}</div>
              <div className="stat-label">Wartende Bestellungen</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-number">{stats.total_reviews || 0}</div>
              <div className="stat-label">Bewertungen gesamt</div>
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

export default Dashboard;