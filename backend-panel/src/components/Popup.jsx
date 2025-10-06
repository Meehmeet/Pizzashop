import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Popup = ({ nachricht, typ = 'success', onClose }) => {
  const [istSichtbar, setIstSichtbar] = useState(false);

  useEffect(() => {
    // Animation beim Einblenden
    setIstSichtbar(true);
    
    // Automatisches Schließen nach 3 Sekunden
    const timer = setTimeout(() => {
      handleSchließen();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleSchließen = () => {
    setIstSichtbar(false);
    setTimeout(onClose, 300); // Warten bis Animation fertig ist
  };

  const getIcon = (typ) => {
    const iconMap = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };
    return iconMap[typ] || 'ℹ️';
  };

  return (
    <div 
      className={`popup popup-${typ} ${istSichtbar ? 'popup-show' : 'popup-hide'}`}
    >
      <div className="popup-content">
        <span className="popup-icon">
          {getIcon(typ)}
        </span>
        <span className="popup-message">{nachricht}</span>
        <button 
          className="popup-close" 
          onClick={handleSchließen}
          aria-label="Popup schließen"
        >
          ×
        </button>
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
          nachricht={popup.message}
          typ={popup.type}
          onClose={() => removePopup(popup.id)}
        />
      ))}
    </div>,
    document.body // Rendert direkt am body-Element für bessere Z-Index-Kontrolle
  );
};

export { Popup, PopupContainer };