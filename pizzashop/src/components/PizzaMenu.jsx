import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

import pizzaMargherita from '../assets/pizza_magherita.png';
import pizzaFunghi from '../assets/pizza_funghi.png';
import pizzaHawaii from '../assets/pizza_hawaii.png';
import pizzaDoner from '../assets/pizza_doner.png';
import pizzaSalami from '../assets/pizza_salami.png';
import pizzaCustom from '../assets/pizza_custom.png';

const pizzaImages = {
  'pizza margherita': pizzaMargherita,
  'pizza funghi': pizzaFunghi,
  'pizza hawaii': pizzaHawaii,
  'pizza döner': pizzaDoner,
  'pizza salami': pizzaSalami,
  'custom pizza': pizzaCustom
};

const PizzaMenu = ({ onAddToCart, addPopup }) => {
  const [pizzas, setPizzas] = useState([]);
  const [zutaten, setZutaten] = useState([]);
  const [showCustomPizza, setShowCustomPizza] = useState(false);
  const [gewählteZutaten, setGewählteZutaten] = useState([]);
  const [loading, setLoading] = useState(true);

  const getPizzaImage = (pizzaName) => {
    const name = pizzaName?.toLowerCase();
    return pizzaImages[name] || null;
  };

  useEffect(() => {
    fetchPizzas();
    fetchZutaten();
  }, []);

  const fetchPizzas = async () => {
    try {
      const data = await apiService.getPizzas();
      setPizzas(data);
    } catch (error) {
      console.error('Error fetching pizzas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchZutaten = async () => {
    try {
      const data = await apiService.getIngredients();
      setZutaten(data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const handleZutatenToggle = (zutat) => {
    setGewählteZutaten(prev => {
      const exists = prev.find(ing => ing.id === zutat.id);
      if (exists) {
        return prev.filter(ing => ing.id !== zutat.id);
      } else {
        return [...prev, zutat];
      }
    });
  };

  const calculateCustomPrice = () => {
    const basePrice = 7.00;
    const zutatenPreis = gewählteZutaten.reduce((sum, ing) => sum + parseFloat(ing.price || 0), 0);
    return basePrice + zutatenPreis;
  };

  const handleOrderPizza = (pizza) => {
    if (pizza.name === 'Custom Pizza' && gewählteZutaten.length === 0) {
      addPopup('Bitte wähle mindestens eine Zutat für deine Custom Pizza!', 'error');
      return;
    }
    
    const orderItem = {
      pizza,
      customIngredients: pizza.name === 'Custom Pizza' ? gewählteZutaten : null,
      price: pizza.name === 'Custom Pizza' ? calculateCustomPrice() : parseFloat(pizza.base_price || 0),
      quantity: 1
    };
    
    onAddToCart(orderItem);
    
    if (pizza.name === 'Custom Pizza') {
      addPopup(`Deine Custom Pizza wurde zum Warenkorb hinzugefügt! 🍕`, 'success');
      setGewählteZutaten([]);
      setShowCustomPizza(false);
    } else {
      addPopup(`${pizza.name} wurde zum Warenkorb hinzugefügt! 🍕`, 'success');
    }
  };

  if (loading) return <div className="loading">Lade Pizzen...</div>;

  return (
    <div>
      <h2>🍕 Unsere Pizzas</h2>
      
      <div className="pizza-menu">
        {pizzas.map(pizza => (
          <div key={pizza.id} className="pizza-card">
            <img 
              src={getPizzaImage(pizza.name)} 
              alt={pizza.name}
              className="pizza-image"
            />
            
            <div className="pizza-card-content">
              <h3 className="pizza-name">{pizza.name}</h3>
              <p className="pizza-description">{pizza.description}</p>
              
              {pizza.ingredients && (
                <div className="pizza-ingredients">
                  <strong>Zutaten:</strong> {pizza.ingredients.join(', ')}
                </div>
              )}
              
              <div className="pizza-price">
                {pizza.name === 'Custom Pizza' ? 'ab ' : ''}
                {parseFloat(pizza.base_price || 0).toFixed(2)}€
              </div>
              
              <div className="pizza-actions">
                {pizza.name === 'Custom Pizza' ? (
                  <button 
                    className="add-to-cart"
                    onClick={() => setShowCustomPizza(true)}
                  >
                    Pizza zusammenstellen
                  </button>
                ) : (
                  <button 
                    className="add-to-cart"
                    onClick={() => handleOrderPizza(pizza)}
                  >
                    Bestellen
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCustomPizza && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🍕 Stelle deine Pizza zusammen</h3>
            
            <div className="custom-pizza">
              {['sauce', 'cheese', 'meat', 'vegetable', 'other'].map(category => (
                <div key={category} className="ingredient-category">
                  <h4>{category === 'sauce' ? 'Soßen' : 
                        category === 'cheese' ? 'Käse' :
                        category === 'meat' ? 'Fleisch' :
                        category === 'vegetable' ? 'Gemüse' : 'Sonstiges'}</h4>
                  
                  <div className="ingredients-grid">
                    {zutaten
                      .filter(zutat => zutat.category === category)
                      .map(zutat => (
                        <label key={zutat.id} className="ingredient-item">
                          <input
                            type="checkbox"
                            className="ingredient-checkbox"
                            checked={gewählteZutaten.some(ing => ing.id === zutat.id)}
                            onChange={() => handleZutatenToggle(zutat)}
                          />
                          <span>{zutat.name}</span>
                          {parseFloat(zutat.price || 0) > 0 && (
                            <span className="ingredient-price">+{parseFloat(zutat.price || 0).toFixed(2)}€</span>
                          )}
                        </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <p style={{textAlign: 'center', fontSize: '1.2rem', marginBottom: '20px'}}>
              <strong>Gesamtpreis: {calculateCustomPrice().toFixed(2)}€</strong>
            </p>
            
            <div className="modal-actions">
              <button 
                className="modal-cancel"
                onClick={() => {
                  setShowCustomPizza(false);
                  setGewählteZutaten([]);
                }}
              >
                Abbrechen
              </button>
              <button 
                className="modal-confirm"
                onClick={() => handleOrderPizza({ 
                  id: 'custom', 
                  name: 'Custom Pizza', 
                  base_price: 7.00 
                })}
                disabled={gewählteZutaten.length === 0}
              >
                Pizza bestellen ({calculateCustomPrice().toFixed(2)}€)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PizzaMenu;