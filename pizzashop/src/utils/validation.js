// ===== FRONTEND VALIDIERUNG =====
// Zweck: Sofortiges Feedback für den User ohne Server-Anfrage
// Arbeitet zusammen mit Backend-Validierung für beste UX + Sicherheit

import { ERROR_CODES, STATUS_CODES } from './errorcode.js';

/**
 * Validiert E-Mail Adresse im Frontend
 * @param {string} email - Die zu prüfende E-Mail
 * @returns {object} - {valid: boolean, error?: string}
 */
export const validateEmail = (email) => {
  if (!email) {
    return { valid: false, error: 'E-Mail ist erforderlich' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Ungültige E-Mail Adresse' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'E-Mail Adresse ist zu lang (max. 254 Zeichen)' };
  }

  return { valid: true };
};

/**
 * Validiert Passwort - unterschiedlich für Login vs Registrierung
 * @param {string} password - Das zu prüfende Passwort
 * @param {boolean} isLogin - true = nur Existenz prüfen, false = alle Kriterien
 * @returns {object} - {valid: boolean, error?: string}
 */
export const validatePassword = (password, isLogin = false) => {
  if (!password) {
    return { valid: false, error: 'Passwort ist erforderlich' };
  }

  // Bei Login nur prüfen ob vorhanden (Backend macht die echte Prüfung)
  if (isLogin) {
    return { valid: true };
  }

  // Bei Registrierung alle Kriterien prüfen und sammeln (für bessere UX)
  const errors = [];

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
    return { valid: false, error: errorMessage };
  }

  return { valid: true };
};

/**
 * Validiert Benutzername für sofortiges Frontend-Feedback
 * @param {string} username - Der zu prüfende Benutzername
 * @returns {object} - {valid: boolean, error?: string}
 */
export const validateUsername = (username) => {
  if (!username) {
    return { valid: false, error: 'Benutzername ist erforderlich' };
  }

  if (username.length < 3) {
    return { valid: false, error: 'Benutzername muss mindestens 3 Zeichen lang sein' };
  }

  if (username.length > 50) {
    return { valid: false, error: 'Benutzername ist zu lang (max. 50 Zeichen)' };
  }

  // Nur Buchstaben, Zahlen und Unterstriche erlaubt
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten' };
  }

  return { valid: true };
};

/**
 * Komplette Registrierungs-Validierung (Frontend)
 * Prüft alle Felder und gibt den ERSTEN Fehler zurück
 * @param {object} userData - {username, email, password}
 * @returns {object} - {valid: boolean, error?: string}
 */
export const validateRegistration = (userData) => {
  const { username, email, password } = userData;

  // Username validieren (stoppt bei erstem Fehler)
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
  const passwordValidation = validatePassword(password, false);
  if (!passwordValidation.valid) {
    return passwordValidation;
  }

  return { valid: true };
};

/**
 * Login-Validierung (Frontend) - weniger streng als Registrierung
 * @param {object} loginData - {email, password}
 * @returns {object} - {valid: boolean, error?: string}
 */
export const validateLogin = (loginData) => {
  const { email, password } = loginData;

  // Email validieren (Format prüfen)
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return emailValidation;
  }

  // Passwort prüfen (nur ob vorhanden)
  const passwordValidation = validatePassword(password, true);
  if (!passwordValidation.valid) {
    return passwordValidation;
  }
  return { valid: true };
};