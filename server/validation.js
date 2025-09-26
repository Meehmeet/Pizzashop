// ===== BACKEND VALIDIERUNG =====
// Zweck: SICHERHEIT - Finale Prüfung aller Daten vor Datenbankzugriff
// Arbeitet zusammen mit Frontend-Validierung für beste UX + Sicherheit

// Externe Validierungs-Bibliothek für robuste Prüfungen
const validator = require('validator');

// ===== KONSTANTEN FÜR BACKEND =====
// Diese müssen mit Frontend-Konstanten synchron bleiben!

// HTTP Status Codes (identisch mit Frontend)
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

// Fehlercodes für bessere Fehlerbehandlung (identisch mit Frontend)
const ERROR_CODES = {
  // Validierungsfehler
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  INVALID_USERNAME: 'INVALID_USERNAME',
  MISSING_FIELDS: 'MISSING_FIELDS',
  
  // Authentication Fehler
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  ACCESS_DENIED: 'ACCESS_DENIED',
  
  // Datenbank Fehler
  USER_EXISTS: 'USER_EXISTS',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  USERNAME_EXISTS: 'USERNAME_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  
  // Rate Limiting
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  
  // Server Fehler
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// ===== BACKEND VALIDIERUNGS-FUNKTIONEN =====
// Diese sind SICHERHEITSKRITISCH - prüfen Daten vor Datenbankzugriff

/**
 * E-Mail Validierung (Backend) - Finale Sicherheitsprüfung
 * Verwendet 'validator' Library für robuste Validierung
 * @param {string} email - Die zu prüfende E-Mail
 * @returns {object} - {valid: boolean, error?: string, code?: string}
 */
const validateEmail = (email) => {
  if (!email) {
    return { valid: false, error: 'E-Mail ist erforderlich', code: ERROR_CODES.MISSING_FIELDS };
  }
  
  if (!validator.isEmail(email)) {
    return { valid: false, error: 'Ungültige E-Mail Adresse', code: ERROR_CODES.INVALID_EMAIL };
  }
  
  if (email.length > 254) {
    return { valid: false, error: 'E-Mail Adresse ist zu lang (max. 254 Zeichen)', code: ERROR_CODES.INVALID_EMAIL };
  }
  
  return { valid: true };
};

/**
 * Passwort Validierung (Backend) - STRENGERE Prüfung als Frontend
 * Sammelt ALLE Fehler für bessere Rückmeldung
 * @param {string} password - Das zu prüfende Passwort
 * @returns {object} - {valid: boolean, error?: string, code?: string}
 */
const validatePassword = (password) => {
  if (!password) {
    return { valid: false, error: 'Passwort ist erforderlich', code: ERROR_CODES.MISSING_FIELDS };
  }
  
  const errors = [];
  
  // Prüfe alle Kriterien und sammle Fehler
  if (password.length < 6) {
    errors.push('mindestens 6 Zeichen');
  }
  
  if (password.length > 128) {
    errors.push('maximal 128 Zeichen');
  }
  
  if (!/\d/.test(password)) {
    errors.push('mindestens eine Zahl (0-9)');
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('mindestens einen Buchstaben (a-z, A-Z)');
  }
  
  // Wenn Fehler vorhanden, erstelle eine vollständige Fehlermeldung
  if (errors.length > 0) {
    const errorMessage = `Passwort muss haben: ${errors.join(', ')}`;
    return { valid: false, error: errorMessage, code: ERROR_CODES.INVALID_PASSWORD };
  }
  
  return { valid: true };
};

/**
 * Benutzername Validierung (Backend) - Finale Sicherheitsprüfung
 * @param {string} username - Der zu prüfende Benutzername
 * @returns {object} - {valid: boolean, error?: string, code?: string}
 */
const validateUsername = (username) => {
  if (!username) {
    return { valid: false, error: 'Benutzername ist erforderlich', code: ERROR_CODES.MISSING_FIELDS };
  }
  
  if (username.length < 3) {
    return { valid: false, error: 'Benutzername muss mindestens 3 Zeichen lang sein', code: ERROR_CODES.INVALID_USERNAME };
  }
  
  if (username.length > 50) {
    return { valid: false, error: 'Benutzername ist zu lang (max. 50 Zeichen)', code: ERROR_CODES.INVALID_USERNAME };
  }
  
  // Nur Buchstaben, Zahlen und Unterstriche erlaubt
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten', code: ERROR_CODES.INVALID_USERNAME };
  }
  
  return { valid: true };
};

/**
 * Komplette Registrierungs-Validierung (Backend)
 * FINALE SICHERHEITSPRÜFUNG vor Datenbankzugriff
 * @param {object} userData - {username, email, password}
 * @returns {object} - {valid: boolean, error?: string, code?: string}
 */
const validateRegistration = (userData) => {
  const { username, email, password } = userData;
  
  // Username validieren
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return usernameValidation;
  }
  
  // Email validieren
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return emailValidation;
  }
  
  // Passwort validieren
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return passwordValidation;
  }
  
  return { valid: true };
};

/**
 * Login-Validierung (Backend) - Prüft Anmeldedaten vor Authentifizierung
 * @param {object} loginData - {email, password}
 * @returns {object} - {valid: boolean, error?: string, code?: string}
 */
const validateLogin = (loginData) => {
  const { email, password } = loginData;
  
  // Email validieren
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return emailValidation;
  }
  
  // Passwort prüfen (nur ob vorhanden)
  if (!password) {
    return { valid: false, error: 'Passwort ist erforderlich', code: ERROR_CODES.MISSING_FIELDS };
  }
  
  return { valid: true };
};

// ===== ANTWORT-FORMATIERUNG =====
// Standardisierte API-Antworten für konsistente Frontend-Integration

/**
 * Formatiert Fehler-Antworten einheitlich
 * @param {string} message - Fehlermeldung
 * @param {string} code - Fehlercode
 * @param {number} status - HTTP Status Code
 * @returns {object} - Standardisierte Fehler-Antwort
 */
const formatErrorResponse = (error, code = ERROR_CODES.INTERNAL_ERROR, statusCode = STATUS_CODES.BAD_REQUEST) => {
  return {
    success: false,
    error: error,
    errorCode: code,
    timestamp: new Date().toISOString()
  };
};

/**
 * Formatiert Erfolgs-Antworten einheitlich
 * @param {*} data - Die zurückzugebenden Daten
 * @param {string} message - Erfolgsmeldung
 * @returns {object} - Standardisierte Erfolgs-Antwort
 */
const formatSuccessResponse = (data, message = 'Erfolgreich') => {
  return {
    success: true,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
};

// ===== EXPORT FÜR SERVER =====
// Diese Funktionen werden vom Haupt-Server (index.js) verwendet
module.exports = {
  STATUS_CODES,
  ERROR_CODES,
  validateEmail,
  validatePassword,
  validateUsername,
  validateRegistration,
  validateLogin,
  formatErrorResponse,
  formatSuccessResponse
};