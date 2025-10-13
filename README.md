## Deployment mit Docker (Schulserver)

1) Erstelle im Projektroot eine Datei `.env` mit folgendem Inhalt:

```
JWT_SECRET=change_me_super_secret_jwt
DB_ROOT_PASSWORD=change_me_root
DB_NAME=pizzashop
DB_USER=pizza_user
DB_PASSWORD=change_me_user
```

2) Starte die Container:

```
docker compose up -d --build
```

3) Aufruf im Browser:

- App (Kunden-Frontend): http://<SERVER_IP>/
- Admin-Panel: http://<SERVER_IP>/admin/

Die API ist über `/api` (Kunden) und `/admin` (Admin-Endpunkte) erreichbar und wird durch Nginx an das Node-Backend weitergeleitet.

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