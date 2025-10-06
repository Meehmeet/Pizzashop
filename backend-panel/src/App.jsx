import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import OrderManagement from './components/OrderManagement';
import ReviewManagement from './components/ReviewManagement';
import { PopupContainer } from './components/Popup';
import adminApiService from './services/adminApiService';
import './styles/admin.css';
import './styles/popup.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [popups, setPopups] = useState([]);

  // Popup-System
  const addPopup = (message, type = 'success') => {
    const popup = {
      id: Date.now() + Math.random(),
      message,
      type
    };
    setPopups(prev => [...prev, popup]);
  };

  const removePopup = (id) => {
    setPopups(prev => prev.filter(popup => popup.id !== id));
  };

  const handleLogout = () => {
    adminApiService.logout();
    window.close();
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard addPopup={addPopup} />;
      case 'users':
        return <UserManagement addPopup={addPopup} />;
      case 'orders':
        return <OrderManagement addPopup={addPopup} />;
      case 'reviews':
        return <ReviewManagement addPopup={addPopup} />;
      default:
        return <Dashboard addPopup={addPopup} />;
    }
  };

  return (
    <div className="admin-container">
      {/* Header mit Navigation */}
      <header className="admin-header">
        <h1 className="admin-title">🍕 Pizzashop Admin Panel</h1>
        <nav className="admin-nav">
          <button 
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-btn ${currentView === 'users' ? 'active' : ''}`}
            onClick={() => setCurrentView('users')}
          >
            👥 Benutzer
          </button>
          <button 
            className={`nav-btn ${currentView === 'orders' ? 'active' : ''}`}
            onClick={() => setCurrentView('orders')}
          >
            📦 Bestellungen
          </button>
          <button 
            className={`nav-btn ${currentView === 'reviews' ? 'active' : ''}`}
            onClick={() => setCurrentView('reviews')}
          >
            ⭐ Bewertungen
          </button>
          <button className="nav-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </nav>
      </header>

      {/* Hauptinhalt */}
      <main>
        {renderCurrentView()}
      </main>
      
      {/* Popup System */}
      <PopupContainer 
        popups={popups} 
        removePopup={removePopup} 
      />
    </div>
  );
}

export default App;