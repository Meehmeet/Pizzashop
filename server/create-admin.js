/**
 * ADMIN-PANEL DATABASE CHECK
 * Prüft ob die Datenbank für das Admin-Panel bereit ist
 * Zeigt benötigte SQL-Befehle an, falls Erweiterungen fehlen
 */

const mysql = require('mysql2');
require('dotenv').config();

// Datenbankverbindung mit Umgebungsvariablen
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'pizzashop'
});

/**
 * Prüft ob alle benötigten Datenbank-Erweiterungen vorhanden sind
 * Benötigt: rejection_reason Spalte in orders Tabelle
 */
function checkDatabaseExtensions() {
  console.log('\n[INFO] Prüfe Datenbank-Erweiterungen...');
  
  // Prüfe ob rejection_reason Spalte existiert
  const checkColumnQuery = "SHOW COLUMNS FROM orders LIKE 'rejection_reason'";
  db.query(checkColumnQuery, (err, results) => {
    if (err) {
      console.error('[ERROR] Fehler beim Prüfen der Spalten:', err);
      return;
    }
    
    if (results.length === 0) {
      console.log('[WARNING] DATENBANK NICHT ERWEITERT!');
      console.log('[INFO] Führen Sie diese SQL-Befehle aus:');
      console.log('');
      console.log("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'accepted', 'preparing', 'ready', 'delivered', 'rejected') DEFAULT 'pending';");
      console.log("ALTER TABLE orders ADD COLUMN rejection_reason TEXT NULL;");
      console.log("ALTER TABLE orders ADD COLUMN status_updated_at TIMESTAMP NULL;");
      console.log("CREATE INDEX idx_orders_status ON orders(status);");
      console.log("CREATE INDEX idx_orders_date ON orders(order_date);");
    } else {
      console.log('[SUCCESS] Datenbank-Erweiterungen gefunden');
      console.log('[SUCCESS] ADMIN-PANEL IST BEREIT!');
      console.log('');
      console.log('[INFO] Starten Sie das Admin-Panel:');
      console.log('   cd backend-panel');
      console.log('   npm run dev');
      console.log('');
    }
    
    db.end();
  });
}

// Verbindung testen und Prüfung starten
db.connect((err) => {
  if (err) {
    console.error('[ERROR] Datenbankverbindung fehlgeschlagen:', err);
    console.log('[INFO] Prüfen Sie Ihre .env Datei:');
    console.log('   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    return;
  }
  
  console.log('[SUCCESS] Mit Datenbank verbunden');
  checkDatabaseExtensions();
});

console.log('Admin-Panel Setup-Checker gestartet...');
