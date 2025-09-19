import { useState } from 'react';

const CartView = ({ cart, updateCart, addPopup, fetchBestellungen, setShowCart }) => {
  const [lieferAdresse, setLieferAdresse] = useState({
    strasse: '',
    hausNummer: '',
    PLZ: '',
    stadt: '',
    zusatzInfo: ''
  });

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

    const addressFields = [
      { field: 'strasse', message: 'Bitte gib eine Straße an!' },
      { field: 'hausNummer', message: 'Bitte gib eine Hausnummer an!' },
      { field: 'PLZ', message: 'Bitte gib eine PLZ an!' },
      { field: 'stadt', message: 'Bitte gib eine Stadt an!' }
    ];

    for (const { field, message } of addressFields) {
      if (!lieferAdresse[field].trim()) {
        addPopup(message, 'error');
        return;
      }
    }

    try {
      const user = JSON.parse(localStorage.getItem('pizzashop_currentUser'));
      const fullAddress = `${lieferAdresse.strasse} ${lieferAdresse.hausNummer}, ${lieferAdresse.PLZ} ${lieferAdresse.stadt}${lieferAdresse.zusatzInfo ? ', ' + lieferAdresse.zusatzInfo : ''}`;
      
      const orderData = {
        userId: user.id,
        items: cart,
        deliveryAddress: fullAddress,
        totalPrice: calculateTotal()
      };

      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        addPopup('Bestellung erfolgreich aufgegeben! 🍕', 'success');
        updateCart([]);
        setLieferAdresse({
          strasse: '',
          hausNummer: '',
          PLZ: '',
          stadt: '',
          zusatzInfo: ''
        });
        fetchBestellungen();
        setShowCart(false);
      } else {
        addPopup('Fehler beim Aufgeben der Bestellung', 'error');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      addPopup('Verbindungsfehler beim Bestellen', 'error');
    }
  };

  if (cart.length === 0) {
    return (
      <div>
        <h2>🛒 Dein Warenkorb</h2>
        <div style={{textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
          <p style={{fontSize: '1.2rem', marginBottom: '10px'}}>Dein Warenkorb ist noch leer. 🍕</p>
          <p style={{color: '#666'}}>Wähle leckere Pizzen aus unserem Menü!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>🛒 Dein Warenkorb</h2>
      
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
              <p style={{fontSize: '0.9rem', color: '#ff6b35', fontWeight: '600'}}>
                {parseFloat(item.price || 0).toFixed(2)}€ pro Stück
              </p>
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
            value={lieferAdresse.strasse}
            onChange={(e) => setLieferAdresse(prev => ({ ...prev, strasse: e.target.value }))}
            placeholder="Musterstraße"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="houseNumber">Hausnummer *</label>
          <input
            id="houseNumber"
            type="text"
            value={lieferAdresse.hausNummer}
            onChange={(e) => setLieferAdresse(prev => ({ ...prev, hausNummer: e.target.value }))}
            placeholder="123"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="zipCode">PLZ *</label>
          <input
            id="zipCode"
            type="text"
            value={lieferAdresse.PLZ}
            onChange={(e) => setLieferAdresse(prev => ({ ...prev, PLZ: e.target.value }))}
            placeholder="12345"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="city">Stadt *</label>
          <input
            id="city"
            type="text"
            value={lieferAdresse.stadt}
            onChange={(e) => setLieferAdresse(prev => ({ ...prev, stadt: e.target.value }))}
            placeholder="Musterstadt"
            required
          />
        </div>
        
        <div className="form-group" style={{gridColumn: '1 / -1'}}>
          <label htmlFor="additionalInfo">Zusätzliche Informationen</label>
          <input
            id="additionalInfo"
            type="text"
            value={lieferAdresse.zusatzInfo}
            onChange={(e) => setLieferAdresse(prev => ({ ...prev, zusatzInfo: e.target.value }))}
            placeholder="Stockwerk, Klingelname, etc."
          />
        </div>
      </div>
      
      <button className="order-button" onClick={handlePlaceOrder}>
        Jetzt bestellen 🍕
      </button>
    </div>
  );
};

export default CartView;