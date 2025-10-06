import React, { useState, useEffect } from 'react';
import adminApiService from '../services/adminApiService';

const OrderManagement = ({ addPopup }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectModal, setRejectModal] = useState({ show: false, order: null });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const result = await adminApiService.getOrders();
      
      if (result.success) {
        setOrders(result.data);
      } else {
        setError(result.message || 'Fehler beim Laden der Bestellungen');
      }
    } catch (err) {
      setError('Verbindungsfehler beim Laden der Bestellungen');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const result = await adminApiService.acceptOrder(orderId);
      
      if (result.success) {
        addPopup('Bestellung erfolgreich akzeptiert! ✅', 'success');
        loadOrders(); // Neulade der Liste
      } else {
        addPopup(result.message || 'Fehler beim Akzeptieren der Bestellung', 'error');
      }
    } catch (err) {
      addPopup('Verbindungsfehler beim Akzeptieren der Bestellung', 'error');
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectModal.order || !rejectReason.trim()) {
      addPopup('Bitte geben Sie einen Ablehnungsgrund an.', 'warning');
      return;
    }

    try {
      const result = await adminApiService.rejectOrder(rejectModal.order.id, rejectReason);
      
      if (result.success) {
        addPopup('Bestellung erfolgreich abgelehnt! ❌', 'success');
        setRejectModal({ show: false, order: null });
        setRejectReason('');
        loadOrders(); // Neulade der Liste
      } else {
        addPopup(result.message || 'Fehler beim Ablehnen der Bestellung', 'error');
      }
    } catch (err) {
      addPopup('Verbindungsfehler beim Ablehnen der Bestellung', 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      accepted: 'status-accepted',
      preparing: 'status-accepted',
      ready: 'status-accepted',
      delivered: 'status-delivered',
      rejected: 'status-rejected'
    };

    const statusLabels = {
      pending: 'Wartend',
      accepted: 'Akzeptiert',
      preparing: 'In Vorbereitung',
      ready: 'Bereit',
      delivered: 'Geliefert',
      rejected: 'Abgelehnt'
    };

    return (
      <span className={`status-badge ${statusClasses[status] || 'status-pending'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="content-section">
        <h2 className="section-title">📦 Bestellverwaltung wird geladen...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-section">
        <h2 className="section-title">❌ Fehler</h2>
        <p style={{ color: '#dc3545' }}>{error}</p>
        <button className="btn-primary" onClick={loadOrders}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="content-section">
        <h2 className="section-title">📦 Bestellverwaltung</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Verwalten Sie alle Bestellungen. Akzeptieren oder lehnen Sie Bestellungen ab.
        </p>

        {orders.length === 0 ? (
          <p>Keine Bestellungen gefunden.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Bestell-ID</th>
                <th>Kunde</th>
                <th>Gesamtpreis</th>
                <th>Status</th>
                <th>Bestelldatum</th>
                <th>Lieferadresse</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer_username || 'Unbekannt'}</td>
                  <td>€{parseFloat(order.total_price).toFixed(2)}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>{formatDate(order.order_date)}</td>
                  <td style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
                    {order.delivery_address}
                  </td>
                  <td>
                    {order.status === 'pending' && (
                      <>
                        <button 
                          className="action-btn btn-accept"
                          onClick={() => handleAcceptOrder(order.id)}
                        >
                          ✅ Akzeptieren
                        </button>
                        <button 
                          className="action-btn btn-reject"
                          onClick={() => setRejectModal({ show: true, order })}
                        >
                          ❌ Ablehnen
                        </button>
                      </>
                    )}
                    {order.status === 'rejected' && order.rejection_reason && (
                      <span style={{ fontSize: '0.8rem', color: '#666' }}>
                        Grund: {order.rejection_reason}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Bestellung ablehnen</h3>
            <p>
              Möchten Sie die Bestellung <strong>#{rejectModal.order?.id}</strong> wirklich ablehnen?
            </p>
            
            <div className="form-group">
              <label className="form-label">Ablehnungsgrund:</label>
              <textarea
                className="form-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Geben Sie einen Grund für die Ablehnung an (erforderlich)..."
                required
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setRejectModal({ show: false, order: null });
                  setRejectReason('');
                }}
              >
                Abbrechen
              </button>
              <button 
                className="btn-reject"
                onClick={handleRejectOrder}
                disabled={!rejectReason.trim()}
              >
                Bestellung ablehnen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;