import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Popup = ({ message, type = 'success', onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation beim Einblenden
    setIsVisible(true);
    
    // Automatisches Schließen nach 3 Sekunden
    const timer = setTimeout(() => {
      handleClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Warten bis Animation fertig ist
  };

  return (
    <div 
      className={`popup popup-${type} ${isVisible ? 'popup-show' : 'popup-hide'}`}
    >
      <div className="popup-content">
        <span className="popup-icon">
          {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </span>
        <span className="popup-message">{message}</span>
        <button className="popup-close" onClick={handleClose}>×</button>
      </div>
    </div>
  );
};

const PopupContainer = ({ popups, removePopup }) => {
  // Portal rendering - rendert DIREKT am body, nicht in der App-Struktur
  return createPortal(
    <div className="popup-container">
      {popups.map(popup => (
        <Popup
          key={popup.id}
          message={popup.message}
          type={popup.type}
          onClose={() => removePopup(popup.id)}
        />
      ))}
    </div>,
    document.body // Rendert direkt am body-Element
  );
};

export { Popup, PopupContainer };
