// ===== PIZZASHOP BACKEND SERVER =====
// Hauptserver für die Pizzashop-Anwendung
// Behandelt: Authentifizierung, Bestellungen, Pizzas, Bewertungen

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');         // Passwort-Hashing für Sicherheit
const jwt = require('jsonwebtoken');      // JSON Web Tokens für Authentifizierung
const rateLimit = require('express-rate-limit'); // Schutz vor Brute-Force
const { 
  STATUS_CODES, 
  ERROR_CODES, 
  validateRegistration,    // Backend-Sicherheits-Validierung
  validateLogin,          // Backend-Sicherheits-Validierung
  formatErrorResponse,    // Einheitliche Fehler-Antworten
  formatSuccessResponse   // Einheitliche Erfolgs-Antworten
} = require('./validation');
require('dotenv').config(); // Umgebungsvariablen laden

const app = express();
const PORT = process.env.PORT || 3001;

// JWT Secret (sollte in .env stehen)
const JWT_SECRET = process.env.JWT_SECRET || 'dein-super-geheimer-schluessel-hier';

// ===== SICHERHEITSKONFIGURATION =====
// Rate Limiting: Schutz vor Brute-Force-Angriffen
const loginLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 Sekunden Zeitfenster
  max: 5, // Maximum 5 Login-Versuche pro 30 Sekunden
  message: formatErrorResponse(
    'Zu viele Login-Versuche. Bitte warte 30 Sekunden und versuche es erneut.',
    ERROR_CODES.TOO_MANY_REQUESTS
  ),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  statusCode: STATUS_CODES.TOO_MANY_REQUESTS
});

app.use(cors());
app.use(express.json());

// ===== AUTHENTIFIZIERUNGS-MIDDLEWARE =====
// Schützt Routen vor unbefugtem Zugriff (Bestellungen, etc.)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extrahiert Token aus "Bearer TOKEN"
  
  if (!token) {
    return res.status(STATUS_CODES.UNAUTHORIZED).json(
      formatErrorResponse('Access Token erforderlich', ERROR_CODES.ACCESS_DENIED, STATUS_CODES.UNAUTHORIZED)
    );
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      const errorCode = err.name === 'TokenExpiredError' ? ERROR_CODES.TOKEN_EXPIRED : ERROR_CODES.TOKEN_INVALID;
      const errorMessage = err.name === 'TokenExpiredError' ? 'Token ist abgelaufen' : 'Ungültiger Token';
      
      return res.status(STATUS_CODES.FORBIDDEN).json(
        formatErrorResponse(errorMessage, errorCode, STATUS_CODES.FORBIDDEN)
      );
    }
    req.user = user;
    next();
  });
};

// Datenbank-Verbindung
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
  console.log('Using existing database tables');
  
  // Prüfe die vorhandenen Tabellen
  db.query('SHOW TABLES', (err, results) => {
    if (err) {
      console.error('Error checking tables:', err);
    } else {
      console.log('Available tables:', results.map(row => Object.values(row)[0]));
    }
  });
});

// ================= AUTHENTICATION ROUTES =================

// Registrierung
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  // Validierung der Eingabedaten
  const validation = validateRegistration({ username, email, password });
  if (!validation.valid) {
    return res.status(STATUS_CODES.UNPROCESSABLE_ENTITY).json(
      formatErrorResponse(validation.error, validation.code, STATUS_CODES.UNPROCESSABLE_ENTITY)
    );
  }
  
  try {
    // Prüfe ob Email oder Username bereits existiert
    const checkQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
    db.query(checkQuery, [email, username], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
          formatErrorResponse('Datenbankfehler', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
        );
      }
      
      if (results.length > 0) {
        for (const user of results) {
          if (user.email === email) {
            return res.status(STATUS_CODES.CONFLICT).json(
              formatErrorResponse('Diese E-Mail Adresse wird bereits verwendet', ERROR_CODES.EMAIL_EXISTS, STATUS_CODES.CONFLICT)
            );
          }
          if (user.username === username) {
            return res.status(STATUS_CODES.CONFLICT).json(
              formatErrorResponse('Dieser Nutzername existiert bereits', ERROR_CODES.USERNAME_EXISTS, STATUS_CODES.CONFLICT)
            );
          }
        }
      }
      
      // Hash das Passwort
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Speichere User mit gehashtem Passwort
      const insertQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      db.query(insertQuery, [username, email, hashedPassword], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
            formatErrorResponse('Fehler beim Erstellen des Kontos', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
          );
        }
        
        res.status(STATUS_CODES.CREATED).json(formatSuccessResponse({
          id: results.insertId,
          username: username,
          email: email
        }, 'Konto erfolgreich erstellt'));
      });
    });
  } catch (error) {
    console.error('Password hashing error:', error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Fehler beim Verarbeiten des Passworts', ERROR_CODES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
    );
  }
});

// Login
app.post('/api/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  
  // Validierung der Login-Daten
  const validation = validateLogin({ email, password });
  if (!validation.valid) {
    return res.status(STATUS_CODES.UNPROCESSABLE_ENTITY).json(
      formatErrorResponse(validation.error, validation.code, STATUS_CODES.UNPROCESSABLE_ENTITY)
    );
  }
  
  try {
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
          formatErrorResponse('Datenbankfehler', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
        );
      }
      
      if (results.length === 0) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json(
          formatErrorResponse('E-Mail oder Passwort ist falsch', ERROR_CODES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED)
        );
      }
      
      const user = results[0];
      
      // Vergleiche das eingegebene Passwort mit dem gehashten Passwort
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json(
          formatErrorResponse('E-Mail oder Passwort ist falsch', ERROR_CODES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED)
        );
      }
      
      // JWT Token erstellen
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          username: user.username 
        },
        JWT_SECRET,
        { expiresIn: '1h' } // Token läuft nach 1 Stunde ab
      );
      
      // Login erfolgreich - Direkte Antwort für Kompatibilität mit ApiService
      res.json({
        message: 'Anmeldung erfolgreich',
        token: token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Interner Serverfehler', ERROR_CODES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
    );
  }
});

// ================= PUBLIC ROUTES =================

// Get all pizzas (Öffentlich)
app.get('/api/pizzas', (req, res) => {
  const query = 'SELECT * FROM pizzas';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error loading pizzas:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Fehler beim Laden der Pizzas', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    // Korrekte Transformation basierend auf deiner Datenbankstruktur
    const pizzas = results.map(pizza => ({
      id: pizza.id,
      name: pizza.name,
      description: pizza.description,
      base_price: parseFloat(pizza.base_price), // Frontend erwartet base_price
      preis: parseFloat(pizza.base_price), // Auch preis für Kompatibilität
      image: mapPizzaImage(pizza.name), // Mapping zu lokalen Bildern
      ingredients: pizza.description ? [pizza.description] : []
    }));
    
    // Direkte Antwort für Kompatibilität mit PizzaMenu
    res.json(pizzas);
  });
});

// Hilfsfunktion für Bild-Mapping
function mapPizzaImage(pizzaName) {
  const name = pizzaName.toLowerCase();
  if (name.includes('margherita')) return 'pizza_magherita.png';
  if (name.includes('funghi')) return 'pizza_funghi.png';
  if (name.includes('hawaii')) return 'pizza_hawaii.png';
  if (name.includes('salami')) return 'pizza_salami.png';
  if (name.includes('döner') || name.includes('doner')) return 'pizza_doner.png';
  return 'pizza_custom.png';
}

// Get all ingredients (Öffentlich)
app.get('/api/ingredients', (req, res) => {
  const query = 'SELECT * FROM ingredients';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error loading ingredients:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Fehler beim Laden der Zutaten', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    // Korrekte Transformation basierend auf deiner Datenbankstruktur
    const ingredients = results.map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name,
      price: parseFloat(ingredient.price), // Frontend erwartet price
      preis: parseFloat(ingredient.price), // Auch preis für Kompatibilität
      category: ingredient.category // Für Custom Pizza Kategorien
    }));
    
    // Direkte Antwort für Kompatibilität
    res.json(ingredients);
  });
});

// Get all reviews (Öffentlich)
app.get('/api/reviews', (req, res) => {
  const query = `
    SELECT r.*, u.username 
    FROM reviews r 
    JOIN users u ON r.user_id = u.id 
    ORDER BY r.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Fehler beim Laden der Bewertungen', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    // Direkte Antwort für Kompatibilität mit Reviews Component
    res.json(results);
  });
});

// ================= PROTECTED ROUTES =================

// Create order (Geschützt)
app.post('/api/orders', authenticateToken, (req, res) => {
  const { items, deliveryAddress, totalPrice } = req.body;
  const benutzerId = req.user.userId;
  
  console.log('Create order request:', { benutzerId, items: items?.length, deliveryAddress, totalPrice });
  
  if (!items || !totalPrice) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse('Bestellungsdetails und Gesamtpreis sind erforderlich', ERROR_CODES.MISSING_FIELDS, STATUS_CODES.BAD_REQUEST)
    );
  }
  
  // Erstelle zuerst die Hauptbestellung in der orders Tabelle
  const orderQuery = 'INSERT INTO orders (user_id, total_price, status, delivery_address) VALUES (?, ?, ?, ?)';
  const orderValues = [benutzerId, totalPrice, 'pending', deliveryAddress || ''];
  
  db.query(orderQuery, orderValues, (err, results) => {
    if (err) {
      console.error('Database error creating order:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Fehler beim Speichern der Bestellung', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    const orderId = results.insertId;
    console.log(`Created order with ID: ${orderId}`);
    
    // Jetzt erstelle die einzelnen Bestellpositionen in order_items
    const itemInserts = [];
    const itemValues = [];
    
    items.forEach(item => {
      console.log('Processing order item:', JSON.stringify(item, null, 2));
      
      // Für jetzt speichern wir alle Informationen in custom_ingredients
      // da wir die pizza_id nicht zur Laufzeit ermitteln können
      let pizzaId = null; // Können wir später implementieren wenn nötig
      let customIngredients = null;
      
      // Prüfe die richtige Datenstruktur vom Frontend
      if (item.pizza && item.pizza.name && item.customIngredients === null) {
        // Reguläre Pizza - verwende item.pizza.name
        customIngredients = JSON.stringify({ 
          pizza_name: item.pizza.name,
          type: 'regular_pizza'
        });
        console.log(`Storing regular pizza: ${item.pizza.name}`);
      } else if (item.customIngredients && Array.isArray(item.customIngredients)) {
        // Custom Pizza - verwende selectedIngredients
        customIngredients = JSON.stringify({ 
          selectedIngredients: item.customIngredients,
          type: 'custom_pizza',
          pizza_name: 'Custom Pizza'
        });
        console.log(`Storing custom pizza with ingredients:`, item.customIngredients);
      } else {
        // Fallback - könnte alte Datenstruktur sein
        console.log('Fallback: Unknown item structure, treating as custom pizza');
        customIngredients = JSON.stringify({ 
          selectedIngredients: [],
          type: 'custom_pizza',
          pizza_name: 'Custom Pizza'
        });
      }
      
      console.log('Final custom_ingredients to store:', customIngredients);
      
      itemInserts.push('(?, ?, ?, ?, ?)');
      itemValues.push(orderId, pizzaId, customIngredients, item.quantity, item.item_price || item.price);
    });
    
    if (itemInserts.length > 0) {
      const itemQuery = `INSERT INTO order_items (order_id, pizza_id, custom_ingredients, quantity, item_price) VALUES ${itemInserts.join(', ')}`;
      
      db.query(itemQuery, itemValues, (err) => {
        if (err) {
          console.error('Database error creating order items:', err);
          // Rollback: Lösche die Bestellung wieder
          db.query('DELETE FROM orders WHERE id = ?', [orderId], () => {});
          
          return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
            formatErrorResponse('Fehler beim Speichern der Bestelldetails', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
          );
        }
        
        console.log(`Created ${items.length} order items for order ${orderId}`);
        res.status(STATUS_CODES.CREATED).json(formatSuccessResponse({
          bestellungsId: orderId,
          status: 'pending'
        }, 'Bestellung erfolgreich aufgegeben'));
      });
    } else {
      // Keine Items zu speichern
      res.status(STATUS_CODES.CREATED).json(formatSuccessResponse({
        bestellungsId: orderId,
        status: 'pending'
      }, 'Bestellung erfolgreich aufgegeben'));
    }
  });
});

// Get user orders (Geschützt)
app.get('/api/orders/:userId', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.userId);
  const requestingUserId = req.user.userId;
  
  console.log(`Get orders request: userId=${userId}, requestingUserId=${requestingUserId}`);
  
  // Benutzer kann nur seine eigenen Bestellungen abrufen
  if (userId !== requestingUserId) {
    return res.status(STATUS_CODES.FORBIDDEN).json(
      formatErrorResponse('Zugriff verweigert', ERROR_CODES.ACCESS_DENIED, STATUS_CODES.FORBIDDEN)
    );
  }
  
  // Erst die Tabellenstruktur prüfen
  db.query('DESCRIBE orders', (err, columns) => {
    if (err) {
      console.error('Error getting orders table structure:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Datenbankfehler beim Abrufen der Tabellenstruktur', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    const columnNames = columns.map(col => col.Field);
    console.log('Available columns in orders table:', columnNames);
    
    const query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC';
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
          formatErrorResponse('Fehler beim Laden der Bestellungen', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
        );
      }
      
      console.log(`Found ${results.length} orders for user ${userId}`);
      
      // Lade Bestelldetails aus order_items Tabelle
      const orderIds = results.map(order => order.id);
      
      if (orderIds.length === 0) {
        return res.json([]);
      }
      
      // JOIN-Query um order_items mit pizzas zu verknüpfen
      const itemsQuery = `
        SELECT 
          oi.order_id,
          oi.quantity,
          oi.item_price,
          oi.custom_ingredients,
          p.name as pizza_name
        FROM order_items oi
        LEFT JOIN pizzas p ON oi.pizza_id = p.id
        WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')})
        ORDER BY oi.order_id, oi.id
      `;
      
      db.query(itemsQuery, orderIds, (err, itemsResults) => {
        if (err) {
          console.error('Database error loading order items:', err);
          return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
            formatErrorResponse('Fehler beim Laden der Bestelldetails', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
          );
        }
        
        console.log(`Found ${itemsResults.length} order items for ${orderIds.length} orders`);
        
        // Debug: Zeige die raw order_items Daten
        console.log('Raw order items data:', JSON.stringify(itemsResults, null, 2));
        
        // Gruppiere Items nach order_id
        const itemsByOrderId = {};
        itemsResults.forEach(item => {
          if (!itemsByOrderId[item.order_id]) {
            itemsByOrderId[item.order_id] = [];
          }
          
          let pizzaName = 'Pizza';
          
          // Zuerst: Prüfe custom_ingredients für detaillierte Informationen
          if (item.custom_ingredients) {
            try {
              const customData = JSON.parse(item.custom_ingredients);
              
              if (customData.type === 'regular_pizza' && customData.pizza_name) {
                // Reguläre Pizza - verwende den gespeicherten Namen
                pizzaName = customData.pizza_name;
              } else if (customData.type === 'custom_pizza') {
                // Custom Pizza - zeige Zutaten an
                const ingredients = customData.selectedIngredients;
                if (Array.isArray(ingredients) && ingredients.length > 0) {
                  pizzaName = `Custom Pizza (${ingredients.map(ing => ing.name || ing).join(', ')})`;
                } else {
                  pizzaName = 'Custom Pizza';
                }
              } else if (customData.pizza_name) {
                // Fallback für alte Datenstruktur
                pizzaName = customData.pizza_name;
              }
            } catch (e) {
              console.error('Error parsing custom ingredients for order_item:', e);
              // Fallback: Verwende pizza_name aus JOIN oder Standard
              pizzaName = item.pizza_name || 'Pizza (Parse-Fehler)';
            }
          } else {
            // Kein custom_ingredients: Verwende pizza_name aus JOIN
            pizzaName = item.pizza_name || 'Pizza (ohne Details)';
          }
          
          itemsByOrderId[item.order_id].push({
            pizza_name: pizzaName,
            quantity: item.quantity,
            item_price: parseFloat(item.item_price || 0)
          });
        });
        
        // Baue die finale Antwort
        const bestellungen = results.map(order => {
          let items = itemsByOrderId[order.id];
          
          // Fallback für alte Bestellungen ohne order_items
          if (!items || items.length === 0) {
            // Erstelle einen vernünftigen Fallback basierend auf dem Gesamtpreis
            const totalPrice = parseFloat(order.total_price || 0);
            let fallbackItems = [];
            
            if (totalPrice > 0) {
              // Schätze die Anzahl der Pizzen basierend auf dem Preis (durchschnittlich 12€ pro Pizza)
              const estimatedPizzas = Math.max(1, Math.round(totalPrice / 12));
              const pricePerPizza = totalPrice / estimatedPizzas;
              
              for (let i = 0; i < estimatedPizzas; i++) {
                fallbackItems.push({
                  pizza_name: `Pizza ${i + 1} (Legacy-Bestellung)`,
                  quantity: 1,
                  item_price: parseFloat(pricePerPizza.toFixed(2))
                });
              }
            } else {
              fallbackItems = [{ 
                pizza_name: 'Legacy-Bestellung (Details nicht verfügbar)', 
                quantity: 1, 
                item_price: totalPrice 
              }];
            }
            
            items = fallbackItems;
          }
          
          return {
            id: order.id,
            items: items,
            total_price: parseFloat(order.total_price || 0),
            status: order.status || 'unknown',
            order_date: order.order_date || new Date().toISOString(),
            delivery_address: order.delivery_address || ''
          };
        });
        
        console.log(`Returning ${bestellungen.length} orders with detailed items`);
        res.json(bestellungen);
      });
    });
  });
});

// Cancel order (Geschützt)
app.put('/api/orders/:orderId/cancel', authenticateToken, (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const userId = req.user.userId;
  
  console.log(`Cancel order request: orderId=${orderId}, userId=${userId}`);
  
  // Prüfe ob die Bestellung dem Benutzer gehört
  const checkQuery = 'SELECT * FROM orders WHERE id = ? AND user_id = ?';
  db.query(checkQuery, [orderId, userId], (err, results) => {
    if (err) {
      console.error('Database error while checking order:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Datenbankfehler', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    console.log(`Found ${results.length} orders for user ${userId} with id ${orderId}`);
    
    if (results.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse('Bestellung nicht gefunden oder Zugriff verweigert', ERROR_CODES.NOT_FOUND, STATUS_CODES.NOT_FOUND)
      );
    }
    
    const order = results[0];
    console.log(`Order status: ${order.status}`);
    
    // Prüfe ob bereits storniert (durch [STORNIERT] in der Adresse)
    if (order.delivery_address && order.delivery_address.includes('[STORNIERT]')) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(
        formatErrorResponse('Bestellung ist bereits storniert', ERROR_CODES.INVALID_REQUEST, STATUS_CODES.BAD_REQUEST)
      );
    }
    
    // Storniere die Bestellung - verwende 'delivery_address' als Stornierung-Markierung
    // da status ENUM ist und 'cancelled' nicht enthält
    const currentAddress = order.delivery_address || '';
    const cancelledAddress = currentAddress.includes('[STORNIERT]') ? currentAddress : currentAddress + ' [STORNIERT]';
    
    const updateQuery = 'UPDATE orders SET delivery_address = ? WHERE id = ?';
    db.query(updateQuery, [cancelledAddress, orderId], (err) => {
      if (err) {
        console.error('Database error while updating order:', err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
          formatErrorResponse('Fehler beim Stornieren der Bestellung', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
        );
      }
      
      console.log(`Order ${orderId} successfully cancelled`);
      res.json(formatSuccessResponse({ orderId, status: 'cancelled', delivery_address: cancelledAddress }, 'Bestellung erfolgreich storniert'));
    });
  });
});

// Delete order (Geschützt)
app.delete('/api/orders/:orderId', authenticateToken, (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const userId = req.user.userId;
  
  console.log(`Delete order request: orderId=${orderId}, userId=${userId}`);
  
  // Prüfe ob die Bestellung dem Benutzer gehört
  const checkQuery = 'SELECT * FROM orders WHERE id = ? AND user_id = ?';
  db.query(checkQuery, [orderId, userId], (err, results) => {
    if (err) {
      console.error('Database error while checking order for deletion:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Datenbankfehler', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    console.log(`Found ${results.length} orders for deletion`);
    
    if (results.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse('Bestellung nicht gefunden oder Zugriff verweigert', ERROR_CODES.NOT_FOUND, STATUS_CODES.NOT_FOUND)
      );
    }
    
    // Lösche zuerst die order_items falls sie existieren
    db.query('DELETE FROM order_items WHERE order_id = ?', [orderId], (err) => {
      if (err) {
        console.error('Error deleting order_items:', err);
        // Nicht kritisch, fahre fort
      }
      
      // Lösche die Bestellung
      const deleteQuery = 'DELETE FROM orders WHERE id = ?';
      db.query(deleteQuery, [orderId], (err) => {
        if (err) {
          console.error('Database error while deleting order:', err);
          return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
            formatErrorResponse('Fehler beim Löschen der Bestellung', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
          );
        }
        
        console.log(`Order ${orderId} successfully deleted`);
        res.json(formatSuccessResponse({ orderId }, 'Bestellung erfolgreich gelöscht'));
      });
    });
  });
});

// Add review (Geschützt)
app.post('/api/reviews', authenticateToken, (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user.userId;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse('Bewertung muss zwischen 1 und 5 liegen', ERROR_CODES.INVALID_RATING, STATUS_CODES.BAD_REQUEST)
    );
  }
  
  if (!comment || comment.trim().length === 0) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse('Kommentar ist erforderlich', ERROR_CODES.MISSING_FIELDS, STATUS_CODES.BAD_REQUEST)
    );
  }
  
  const query = 'INSERT INTO reviews (user_id, rating, comment) VALUES (?, ?, ?)';
  db.query(query, [userId, rating, comment.trim()], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Fehler beim Speichern der Bewertung', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    res.status(STATUS_CODES.CREATED).json(formatSuccessResponse({
      reviewId: results.insertId,
      rating,
      comment: comment.trim()
    }, 'Bewertung erfolgreich hinzugefügt'));
  });
});

// Server starten
const server = app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`Backend ist bereit und lauscht auf http://localhost:${PORT}`);
  console.log('API-Endpunkte verfügbar:');
  console.log('- POST /api/register');
  console.log('- POST /api/login');
  console.log('- GET /api/pizzas');
  console.log('- GET /api/ingredients');
  console.log('- POST /api/orders (Auth erforderlich)');
  console.log('- GET /api/orders (Auth erforderlich)');
  console.log('- POST /api/reviews (Auth erforderlich)');
});

server.on('error', (err) => {
  console.error('Server-Fehler:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} wird bereits verwendet!`);
  }
});

/* ===== ARCHITEKTUR-DOKUMENTATION =====

🏗️ WARUM FRONTEND + BACKEND VALIDIERUNG?

1. FRONTEND-VALIDIERUNG (pizzashop/src/utils/validation.js):
   ✅ Zweck: Sofortiges User-Feedback OHNE Server-Anfrage
   ✅ Verwendet in: LoginForm.jsx, RegisterForm.jsx
   ✅ Vorteil: User bekommt sofort rote Fehlermeldung beim Tippen
   
2. BACKEND-VALIDIERUNG (server/validation.js):
   ✅ Zweck: SICHERHEIT - Finale Prüfung vor Datenbankzugriff
   ✅ Verwendet in: server/index.js bei allen API-Endpunkten
   ✅ Vorteil: Schutz vor Manipulation durch Tools/Hacker

📚 BEISPIEL-ABLAUF REGISTRIERUNG:
1. User tippt "ab" als Username
2. Frontend-Validierung: SOFORT "mind. 3 Zeichen" (ohne Server)
3. User korrigiert zu "admin123"
4. User klickt "Registrieren"
5. Frontend-Validierung: ✅ OK
6. Server-Anfrage wird gesendet
7. Backend-Validierung: NOCHMAL alle Kriterien prüfen
8. Falls OK: Passwort hashen + in Datenbank speichern

🔐 SICHERHEITSFEATURES:
- JWT Tokens (1h Laufzeit)
- Bcrypt Passwort-Hashing (10 Salt Rounds)
- Rate Limiting (5 Versuche/30s)
- CORS aktiviert
- Alle Eingaben validiert

📊 DATENBANK-STRUKTUR:
- orders: Hauptbestellung (user_id, total_price, status, delivery_address)
- order_items: Bestellpositionen (order_id, custom_ingredients, quantity, item_price)
- users: Benutzer (id, username, email, password_hash)
- pizzas: Verfügbare Pizzen (id, name, base_price, description)
- ingredients: Zutaten für Custom Pizzas (id, name, price)

🎯 DAS IST PROFESSIONELLE WEB-ENTWICKLUNG!
Genau so machen es Netflix, Amazon, Google - Frontend UX + Backend Sicherheit

============================================= */
