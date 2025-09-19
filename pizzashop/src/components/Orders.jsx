import { useState, useEffect } from 'react';

const Orders = ({ initialCart = [], cart: externalCart, setCart: setExternalCart, addPopup }) => {
  const [cart, setCart] = useState(externalCart || initialCart);
  const [orders, setOrders] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    houseNumber: '',
    zipCode: '',
    city: '',
    additionalInfo: ''
  });
  const [showCart, setShowCart] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, orderId: null });

  useEffect(() => {
    if (externalCart) {
      setCart(externalCart);
    }
  }, [externalCart]);

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const updateCart = (newCart) => {
    setCart(newCart);
    if (setExternalCart) {
      setExternalCart(newCart);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('pizzashop_currentUser'));
      if (!user) return;

      const response = await fetch(`http://localhost:3001/api/orders/${user.id}`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => 
        cartItem.pizza.id === item.pizza.id && 
        JSON.stringify(cartItem.customIngredients) === JSON.stringify(item.customIngredients)
      );
      
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem === existingItem 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prev, item];
      }
    });
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    updateCart(newCart);
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    const newCart = cart.map((item, i) => 
      i === index ? { ...item, quantity: newQuantity } : item
    );
    updateCart(newCart);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      addPopup('Dein Warenkorb ist leer!', 'error');
      return;
    }

    if (!deliveryAddress.street.trim()) {
      addPopup('Bitte gib eine Straße an!', 'error');
      return;
    }
    if (!deliveryAddress.houseNumber.trim()) {
      addPopup('Bitte gib eine Hausnummer an!', 'error');
      return;
    }
    if (!deliveryAddress.zipCode.trim()) {
      addPopup('Bitte gib eine PLZ an!', 'error');
      return;
    }
    if (!deliveryAddress.city.trim()) {
      addPopup('Bitte gib eine Stadt an!', 'error');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('pizzashop_currentUser'));
      
      const fullAddress = `${deliveryAddress.street} ${deliveryAddress.houseNumber}, ${deliveryAddress.zipCode} ${deliveryAddress.city}${deliveryAddress.additionalInfo ? ', ' + deliveryAddress.additionalInfo : ''}`;
      
      const orderData = {
        userId: user.id,
        items: cart,
        deliveryAddress: fullAddress,
        totalPrice: calculateTotal()
      };

      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        addPopup('Bestellung erfolgreich aufgegeben! 🍕', 'success');
        updateCart([]);
        setDeliveryAddress({
          street: '',
          houseNumber: '',
          zipCode: '',
          city: '',
          additionalInfo: ''
        });
        fetchUserOrders();
        setShowCart(false);
      } else {
        addPopup('Fehler beim Aufgeben der Bestellung', 'error');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      addPopup('Verbindungsfehler beim Bestellen', 'error');
    }
  };

  const canCancelOrder = (status, deliveryAddress) => {
    const isCancelled = status === 'cancelled' || deliveryAddress?.includes('[STORNIERT]');
    return !isCancelled && (status === 'pending' || status === 'preparing');
  };

  const getStatusText = (status, deliveryAddress) => {
    if (deliveryAddress?.includes('[STORNIERT]')) {
      return '❌ Storniert';
    }
    
    switch (status) {
      case 'pending': return '⏳ Bestätigung ausstehend';
      case 'preparing': return '👨‍🍳 Wird zubereitet';
      case 'ready': return '🚗 Bereit für Lieferung';
      case 'delivered': return '✅ Geliefert';
      case 'cancelled': return '❌ Storniert';
      default: return status;
    }
  };

  const handleCancelOrder = async (orderId) => {
    setConfirmDialog({ show: true, orderId });
  };

  const confirmCancelOrder = async () => {
    const orderId = confirmDialog.orderId;
    setConfirmDialog({ show: false, orderId: null });

    try {
      const user = JSON.parse(localStorage.getItem('pizzashop_currentUser'));
      
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        addPopup('Bestellung erfolgreich storniert ❌', 'success');
        fetchUserOrders();
      } else {
        const error = await response.json();
        addPopup(error.error || 'Fehler beim Stornieren der Bestellung', 'error');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      addPopup('Verbindungsfehler beim Stornieren', 'error');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const user = JSON.parse(localStorage.getItem('pizzashop_currentUser'));
      
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        addPopup('Bestellung wurde gelöscht 🗑️', 'success');
        fetchUserOrders();
      } else {
        const error = await response.json();
        addPopup(error.error || 'Fehler beim Löschen der Bestellung', 'error');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      addPopup('Verbindungsfehler beim Löschen', 'error');
    }
  };

  const isCancelled = (order) => {
    return order.status === 'cancelled' || order.delivery_address?.includes('[STORNIERT]');
  };

  return (
    <div>
      <div style={{display: 'flex', gap: '20px', marginBottom: '30px', justifyContent: 'center'}}>
        <button 
          className={`nav-button ${showCart ? 'active' : ''}`}
          onClick={() => setShowCart(true)}
          style={{borderRadius: '8px', padding: '12px 24px'}}
        >
          🛒 Warenkorb ({cart.length})
        </button>
        <button 
          className={`nav-button ${!showCart ? 'active' : ''}`}
          onClick={() => setShowCart(false)}
          style={{borderRadius: '8px', padding: '12px 24px'}}
        >
          📋 Meine Bestellungen
        </button>
      </div>

      {showCart ? (
        <div>
          <h2>🛒 Dein Warenkorb</h2>
          
          {cart.length === 0 ? (
            <div style={{textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
              <p style={{fontSize: '1.2rem', marginBottom: '10px'}}>Dein Warenkorb ist noch leer. 🍕</p>
              <p style={{color: '#666'}}>Wähle leckere Pizzen aus unserem Menü!</p>
            </div>
          ) : (
            <>
              <div className="cart-summary">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div style={{flex: 1}}>
                      <h4 style={{marginBottom: '5px'}}>{item.pizza.name}</h4>
                      {item.customIngredients && (
                        <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '5px'}}>
                          <strong>Zutaten:</strong> {item.customIngredients.map(ing => ing.name).join(', ')}
                        </p>
                      )}
                      <p style={{fontSize: '0.9rem', color: '#ff6b35', fontWeight: '600'}}>{parseFloat(item.price || 0).toFixed(2)}€ pro Stück</p>
                    </div>
                    
                    <div className="quantity-controls">
                      <button className="quantity-btn" onClick={() => updateQuantity(index, item.quantity - 1)}>-</button>
                      <span className="quantity-display">{item.quantity}</span>
                      <button className="quantity-btn" onClick={() => updateQuantity(index, item.quantity + 1)}>+</button>
                    </div>
                    
                    <div style={{fontSize: '1.1rem', fontWeight: 'bold', minWidth: '80px', textAlign: 'right'}}>
                      {(parseFloat(item.price || 0) * parseInt(item.quantity || 1)).toFixed(2)}€
                    </div>
                    
                    <button 
                      style={{background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '5px', color: '#e53e3e'}}
                      onClick={() => removeFromCart(index)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                
                <div className="cart-total">
                  Gesamtsumme: {calculateTotal().toFixed(2)}€
                </div>
              </div>
              
              <div className="delivery-form">
                <h3 style={{gridColumn: '1 / -1', marginBottom: '15px', color: '#333'}}>📍 Lieferadresse</h3>
                <div className="form-group">
                  <label htmlFor="street">Straße *</label>
                  <input
                    id="street"
                    type="text"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Musterstraße"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="houseNumber">Hausnummer *</label>
                  <input
                    id="houseNumber"
                    type="text"
                    value={deliveryAddress.houseNumber}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, houseNumber: e.target.value }))}
                    placeholder="123"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="zipCode">PLZ *</label>
                  <input
                    id="zipCode"
                    type="text"
                    value={deliveryAddress.zipCode}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="12345"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">Stadt *</label>
                  <input
                    id="city"
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Musterstadt"
                    required
                  />
                </div>
                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                  <label htmlFor="additionalInfo">Zusätzliche Informationen</label>
                  <input
                    id="additionalInfo"
                    type="text"
                    value={deliveryAddress.additionalInfo}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    placeholder="Stockwerk, Klingelname, etc."
                  />
                </div>
              </div>
              
              <button 
                className="order-button"
                onClick={handlePlaceOrder}
              >
                Jetzt bestellen 🍕
              </button>
            </>
          )}
        </div>
      ) : (
        <div>
          <h2>📋 Deine Bestellungen</h2>
          
          {orders.length === 0 ? (
            <div style={{textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
              <p style={{fontSize: '1.2rem', color: '#666'}}>Du hast noch keine Bestellungen aufgegeben.</p>
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <h4 style={{marginBottom: '5px'}}>Bestellung #{order.id}</h4>
                      <span style={{color: '#666', fontSize: '0.9rem'}}>
                        {new Date(order.order_date).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    <div className={`order-status ${order.delivery_address?.includes('[STORNIERT]') ? 'cancelled' : order.status}`}>
                      {getStatusText(order.status, order.delivery_address)}
                    </div>
                  </div>
                  
                  <div style={{margin: '15px 0'}}>
                    {order.items?.map((item, index) => (
                      <div key={index} style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: index < order.items.length - 1 ? '1px solid #f0f0f0' : 'none'}}>
                        <span>{item.quantity}x {item.pizza_name}</span>
                        <span style={{fontWeight: '600'}}>{parseFloat(item.item_price || 0).toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#ff6b35', textAlign: 'right', marginTop: '10px'}}>
                    Gesamt: {parseFloat(order.total_price || 0).toFixed(2)}€
                  </div>
                  
                  {order.delivery_address && (
                    <div style={{marginTop: '15px', padding: '10px', background: '#f8f8f8', borderRadius: '6px', fontSize: '0.9rem'}}>
                      <strong>Lieferadresse:</strong> {order.delivery_address.replace(' [STORNIERT]', '')}
                    </div>
                  )}
                  
                  <div style={{marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                    {canCancelOrder(order.status, order.delivery_address) && (
                      <button 
                        style={{background: '#e53e3e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'}}
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Stornieren
                      </button>
                    )}
                    {isCancelled(order) && (
                      <button 
                        style={{background: '#6c757d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'}}
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        🗑️ Löschen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {confirmDialog.show && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Bestellung stornieren?</h3>
            <p style={{marginBottom: '20px', color: '#666'}}>Möchtest du diese Bestellung wirklich stornieren?</p>
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

export default Orders;
