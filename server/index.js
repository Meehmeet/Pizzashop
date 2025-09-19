const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// JWT Secret (sollte in .env stehen)
const JWT_SECRET = process.env.JWT_SECRET || 'dein-super-geheimer-schluessel-hier';

// Rate Limiting für Login-Versuche
const loginLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 Sekunden
  max: 5, // Maximum 5 Versuche pro 30 Sekunden
  message: {
    error: 'Zu viele Login-Versuche. Bitte warte 30 Sekunden und versuche es erneut.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Nur fehlgeschlagene Versuche zählen
  skipSuccessfulRequests: true
});

app.use(cors());
app.use(express.json());

// JWT Middleware für geschützte Routen
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access Token erforderlich' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Ungültiger oder abgelaufener Token' });
    }
    req.user = user;
    next();
  });
};

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.query(createUsersTable, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table ready');
    }
  });
});

app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
  }
  
  try {
    // Prüfe ob Email oder Username bereits existiert
    const checkQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
    db.query(checkQuery, [email, username], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Datenbankfehler' });
      }
      
      if (results.length > 0) {
        for (const user of results) {
          if (user.email === email) {
            return res.status(400).json({ error: 'Diese E-Mail Adresse wird bereits verwendet' });
          }
          if (user.username === username) {
            return res.status(400).json({ error: 'Dieser Nutzername existiert bereits' });
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
          return res.status(500).json({ error: 'Fehler beim Erstellen des Kontos' });
        }
        
        res.status(201).json({ 
          message: 'Konto erfolgreich erstellt',
          userId: results.insertId 
        });
      });
    });
  } catch (error) {
    console.error('Password hashing error:', error);
    return res.status(500).json({ error: 'Fehler beim Verarbeiten des Passworts' });
  }
});

app.post('/api/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email und Passwort sind erforderlich' });
  }
  
  try {
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Datenbankfehler' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ error: 'Email oder Passwort ist falsch' });
      }
      
      const user = results[0];
      
      // Vergleiche das eingegebene Passwort mit dem gehashten Passwort
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Email oder Passwort ist falsch' });
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
      
      // Login erfolgreich
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
    console.error('Password comparison error:', error);
    return res.status(500).json({ error: 'Fehler beim Verarbeiten der Anmeldung' });
  }
});

app.get('/api/users', (req, res) => {
  const query = 'SELECT id, username, email, created_at FROM users';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Datenbankfehler' });
    }
    res.json(results);
  });
});

app.get('/api/pizzas', (req, res) => {
  const query = `
    SELECT p.*, GROUP_CONCAT(i.name) as ingredients
    FROM pizzas p
    LEFT JOIN pizza_ingredients pi ON p.id = pi.pizza_id
    LEFT JOIN ingredients i ON pi.ingredient_id = i.id
    GROUP BY p.id
    ORDER BY p.id
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Datenbankfehler' });
    }
    
    const pizzas = results.map(pizza => ({
      ...pizza,
      ingredients: pizza.ingredients ? pizza.ingredients.split(',') : []
    }));
    
    res.json(pizzas);
  });
});

app.get('/api/ingredients', (req, res) => {
  const query = 'SELECT * FROM ingredients ORDER BY category, name';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Datenbankfehler' });
    }
    res.json(results);
  });
});

app.post('/api/orders', authenticateToken, (req, res) => {
  const { userId, items, deliveryAddress, totalPrice } = req.body;
  
  if (!userId || !items || !deliveryAddress || !totalPrice) {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
  }
  
  const orderQuery = 'INSERT INTO orders (user_id, total_price, delivery_address) VALUES (?, ?, ?)';
  db.query(orderQuery, [userId, totalPrice, deliveryAddress], (err, orderResult) => {
    if (err) {
      console.error('Database error:', err);
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({ error: 'Orders-Tabelle nicht gefunden. Bitte führe die SQL-Befehle aus.' });
      }
      return res.status(500).json({ error: 'Fehler beim Erstellen der Bestellung: ' + err.message });
    }
    
    const orderId = orderResult.insertId;
    
    const itemPromises = items.map(item => {
      return new Promise((resolve, reject) => {
        const customIngredients = item.customIngredients ? JSON.stringify(item.customIngredients) : null;
        const pizzaId = item.pizza.id === 'custom' ? null : item.pizza.id;
        const itemQuery = 'INSERT INTO order_items (order_id, pizza_id, custom_ingredients, quantity, item_price) VALUES (?, ?, ?, ?, ?)';
        
        db.query(itemQuery, [orderId, pizzaId, customIngredients, item.quantity, item.price], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
    
    Promise.all(itemPromises)
      .then(() => {
        res.status(201).json({ message: 'Bestellung erfolgreich erstellt', orderId });
      })
      .catch(err => {
        console.error('Error creating order items:', err);
        res.status(500).json({ error: 'Fehler beim Erstellen der Bestellpositionen: ' + err.message });
      });
  });
});

app.get('/api/orders/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  
  const query = `
    SELECT o.*, 
           GROUP_CONCAT(
             JSON_OBJECT(
               'quantity', oi.quantity,
               'pizza_name', COALESCE(p.name, 'Custom Pizza'),
               'item_price', oi.item_price
             )
           ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN pizzas p ON oi.pizza_id = p.id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.order_date DESC
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({ error: 'Tabellen nicht gefunden. Bitte führe die SQL-Befehle aus.' });
      }
      return res.status(500).json({ error: 'Datenbankfehler: ' + err.message });
    }
    
    const ordersWithItems = results.map(order => ({
      ...order,
      items: order.items ? JSON.parse(`[${order.items}]`) : []
    }));
    
    res.json(ordersWithItems);
  });
});

app.put('/api/orders/:orderId/cancel', authenticateToken, (req, res) => {
  const orderId = req.params.orderId;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID ist erforderlich' });
  }
  
  const checkQuery = 'SELECT status, user_id FROM orders WHERE id = ?';
  db.query(checkQuery, [orderId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Datenbankfehler' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Bestellung nicht gefunden' });
    }
    
    const order = results[0];
    
    if (order.user_id !== userId) {
      return res.status(403).json({ error: 'Keine Berechtigung für diese Bestellung' });
    }
    
    if (order.status === 'delivered') {
      return res.status(400).json({ error: 'Gelieferte Bestellungen können nicht storniert werden' });
    }
    
    if (order.delivery_address && order.delivery_address.includes('[STORNIERT]')) {
      return res.status(400).json({ error: 'Bestellung ist bereits storniert' });
    }
    
    const updateQuery = 'UPDATE orders SET delivery_address = CONCAT(delivery_address, " [STORNIERT]") WHERE id = ?';
    db.query(updateQuery, [orderId], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Fehler beim Stornieren der Bestellung: ' + err.message });
      }
      
      res.json({ message: 'Bestellung erfolgreich storniert' });
    });
  });
});

app.delete('/api/orders/:orderId', authenticateToken, (req, res) => {
  const orderId = req.params.orderId;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID ist erforderlich' });
  }
  
  const checkQuery = 'SELECT status, user_id, delivery_address FROM orders WHERE id = ?';
  db.query(checkQuery, [orderId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Datenbankfehler' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Bestellung nicht gefunden' });
    }
    
    const order = results[0];
    
    if (order.user_id !== userId) {
      return res.status(403).json({ error: 'Keine Berechtigung für diese Bestellung' });
    }
    
    const isCancelled = order.status === 'cancelled' || order.delivery_address?.includes('[STORNIERT]');
    if (!isCancelled) {
      return res.status(400).json({ error: 'Nur stornierte Bestellungen können gelöscht werden' });
    }
    
    const deleteItemsQuery = 'DELETE FROM order_items WHERE order_id = ?';
    db.query(deleteItemsQuery, [orderId], (err) => {
      if (err) {
        console.error('Database error deleting items:', err);
        return res.status(500).json({ error: 'Fehler beim Löschen der Bestellpositionen' });
      }
      
      const deleteOrderQuery = 'DELETE FROM orders WHERE id = ?';
      db.query(deleteOrderQuery, [orderId], (err) => {
        if (err) {
          console.error('Database error deleting order:', err);
          return res.status(500).json({ error: 'Fehler beim Löschen der Bestellung' });
        }
        
        res.json({ message: 'Bestellung erfolgreich gelöscht' });
      });
    });
  });
});

app.post('/api/reviews', authenticateToken, (req, res) => {
  const { userId, rating, comment } = req.body;
  
  if (!userId || !rating || !comment) {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Bewertung muss zwischen 1 und 5 Sternen liegen' });
  }
  
  const query = 'INSERT INTO reviews (user_id, rating, comment) VALUES (?, ?, ?)';
  db.query(query, [userId, rating, comment], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Fehler beim Erstellen der Bewertung' });
    }
    
    res.status(201).json({ 
      message: 'Bewertung erfolgreich erstellt',
      reviewId: results.insertId 
    });
  });
});

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
      return res.status(500).json({ error: 'Datenbankfehler' });
    }
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
