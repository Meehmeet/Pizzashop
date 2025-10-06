// ===== ADMIN-PANEL DATABASE CHECK =====
// Prüft ob die Datenbank für das Admin-Panel bereit ist

const mysql = require('mysql2');
require('dotenv').config();

// Datenbankverbindung
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'pizzashop'
});



function checkDatabaseExtensions() {
  console.log('\n🗄️ Prüfe Datenbank-Erweiterungen...');
  
  // Prüfe ob rejection_reason Spalte existiert
  const checkColumnQuery = "SHOW COLUMNS FROM orders LIKE 'rejection_reason'";
  db.query(checkColumnQuery, (err, results) => {
    if (err) {
      console.error('❌ Fehler beim Prüfen der Spalten:', err);
      return;
    }
    
    if (results.length === 0) {
      console.log('❌ DATENBANK NICHT ERWEITERT!');
      console.log('📝 Führen Sie diese SQL-Befehle aus:');
      console.log('');
      console.log("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'accepted', 'preparing', 'ready', 'delivered', 'rejected') DEFAULT 'pending';");
      console.log("ALTER TABLE orders ADD COLUMN rejection_reason TEXT NULL;");
      console.log("ALTER TABLE orders ADD COLUMN status_updated_at TIMESTAMP NULL;");
      console.log("CREATE INDEX idx_orders_status ON orders(status);");
      console.log("CREATE INDEX idx_orders_date ON orders(order_date);");
    } else {
      console.log('✅ Datenbank-Erweiterungen gefunden');
      console.log('🎉 ADMIN-PANEL IST BEREIT!');
      console.log('');
      console.log('🚀 Starten Sie das Admin-Panel:');
      console.log('   cd backend-panel');
      console.log('   npm run dev');
      console.log('');

    }
    
    db.end();
  });
}

// Verbindung testen
db.connect((err) => {
  if (err) {
    console.error('❌ Datenbankverbindung fehlgeschlagen:', err);
    console.log('� Prüfen Sie Ihre .env Datei:');
    console.log('   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    return;
  }
  
  console.log('✅ Mit Datenbank verbunden');
  checkDatabaseExtensions();
});

console.log('🛠️ Admin-Panel Setup-Checker');