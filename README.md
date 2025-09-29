# 🍕 Pizzashop - E-Commerce Web-App

Eine vollständige Pizza-Bestellungs-App mit React Frontend und Node.js Backend.

## 🚀 Schnellstart

### 1. Frontend starten (React)
```bash
cd pizzashop
npm install
npm run dev
```
→ Frontend läuft auf: `http://localhost:5173`

### 2. Backend starten (Node.js Server)  
```bash
cd server
npm install
npm start
```
→ Backend läuft auf: `http://localhost:3001`

### 3. Datenbank einrichten (MySQL)
- MySQL Server installieren und starten
- Neue Datenbank erstellen: `pizzashop`
- SQL-Dump importieren: `server/pizzashop.sql`

```sql
CREATE DATABASE pizzashop;
USE pizzashop;
SOURCE pizzashop.sql;
```

### 4. Backend-Konfiguration
Datei `server/.env` anpassen:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=dein-mysql-passwort
DB_NAME=pizzashop
```

## 📁 Projektstruktur
```
├── pizzashop/          # React Frontend
│   ├── src/
│   └── package.json
├── server/             # Node.js Backend
│   ├── index.js
│   ├── pizzashop.sql   # Datenbank-Dump
│   └── .env
└── README.md
```

## ✨ Features
- 👤 Benutzer-Registrierung & Login
- 🍕 Pizza-Menü mit Custom-Pizza-Builder
- 🛒 Warenkorb-System
- 📦 Bestellverfolgung & -verwaltung
- ⭐ Bewertungs-System
- 🔒 JWT-Authentifizierung

## 🛠️ Technologien
- **Frontend:** React, Vite, CSS
- **Backend:** Node.js, Express, JWT
- **Datenbank:** MySQL
- **Sicherheit:** Bcrypt, Rate Limiting