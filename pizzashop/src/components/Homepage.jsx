import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PizzaMenu from './PizzaMenu';
import CartView from './CartView';
import OrderHistory from './OrderHistory';
import Reviews from './Reviews';
import apiService from '../services/apiService';

const Homepage = ({ addPopup }) => {
  const [benutzer, setBenutzer] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [warenkorb, setWarenkorb] = useState([]);
  const [bestellungen, setBestellungen] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('pizzashop_currentUser') || 'null');
    if (!currentUser) navigate('/');
    else setBenutzer(currentUser);
  }, [navigate]);

  useEffect(() => {
    fetchBestellungen();
  }, []);

  const fetchBestellungen = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('pizzashop_currentUser'));
      if (!user) return;

      const data = await apiService.getOrders(user.id);
      setBestellungen(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.message.includes('Session abgelaufen')) {
        addPopup('Session abgelaufen. Bitte melde dich erneut an.', 'error');
      }
    }
  };

  const handleLogout = () => {
    apiService.logout();
    addPopup('Erfolgreich abgemeldet! 👋', 'success');
    navigate('/');
  };

  const hinzufügenZumWarenkorb = (item) => {
    setWarenkorb(prev => {
      const existingItem = prev.find(cartItem => 
        cartItem.pizza.id === item.pizza.id && 
        JSON.stringify(cartItem.customIngredients) === JSON.stringify(item.customIngredients)
      );
      
      if (existingItem) {
        return prev.map(cartItem => cartItem === existingItem 
          ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem);
      } else return [...prev, item];
    });
  };

  if (!benutzer) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="homepage">
      <header className="homepage-header">
        <h1 className="homepage-title">🍕 Pizzashop</h1>
        <div className="homepage-user">
          <span className="homepage-welcome">Hallo, {benutzer.username}!</span>
          <button onClick={handleLogout} className="logout-button">
            Abmelden
          </button>
        </div>
      </header>
      
      <nav className="navigation">
        <button className={`nav-button ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
          🍕 Pizza bestellen
        </button>
        <button className={`nav-button ${activeTab === 'cart' ? 'active' : ''}`} onClick={() => setActiveTab('cart')}>
          � Warenkorb {warenkorb.length > 0 && `(${warenkorb.length})`}
        </button>
        <button className={`nav-button ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          📋 Bestellungen
        </button>
        <button className={`nav-button ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
          ⭐ Bewertungen
        </button>
      </nav>
      
      <main className="content">
        {activeTab === 'menu' && <PizzaMenu onAddToCart={hinzufügenZumWarenkorb} addPopup={addPopup} />}
        {activeTab === 'cart' && (
          <CartView 
            cart={warenkorb}
            updateCart={setWarenkorb}
            addPopup={addPopup}
            fetchBestellungen={fetchBestellungen}
            setShowCart={() => setActiveTab('orders')}
          />
        )}
        {activeTab === 'orders' && (
          <OrderHistory 
            bestellungen={bestellungen}
            addPopup={addPopup}
            fetchBestellungen={fetchBestellungen}
          />
        )}
        {activeTab === 'reviews' && <Reviews addPopup={addPopup} />}
      </main>
    </div>
  );
};

export default Homepage;
