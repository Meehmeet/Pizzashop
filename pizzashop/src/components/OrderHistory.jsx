import { useState } from 'react';
import apiService from '../services/apiService';

const OrderHistory = ({ bestellungen, addPopup, fetchBestellungen }) => {
  const [confirmDialog, setConfirmDialog] = useState({ show: false, orderId: null });

  const canCancelOrder = (status, lieferAdresse) => {
    const isCancelled = status === 'cancelled' || lieferAdresse?.includes('[STORNIERT]');
    return !isCancelled && (status === 'pending' || status === 'preparing');
  };

  const getStatusText = (status, lieferAdresse) => {
    if (lieferAdresse?.includes('[STORNIERT]')) {
      return '❌ Storniert';
    }
    
    const statusMap = {
      'pending': '⏳ Bestätigung ausstehend',
      'preparing': '👨‍🍳 Wird zubereitet',
      'ready': '🚗 Bereit für Lieferung',
      'delivered': '✅ Geliefert',
      'cancelled': '❌ Storniert'
    };
    
    return statusMap[status] || status;
  };

  const handleCancelOrder = (orderId) => {
    setConfirmDialog({ show: true, orderId });
  };

  const confirmCancelOrder = async () => {
    const orderId = confirmDialog.orderId;
    setConfirmDialog({ show: false, orderId: null });

    try {
      const user = JSON.parse(localStorage.getItem('pizzashop_currentUser'));
      await apiService.cancelOrder(orderId, user.id);
      
      addPopup('Bestellung erfolgreich storniert ❌', 'success');
      fetchBestellungen();
    } catch (error) {
      console.error('Error cancelling order:', error);
      addPopup(error.message || 'Fehler beim Stornieren der Bestellung', 'error');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const user = JSON.parse(localStorage.getItem('pizzashop_currentUser'));
      await apiService.deleteOrder(orderId, user.id);
      
      addPopup('Bestellung wurde gelöscht 🗑️', 'success');
      fetchBestellungen();
    } catch (error) {
      console.error('Error deleting order:', error);
      addPopup(error.message || 'Fehler beim Löschen der Bestellung', 'error');
    }
  };

  const isCancelled = (bestellung) => {
    return bestellung.status === 'cancelled' || bestellung.delivery_address?.includes('[STORNIERT]');
  };

  if (bestellungen.length === 0) {
    return (
      <div>
        <h2>📋 Deine Bestellungen</h2>
        <div style={{textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
          <p style={{fontSize: '1.2rem', color: '#666'}}>Du hast noch keine Bestellungen aufgegeben.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>📋 Deine Bestellungen</h2>
      
      <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
        {bestellungen.map(bestellung => (
          <div key={bestellung.id} className="order-card">
            <div className="order-header">
              <div>
                <h4 style={{marginBottom: '5px'}}>Bestellung #{bestellung.id}</h4>
                <span style={{color: '#666', fontSize: '0.9rem'}}>
                  {new Date(bestellung.order_date).toLocaleDateString('de-DE')}
                </span>
              </div>
              <div className={`order-status ${bestellung.delivery_address?.includes('[STORNIERT]') ? 'cancelled' : bestellung.status}`}>
                {getStatusText(bestellung.status, bestellung.delivery_address)}
              </div>
            </div>
            
            <div style={{margin: '15px 0'}}>
              {bestellung.items?.map((item, index) => (
                <div key={index} style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '5px 0', 
                  borderBottom: index < bestellung.items.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <span>{item.quantity}x {item.pizza_name}</span>
                  <span style={{fontWeight: '600'}}>
                    {parseFloat(item.item_price || 0).toFixed(2)}€
                  </span>
                </div>
              ))}
            </div>
            
            <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#ff6b35', textAlign: 'right', marginTop: '10px'}}>
              Gesamt: {parseFloat(bestellung.total_price || 0).toFixed(2)}€
            </div>
            
            {bestellung.delivery_address && (
              <div style={{marginTop: '15px', padding: '10px', background: '#f8f8f8', borderRadius: '6px', fontSize: '0.9rem'}}>
                <strong>Lieferadresse:</strong> {bestellung.delivery_address.replace(' [STORNIERT]', '')}
              </div>
            )}
            
            <div style={{marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              {canCancelOrder(bestellung.status, bestellung.delivery_address) && (
                <button 
                  style={{background: '#e53e3e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'}}
                  onClick={() => handleCancelOrder(bestellung.id)}
                >
                  Stornieren
                </button>
              )}
              {isCancelled(bestellung) && (
                <button 
                  style={{background: '#6c757d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'}}
                  onClick={() => handleDeleteOrder(bestellung.id)}
                >
                  🗑️ Löschen
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {confirmDialog.show && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Bestellung stornieren?</h3>
            <p style={{marginBottom: '20px', color: '#666'}}>
              Möchtest du diese Bestellung wirklich stornieren?
            </p>
            <div className="modal-actions">
              <button 
                className="modal-cancel"
                onClick={() => setConfirmDialog({ show: false, orderId: null })}
              >
                Abbrechen
              </button>
              <button 
                className="modal-confirm"
                onClick={confirmCancelOrder}
                style={{background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)'}}
              >
                Ja, stornieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;