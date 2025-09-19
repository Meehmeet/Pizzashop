import { useState, useEffect } from 'react';

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
  const [ingredients, setIngredients] = useState([]);
  const [showCustomPizza, setShowCustomPizza] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  const getPizzaImage = (pizzaName) => {
    const name = pizzaName?.toLowerCase();
    return pizzaImages[name] || null;
  };

  useEffect(() => {
    fetchPizzas();
    fetchIngredients();
  }, []);

  const fetchPizzas = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/pizzas');
      const data = await response.json();
      setPizzas(data);
    } catch (error) {
      console.error('Error fetching pizzas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/ingredients');
      const data = await response.json();
      setIngredients(data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const handleIngredientToggle = (ingredient) => {
    setSelectedIngredients(prev => {
      const exists = prev.find(ing => ing.id === ingredient.id);
      if (exists) {
        return prev.filter(ing => ing.id !== ingredient.id);
      } else {
        return [...prev, ingredient];
      }
    });
  };

  const calculateCustomPrice = () => {
    const basePrice = 7.00;
    const ingredientPrice = selectedIngredients.reduce((sum, ing) => sum + parseFloat(ing.price || 0), 0);
    return basePrice + ingredientPrice;
  };

  const handleOrderPizza = (pizza) => {
    if (pizza.name === 'Custom Pizza' && selectedIngredients.length === 0) {
      addPopup('Bitte wähle mindestens eine Zutat für deine Custom Pizza!', 'error');
      return;
    }
    
    const orderItem = {
      pizza,
      customIngredients: pizza.name === 'Custom Pizza' ? selectedIngredients : null,
      price: pizza.name === 'Custom Pizza' ? calculateCustomPrice() : parseFloat(pizza.base_price || 0),
      quantity: 1
    };
    
    onAddToCart(orderItem);
    
    if (pizza.name === 'Custom Pizza') {
      addPopup(`Deine Custom Pizza wurde zum Warenkorb hinzugefügt! 🍕`, 'success');
      setSelectedIngredients([]);
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
                    {ingredients
                      .filter(ing => ing.category === category)
                      .map(ingredient => (
                        <label key={ingredient.id} className="ingredient-item">
                          <input
                            type="checkbox"
                            className="ingredient-checkbox"
                            checked={selectedIngredients.some(ing => ing.id === ingredient.id)}
                            onChange={() => handleIngredientToggle(ingredient)}
                          />
                          <span>{ingredient.name}</span>
                          {parseFloat(ingredient.price || 0) > 0 && (
                            <span className="ingredient-price">+{parseFloat(ingredient.price || 0).toFixed(2)}€</span>
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
                  setSelectedIngredients([]);
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
                disabled={selectedIngredients.length === 0}
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
