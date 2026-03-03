// Session-based storage service with encryption
// Each session has its own data, accessible via URL or passphrase
// Sensitive data is encrypted at rest using AES-GCM

import { encrypt, decrypt, isEncrypted, encryptFields, decryptFields } from './crypto.js';

const DB_VERSION = 2; // Bumped for encryption support
const DB_NAME = 'snapcal-v1';

// Fields to encrypt in entries
const ENCRYPTED_ENTRY_FIELDS = ['description', 'photo'];

// Migration flag key
const MIGRATION_KEY = 'snapcal_encrypted_migration';

// Migration: Import old FoodLog data if exists
async function migrateOldData(sessionId) {
 const oldDbName = 'foodlog-v2';
 const oldSessionKey = 'foodlog_session';
 
 try {
 // Check for old session
 const oldSession = localStorage.getItem(oldSessionKey);
 if (!oldSession) return null;
 
 // Open old database
 const oldDb = await new Promise((resolve, reject) => {
 const request = indexedDB.open(`${oldDbName}-${oldSession}`, DB_VERSION);
 request.onerror = () => reject(request.error);
 request.onsuccess = () => resolve(request.result);
 });
 
 // Get all entries
 const entries = await new Promise((resolve, reject) => {
 const transaction = oldDb.transaction('entries', 'readonly');
 const store = transaction.objectStore('entries');
 const request = store.getAll();
 request.onsuccess = () => resolve(request.result);
 request.onerror = () => reject(request.error);
 });
 
 // Get all settings
 const settings = await new Promise((resolve, reject) => {
 const transaction = oldDb.transaction('settings', 'readonly');
 const store = transaction.objectStore('settings');
 const request = store.getAll();
 request.onerror = () => reject(request.error);
 request.onsuccess = () => resolve(request.result);
 });
 
 oldDb.close();
 
 return { entries, settings, oldSession };
 } catch (e) {
 // Old DB doesn't exist or error - that's fine
 return null;
 }
}

// Get current session from URL or localStorage
export function getSession() {
 // Check URL first: /s/:sessionId
 const match = window.location.pathname.match(/^\/s\/([^/]+)/);
 if (match) {
 const sessionId = match[1];
 localStorage.setItem('snapcal_session', sessionId);
 return sessionId;
 }
 
 // Check localStorage
 const stored = localStorage.getItem('snapcal_session');
 if (stored) {
 return stored;
 }
 
 // Check for old foodlog session and migrate
 const oldSession = localStorage.getItem('foodlog_session');
 if (oldSession) {
 // Migrate old session key
 localStorage.setItem('snapcal_session', oldSession);
 localStorage.removeItem('foodlog_session');
 return oldSession;
 }
 
 // Generate new session
 const newSession = generateSessionId();
 localStorage.setItem('snapcal_session', newSession);
 return newSession;
}

// Generate a memorable session ID
function generateSessionId() {
 const adjectives = ['happy', 'clever', 'swift', 'calm', 'bright', 'eager', 'gentle', 'honest'];
 const nouns = ['panda', 'tiger', 'eagle', 'dolphin', 'fox', 'owl', 'bear', 'wolf'];
 const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
 const noun = nouns[Math.floor(Math.random() * nouns.length)];
 const num = Math.floor(Math.random() * 100);
 return `${adj}-${noun}-${num}`;
}

// Create a custom session ID from passphrase
export function createSession(passphrase) {
 // Convert passphrase to URL-safe ID
 const sessionId = passphrase
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, '-')
 .replace(/^-|-$/g, '')
 .substring(0, 50);
 
 localStorage.setItem('snapcal_session', sessionId);
 return sessionId;
}

// Open IndexedDB (session-scoped)
async function openDB() {
 const sessionId = getSession();
 
 return new Promise((resolve, reject) => {
 // Use database per session to avoid key collisions
 const request = indexedDB.open(`${DB_NAME}-${sessionId}`, DB_VERSION);
 
 request.onerror = () => reject(request.error);
 request.onsuccess = () => resolve(request.result);
 
 request.onupgradeneeded = (event) => {
 const db = event.target.result;
 if (!db.objectStoreNames.contains('entries')) {
 db.createObjectStore('entries', { keyPath: 'id' });
 }
 if (!db.objectStoreNames.contains('settings')) {
 db.createObjectStore('settings', { keyPath: 'key' });
 }
 };
 });
}

// Generate unique ID
function generateId() {
 return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get today's date string
function getTodayStr() {
 return new Date().toISOString().split('T')[0];
}

// Check if migration to encrypted storage has been done
async function isMigrationDone() {
 const db = await openDB();
 return new Promise((resolve, reject) => {
 const transaction = db.transaction('settings', 'readonly');
 const store = transaction.objectStore('settings');
 const request = store.get(MIGRATION_KEY);
 request.onsuccess = () => resolve(request.result?.value === true);
 request.onerror = () => reject(request.error);
 });
}

// Mark migration as complete
async function markMigrationDone() {
 const db = await openDB();
 return new Promise((resolve, reject) => {
 const transaction = db.transaction('settings', 'readwrite');
 const store = transaction.objectStore('settings');
 const request = store.put({ key: MIGRATION_KEY, value: true });
 request.onsuccess = () => resolve();
 request.onerror = () => reject(request.error);
 });
}

// Migrate existing plaintext data to encrypted format
async function migrateToEncryptedStorage() {
 const isMigrated = await isMigrationDone();
 if (isMigrated) return;
 
 console.log('[SnapCal] Migrating plaintext data to encrypted storage...');
 
 const db = await openDB();
 
 // Migrate entries
 const entries = await new Promise((resolve, reject) => {
 const transaction = db.transaction('entries', 'readonly');
 const store = transaction.objectStore('entries');
 const request = store.getAll();
 request.onsuccess = () => resolve(request.result || []);
 request.onerror = () => reject(request.error);
 });
 
 // Re-encrypt entries with sensitive fields
 for (const entry of entries) {
 let needsUpdate = false;
 for (const field of ENCRYPTED_ENTRY_FIELDS) {
 if (entry[field] && !isEncrypted(entry[field])) {
 needsUpdate = true;
 break;
 }
 }
 
 if (needsUpdate) {
 const encryptedEntry = await encryptFields(entry, ENCRYPTED_ENTRY_FIELDS);
 await new Promise((resolve, reject) => {
 const transaction = db.transaction('entries', 'readwrite');
 const store = transaction.objectStore('entries');
 const request = store.put(encryptedEntry);
 request.onsuccess = () => resolve();
 request.onerror = () => reject(request.error);
 });
 }
 }
 
 // Migrate API key
 const apiKeyRecord = await new Promise((resolve, reject) => {
 const transaction = db.transaction('settings', 'readonly');
 const store = transaction.objectStore('settings');
 const request = store.get('openrouter_key');
 request.onsuccess = () => resolve(request.result);
 request.onerror = () => reject(request.error);
 });
 
 if (apiKeyRecord?.value && !isEncrypted(apiKeyRecord.value)) {
 const encryptedKey = await encrypt(apiKeyRecord.value);
 await new Promise((resolve, reject) => {
 const transaction = db.transaction('settings', 'readwrite');
 const store = transaction.objectStore('settings');
 const request = store.put({ key: 'openrouter_key', value: encryptedKey });
 request.onsuccess = () => resolve();
 request.onerror = () => reject(request.error);
 });
 }
 
 await markMigrationDone();
 console.log('[SnapCal] Migration complete');
}

// Run migration on load (non-blocking)
 migrateToEncryptedStorage().catch(console.error);

// Entries API
export const entries = {
 async getToday() {
 const db = await openDB();
 const today = getTodayStr();
 
 return new Promise((resolve, reject) => {
 const transaction = db.transaction('entries', 'readonly');
 const store = transaction.objectStore('entries');
 const request = store.getAll();
 
 request.onsuccess = async () => {
 const rawEntries = request.result.filter(e => e.date === today);
 
 // Decrypt sensitive fields
 const decryptedEntries = await Promise.all(
 rawEntries.map(e => decryptFields(e, ENCRYPTED_ENTRY_FIELDS))
 );
 
 const totals = decryptedEntries.reduce((acc, e) => ({
 calories: acc.calories + (e.calories || 0),
 protein: acc.protein + (e.protein || 0),
 carbs: acc.carbs + (e.carbs || 0),
 fat: acc.fat + (e.fat || 0),
 }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
 
 resolve({ entries: decryptedEntries, totals, date: today });
 };
 request.onerror = () => reject(request.error);
 });
 },
 
 async getRecentStats(days = 7) {
 const db = await openDB();
 
 return new Promise((resolve, reject) => {
 const transaction = db.transaction('entries', 'readonly');
 const store = transaction.objectStore('entries');
 const request = store.getAll();
 
 request.onsuccess = async () => {
 const entries = await Promise.all(
 request.result.map(e => decryptFields(e, ENCRYPTED_ENTRY_FIELDS))
 );
 const daysMap = {};
 
 entries.forEach(e => {
 if (!daysMap[e.date]) {
 daysMap[e.date] = { date: e.date, calories: 0, entries: 0 };
 }
 daysMap[e.date].calories += e.calories || 0;
 daysMap[e.date].entries += 1;
 });
 
 const result = Object.values(daysMap)
 .sort((a, b) => b.date.localeCompare(a.date))
 .slice(0, days);
 
 resolve(result);
 };
 request.onerror = () => reject(request.error);
 });
 },
 
 async create(data) {
 const db = await openDB();
 
 // Encrypt sensitive fields
 const encryptedData = await encryptFields(data, ENCRYPTED_ENTRY_FIELDS);
 
 const entry = {
 id: generateId(),
 date: getTodayStr(),
 createdAt: new Date().toISOString(),
 ...encryptedData,
 };
 
 return new Promise((resolve, reject) => {
 const transaction = db.transaction('entries', 'readwrite');
 const store = transaction.objectStore('entries');
 const request = store.add(entry);
 
 request.onsuccess = () => resolve(entry);
 request.onerror = () => reject(request.error);
 });
 },
 
 async update(id, data) {
 const db = await openDB();
 
 // Encrypt sensitive fields
 const encryptedData = await encryptFields(data, ENCRYPTED_ENTRY_FIELDS);
 
 return new Promise((resolve, reject) => {
 const transaction = db.transaction('entries', 'readwrite');
 const store = transaction.objectStore('entries');
 const getRequest = store.get(id);
 
 getRequest.onsuccess = async () => {
 const entry = { 
 ...getRequest.result, 
 ...encryptedData, 
 updatedAt: new Date().toISOString() 
 };
 const putRequest = store.put(entry);
 putRequest.onsuccess = () => resolve(entry);
 putRequest.onerror = () => reject(putRequest.error);
 };
 getRequest.onerror = () => reject(getRequest.error);
 });
 },
 
 async delete(id) {
 const db = await openDB();
 
 return new Promise((resolve, reject) => {
 const transaction = db.transaction('entries', 'readwrite');
 const store = transaction.objectStore('entries');
 const request = store.delete(id);
 
 request.onsuccess = () => resolve({ success: true });
 request.onerror = () => reject(request.error);
 });
 },
 
 async get(id) {
 const db = await openDB();
 
 return new Promise((resolve, reject) => {
 const transaction = db.transaction('entries', 'readonly');
 const store = transaction.objectStore('entries');
 const request = store.get(id);
 
 request.onsuccess = async () => {
 if (request.result) {
 const decrypted = await decryptFields(request.result, ENCRYPTED_ENTRY_FIELDS);
 resolve(decrypted);
 } else {
 resolve(null);
 }
 };
 request.onerror = () => reject(request.error);
 });
 },
};

// Settings API (per-session)
export const settings = {
 async get(key) {
 const db = await openDB();
 
 return new Promise((resolve, reject) => {
 const transaction = db.transaction('settings', 'readonly');
 const store = transaction.objectStore('settings');
 const request = store.get(key);
 
 request.onsuccess = () => resolve(request.result?.value);
 request.onerror = () => reject(request.error);
 });
 },
 
 async set(key, value) {
 const db = await openDB();
 
 return new Promise((resolve, reject) => {
 const transaction = db.transaction('settings', 'readwrite');
 const store = transaction.objectStore('settings');
 const request = store.put({ key, value });
 
 request.onsuccess = () => resolve(value);
 request.onerror = () => reject(request.error);
 });
 },
};

// Goals API (goals are not sensitive, but let's keep them in IndexedDB for consistency)
export const goals = {
 async get() {
 const defaults = { calories: 2000, protein: 150, carbs: 200, fat: 65 };
 const saved = await settings.get('goals');
 return saved || defaults;
 },
 
 async set(goals) {
 return settings.set('goals', goals);
 },
};

// Theme API
export const theme = {
 async get() {
 return settings.get('theme') || 'system';
 },
 
 async set(theme) {
 return settings.set('theme', theme);
 },
};

// API key API - ENCRYPTED
export const apiKey = {
 async get() {
 const encryptedKey = await settings.get('openrouter_key');
 if (!encryptedKey) return null;
 
 // Decrypt the key
 try {
 // Check if it's already encrypted
 if (isEncrypted(encryptedKey)) {
 return await decrypt(encryptedKey);
 }
 // Legacy plaintext key - return as is (migration will handle it)
 return encryptedKey;
 } catch (e) {
 console.error('Failed to decrypt API key:', e);
 return null;
 }
 },
 
 async set(key) {
 // Encrypt before storing
 const encryptedKey = await encrypt(key);
 return settings.set('openrouter_key', encryptedKey);
 },
};

// Session URL helpers
export function getSessionUrl() {
 const sessionId = getSession();
 return `${window.location.origin}/s/${sessionId}`;
}

export function navigateToSession(sessionId) {
 window.history.pushState({}, '', `/s/${sessionId}`);
 localStorage.setItem('snapcal_session', sessionId);
 // Reload to reinitialize IndexedDB for new session
 window.location.reload();
}

export default { 
 getSession, 
 createSession, 
 getSessionUrl, 
 navigateToSession,
 entries, 
 goals, 
 theme,
 apiKey,
 settings 
};