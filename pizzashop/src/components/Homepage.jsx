import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PizzaMenu from './PizzaMenu';
import Orders from './Orders';
import Reviews from './Reviews';

const Homepage = ({ addPopup }) => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('pizzashop_currentUser') || 'null');
    if (!currentUser) navigate('/');
    else setUser(currentUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('pizzashop_currentUser');
    navigate('/');
  };

  const addToCart = (item) => {
    setCart(prev => {
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

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="homepage">
      <header className="homepage-header">
        <h1 className="homepage-title">🍕 Pizzashop</h1>
        <div className="homepage-user">
          <span className="homepage-welcome">Hallo, {user.username}!</span>
          <button onClick={handleLogout} className="logout-button">
            Abmelden
          </button>
        </div>
      </header>
      
      <nav className="navigation">
        <button className={`nav-button ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
          🍕 Pizza bestellen
        </button>
        <button className={`nav-button ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          📋 Bestellungen {cart.length > 0 && `(${cart.length})`}
        </button>
        <button className={`nav-button ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
          ⭐ Bewertungen
        </button>
      </nav>
      
      <main className="content">
        {activeTab === 'menu' && <PizzaMenu onAddToCart={addToCart} addPopup={addPopup} />}
        {activeTab === 'orders' && <Orders initialCart={cart} cart={cart} setCart={setCart} addPopup={addPopup} />}
        {activeTab === 'reviews' && <Reviews addPopup={addPopup} />}
      </main>
    </div>
  );
};

export default Homepage;
