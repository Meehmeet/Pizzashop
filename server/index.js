// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                     PIZZASHOP BACKEND SERVER                              ║
// ║                                                                           ║
// ║  Admin Credentials: root@gmail.com / root1234!                           ║
// ║                                                                           ║
// ║  Funktionen:                                                              ║
// ║  • Benutzer-Authentifizierung (JWT)                                      ║
// ║  • Bestellverwaltung                                                      ║
// ║  • Pizza-Katalog                                                          ║
// ║  • Bewertungssystem                                                       ║
// ║  • Admin-Panel Backend                                                    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { 
  STATUS_CODES, 
  ERROR_CODES, 
  validateRegistration,
  validateLogin,
  formatErrorResponse,
  formatSuccessResponse
} = require('./validation');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dein-super-geheimer-schluessel-hier';

// ═══════════════════════════════════════════════════════════════════════════
// SICHERHEITSKONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Rate Limiting: Schutz vor Brute-Force-Angriffen
const loginLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 5,
  message: formatErrorResponse(
    'Zu viele Login-Versuche. Bitte warte 30 Sekunden.',
    ERROR_CODES.TOO_MANY_REQUESTS
  ),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  statusCode: STATUS_CODES.TOO_MANY_REQUESTS
});

app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE: AUTHENTIFIZIERUNG
// ═══════════════════════════════════════════════════════════════════════════

/**
 * JWT Token Authentifizierung
 * Schützt private Routen vor unbefugtem Zugriff
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
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

// ═══════════════════════════════════════════════════════════════════════════
// DATENBANK-KONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// DATENBANK-KONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL Verbindungsfehler:', err);
    return;
  }
  
  console.log('✅ MySQL Datenbank verbunden');
  console.log('📊 Verwende existierende Datenbank-Tabellen');
  
  db.query('SHOW TABLES', (err, results) => {
    if (err) {
      console.error('❌ Fehler beim Prüfen der Tabellen:', err);
    } else {
      const tables = results.map(row => Object.values(row)[0]);
      console.log('📋 Verfügbare Tabellen:', tables.join(', '));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES: AUTHENTIFIZIERUNG
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/register
 * Registriert einen neuen Benutzer
 */
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
        
        res.status(STATUS_CODES.CREATED).json(
          formatSuccessResponse({
            id: results.insertId,
            username: username,
            email: email
          }, 'Konto erfolgreich erstellt')
        );
      });
    });
  } catch (error) {
    console.error('❌ Passwort-Hashing Fehler:', error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Fehler beim Verarbeiten des Passworts', ERROR_CODES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
    );
  }
});

/**
 * POST /api/login
 * Benutzer-Anmeldung mit Rate Limiting
 */
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

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES: ÖFFENTLICH (Keine Authentifizierung erforderlich)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/pizzas
 * Gibt alle verfügbaren Pizzas zurück
 */
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
      base_price: parseFloat(pizza.base_price),
      preis: parseFloat(pizza.base_price),
      image: mapPizzaImage(pizza.name),
      ingredients: pizza.description ? [pizza.description] : []
    }));
    
    res.json(pizzas);
  });
});

/**
 * Hilfsfunktion: Pizza-Bild Mapping
 * Mappt Pizzanamen zu lokalen Bilddateien
 */
function mapPizzaImage(pizzaName) {
  const name = pizzaName.toLowerCase();
  if (name.includes('margherita')) return 'pizza_magherita.png';
  if (name.includes('funghi')) return 'pizza_funghi.png';
  if (name.includes('hawaii')) return 'pizza_hawaii.png';
  if (name.includes('salami')) return 'pizza_salami.png';
  if (name.includes('döner') || name.includes('doner')) return 'pizza_doner.png';
  return 'pizza_custom.png';
}

/**
 * GET /api/ingredients
 * Gibt alle verfügbaren Zutaten zurück
 */
app.get('/api/ingredients', (req, res) => {
  const query = 'SELECT * FROM ingredients';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error loading ingredients:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Fehler beim Laden der Zutaten', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    const ingredients = results.map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name,
      price: parseFloat(ingredient.price),
      preis: parseFloat(ingredient.price),
      category: ingredient.category
    }));
    
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

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES: GESCHÜTZT (JWT Authentifizierung erforderlich)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/orders
 * Erstellt eine neue Bestellung
 */
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

// ===== ADMIN PANEL ROUTEN =====
// Spezielle Routen für die Administrationsoberfläche

// Admin-Authentifizierungs-Middleware (vereinfacht)
const authenticateAdmin = (req, res, next) => {
  // Keine Token-Prüfung mehr - Admin-Panel ist frei zugänglich
  req.user = { userId: 13, email: 'root@gmail.com' }; // Fake Admin User
  next();
};

// Admin Login - speziell für root@gmail.com
app.post('/admin/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  
  // Nur root@gmail.com darf sich als Admin anmelden
  if (email !== 'root@gmail.com') {
    return res.status(STATUS_CODES.UNAUTHORIZED).json(
      formatErrorResponse('Keine Admin-Berechtigung', ERROR_CODES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED)
    );
  }
  
  // Prüfe Admin-Account in der Datenbank
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
        formatErrorResponse('Admin-Account nicht gefunden', ERROR_CODES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED)
      );
    }
    
    const user = results[0];
    
    // Passwort prüfen
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json(
        formatErrorResponse('Ungültiges Admin-Passwort', ERROR_CODES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED)
      );
    }
    
    // Admin-Token erstellen
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: true },
      JWT_SECRET,
      { expiresIn: '4h' } // Admin-Sessions länger gültig
    );
    
    res.json(formatSuccessResponse({ 
      token,
      admin: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    }, 'Admin erfolgreich angemeldet'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES: ADMIN PANEL (Keine Token-Prüfung für Entwicklung)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/stats
 * Dashboard-Statistiken für Admin-Panel
 */
app.get('/admin/stats', (req, res) => {
  // Komplexe Statistik-Abfrage
  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as new_users_30_days,
      (SELECT COUNT(*) FROM orders WHERE order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as orders_30_days,
      (SELECT COALESCE(SUM(quantity), 0) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as pizzas_sold_30_days,
      (SELECT COUNT(*) FROM users) as total_active_users,
      (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
      (SELECT COUNT(*) FROM reviews) as total_reviews
  `;
  
  db.query(statsQuery, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Fehler beim Laden der Statistiken', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    res.json(formatSuccessResponse(results[0], 'Statistiken erfolgreich geladen'));
  });
});

// Admin: Get all users
app.get('/admin/users', (req, res) => {
  const query = `
    SELECT id, username, email, created_at, 
           CASE WHEN email = 'root@gmail.com' THEN 'admin' ELSE 'user' END as role,
           TRUE as is_active
    FROM users 
    ORDER BY created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Fehler beim Laden der Benutzer', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    res.json(formatSuccessResponse(results, 'Benutzer erfolgreich geladen'));
  });
});

// Admin: Update user (username/email)
app.put('/admin/users/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const { username, email } = req.body;
  
  if (!username || !email || username.trim().length === 0 || email.trim().length === 0) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse('Benutzername und E-Mail sind erforderlich', ERROR_CODES.MISSING_FIELDS, STATUS_CODES.BAD_REQUEST)
    );
  }
  
  // Validiere E-Mail Format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse('Ungültiges E-Mail Format', ERROR_CODES.INVALID_EMAIL, STATUS_CODES.BAD_REQUEST)
    );
  }
  
  // Prüfe ob Benutzer existiert
  const checkQuery = 'SELECT email FROM users WHERE id = ?';
  db.query(checkQuery, [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse('Benutzer nicht gefunden', ERROR_CODES.NOT_FOUND, STATUS_CODES.NOT_FOUND)
      );
    }
    
    // Verhindere Änderung des Admin-Accounts
    if (results[0].email === 'root@gmail.com') {
      return res.status(STATUS_CODES.FORBIDDEN).json(
        formatErrorResponse('Admin-Account kann nicht bearbeitet werden', ERROR_CODES.FORBIDDEN, STATUS_CODES.FORBIDDEN)
      );
    }
    
    // Prüfe ob neue E-Mail bereits existiert (außer bei gleichem Benutzer)
    const emailCheckQuery = 'SELECT id FROM users WHERE email = ? AND id != ?';
    db.query(emailCheckQuery, [email, userId], (err, emailResults) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
          formatErrorResponse('Datenbankfehler', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
        );
      }
      
      if (emailResults.length > 0) {
        return res.status(STATUS_CODES.CONFLICT).json(
          formatErrorResponse('E-Mail bereits vergeben', ERROR_CODES.EMAIL_EXISTS, STATUS_CODES.CONFLICT)
        );
      }
      
      // Update Benutzer
      const updateQuery = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
      db.query(updateQuery, [username.trim(), email.trim(), userId], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
            formatErrorResponse('Fehler beim Aktualisieren des Benutzers', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
          );
        }
        
        res.json(formatSuccessResponse(null, 'Benutzer erfolgreich aktualisiert'));
      });
    });
  });
});

// Admin: Delete user
app.delete('/admin/users/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const { reason } = req.body;
  
  if (!reason || reason.trim().length === 0) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse('Löschungsgrund erforderlich', ERROR_CODES.MISSING_FIELDS, STATUS_CODES.BAD_REQUEST)
    );
  }
  
  // Verhindere Löschung des Admin-Accounts
  const checkQuery = 'SELECT email FROM users WHERE id = ?';
  db.query(checkQuery, [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse('Benutzer nicht gefunden', ERROR_CODES.NOT_FOUND, STATUS_CODES.NOT_FOUND)
      );
    }
    
    if (results[0].email === 'root@gmail.com') {
      return res.status(STATUS_CODES.FORBIDDEN).json(
        formatErrorResponse('Admin-Account kann nicht gelöscht werden', ERROR_CODES.FORBIDDEN, STATUS_CODES.FORBIDDEN)
      );
    }
    
    // Lösche Benutzer und alle zugehörigen Daten (CASCADE sollte das automatisch machen)
    const deleteQuery = 'DELETE FROM users WHERE id = ?';
    db.query(deleteQuery, [userId], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
          formatErrorResponse('Fehler beim Löschen des Benutzers', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
        );
      }
      
      res.json(formatSuccessResponse({ userId, reason }, 'Benutzer erfolgreich gelöscht'));
    });
  });
});

// Admin: Get all orders
app.get('/admin/orders', (req, res) => {
  const query = `
    SELECT o.*, u.username as customer_username
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.order_date DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Fehler beim Laden der Bestellungen', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    res.json(formatSuccessResponse(results, 'Bestellungen erfolgreich geladen'));
  });
});

// Admin: Accept order
app.put('/admin/orders/:orderId/accept', (req, res) => {
  const orderId = parseInt(req.params.orderId);
  
  const updateQuery = `
    UPDATE orders 
    SET status = 'accepted', status_updated_at = NOW() 
    WHERE id = ? AND status = 'pending'
  `;
  
  db.query(updateQuery, [orderId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Fehler beim Akzeptieren der Bestellung', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    if (results.affectedRows === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse('Bestellung nicht gefunden oder bereits bearbeitet', ERROR_CODES.NOT_FOUND, STATUS_CODES.NOT_FOUND)
      );
    }
    
    res.json(formatSuccessResponse({ orderId }, 'Bestellung erfolgreich akzeptiert'));
  });
});

// Admin: Reject order
app.put('/admin/orders/:orderId/reject', (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const { reason } = req.body;
  
  if (!reason || reason.trim().length === 0) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse('Ablehnungsgrund erforderlich', ERROR_CODES.MISSING_FIELDS, STATUS_CODES.BAD_REQUEST)
    );
  }
  
  const updateQuery = `
    UPDATE orders 
    SET status = 'rejected', rejection_reason = ?, status_updated_at = NOW() 
    WHERE id = ? AND status = 'pending'
  `;
  
  db.query(updateQuery, [reason.trim(), orderId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Fehler beim Ablehnen der Bestellung', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    if (results.affectedRows === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse('Bestellung nicht gefunden oder bereits bearbeitet', ERROR_CODES.NOT_FOUND, STATUS_CODES.NOT_FOUND)
      );
    }
    
    res.json(formatSuccessResponse({ orderId, reason }, 'Bestellung erfolgreich abgelehnt'));
  });
});

// Admin: Get all reviews
app.get('/admin/reviews', (req, res) => {
  const query = `
    SELECT r.*, u.username as customer_username,
           FALSE as is_deleted
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Fehler beim Laden der Bewertungen', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    res.json(formatSuccessResponse(results, 'Bewertungen erfolgreich geladen'));
  });
});

// Admin: Delete review
app.delete('/admin/reviews/:reviewId', (req, res) => {
  const reviewId = parseInt(req.params.reviewId);
  const { reason } = req.body;
  
  if (!reason || reason.trim().length === 0) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse('Löschungsgrund erforderlich', ERROR_CODES.MISSING_FIELDS, STATUS_CODES.BAD_REQUEST)
    );
  }
  
  // Lösche Bewertung direkt
  const deleteQuery = 'DELETE FROM reviews WHERE id = ?';
  db.query(deleteQuery, [reviewId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('Fehler beim Löschen der Bewertung', ERROR_CODES.DATABASE_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR)
      );
    }
    
    if (results.affectedRows === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse('Bewertung nicht gefunden', ERROR_CODES.NOT_FOUND, STATUS_CODES.NOT_FOUND)
      );
    }
    
    res.json(formatSuccessResponse({ reviewId, reason }, 'Bewertung erfolgreich gelöscht'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVER START
// ═══════════════════════════════════════════════════════════════════════════

const server = app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         🍕 PIZZASHOP BACKEND SERVER GESTARTET 🍕          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  console.log(`🚀 Server läuft auf: http://localhost:${PORT}`);
  console.log(`⏰ Gestartet am: ${new Date().toLocaleString('de-DE')}\n`);
  
  console.log('📡 VERFÜGBARE API-ENDPUNKTE:\n');
  
  console.log('🔓 ÖFFENTLICH:');
  console.log('   • POST   /api/register          - Neues Konto erstellen');
  console.log('   • POST   /api/login             - Anmelden');
  console.log('   • GET    /api/pizzas            - Alle Pizzas');
  console.log('   • GET    /api/ingredients       - Alle Zutaten\n');
  
  console.log('🔒 GESCHÜTZT (JWT erforderlich):');
  console.log('   • POST   /api/orders            - Bestellung aufgeben');
  console.log('   • GET    /api/orders            - Eigene Bestellungen');
  console.log('   • POST   /api/reviews           - Bewertung abgeben\n');
  
  console.log('� ADMIN-PANEL (root@gmail.com):');
  console.log('   • GET    /admin/stats           - Dashboard-Statistiken');
  console.log('   • GET    /admin/users           - Alle Benutzer');
  console.log('   • PUT    /admin/users/:id       - Benutzer bearbeiten');
  console.log('   • DELETE /admin/users/:id       - Benutzer löschen');
  console.log('   • GET    /admin/orders          - Alle Bestellungen');
  console.log('   • PUT    /admin/orders/:id/accept - Bestellung akzeptieren');
  console.log('   • PUT    /admin/orders/:id/reject - Bestellung ablehnen');
  console.log('   • GET    /admin/reviews         - Alle Bewertungen');
  console.log('   • DELETE /admin/reviews/:id     - Bewertung löschen\n');
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✨ Server bereit für Anfragen!\n');
});

server.on('error', (err) => {
  console.error('\n❌ SERVER-FEHLER:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`   Port ${PORT} wird bereits verwendet!`);
    console.error('   Lösung: Stoppe den anderen Prozess oder wähle einen anderen Port.\n');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 📚 ARCHITEKTUR-DOKUMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SICHERHEITSARCHITEKTUR: DUAL-VALIDIERUNG
 * 
 * Warum Frontend UND Backend Validierung?
 * 
 * 1️⃣ FRONTEND-VALIDIERUNG (pizzashop/src/utils/validation.js)
 *    ✨ Zweck: Sofortiges User-Feedback ohne Server-Anfrage
 *    📍 Verwendet in: LoginForm.jsx, RegisterForm.jsx
 *    ✅ Vorteil: Instant-Feedback beim Tippen
 * 
 * 2️⃣ BACKEND-VALIDIERUNG (server/validation.js)
 *    🔒 Zweck: Sicherheit - Finale Prüfung vor Datenbankzugriff
 *    📍 Verwendet in: Alle API-Endpunkte
 *    ✅ Vorteil: Schutz vor Manipulation
 * 
 * BEISPIEL-ABLAUF (Registrierung):
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 1. User tippt "ab" als Username                             │
 * │ 2. Frontend: ❌ SOFORT "mind. 3 Zeichen"                    │
 * │ 3. User korrigiert zu "admin123"                            │
 * │ 4. Frontend: ✅ OK → Button aktiviert                       │
 * │ 5. User klickt "Registrieren"                               │
 * │ 6. Backend: Nochmal alle Kriterien prüfen                   │
 * │ 7. Backend: ✅ OK → Passwort hashen → DB speichern          │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * SICHERHEITSFEATURES:
 * • JWT Tokens (1h Laufzeit)
 * • Bcrypt Passwort-Hashing (10 Salt Rounds)
 * • Rate Limiting (5 Versuche/30s)
 * • CORS aktiviert
 * • Input-Validierung (Frontend + Backend)
 * 
 * DATENBANK-STRUKTUR:
 * • users         - Benutzerkonten
 * • pizzas        - Verfügbare Pizzas
 * • ingredients   - Zutaten für Custom Pizzas
 * • orders        - Bestellungen (Haupttabelle)
 * • order_items   - Bestellpositionen (Details)
 * • reviews       - Kundenbewertungen
 * 
 * 🎯 PROFESSIONELLE WEB-ENTWICKLUNG
 * Diese Architektur nutzen auch: Netflix, Amazon, Google
 * Frontend UX + Backend Sicherheit = Best Practice
 */
