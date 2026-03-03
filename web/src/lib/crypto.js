/**
 * Encryption module for SnapCal local storage
 * Uses Web Crypto API with AES-GCM for encryption
 * 
 * Key derivation strategy:
 * 1. Generate a random master key (256-bit)
 * 2. Derive a wrapping key from device characteristics + random salt
 * 3. Encrypt master key with wrapping key, store encrypted
 * 4. Use master key for all data encryption
 */

const MASTER_KEY_NAME = 'snapcal_master_key';
const SALT_NAME = 'snapcal_key_salt';
const ENCRYPTED_KEY_NAME = 'snapcal_encrypted_key';
const KEY_VERSION = 1;

// Cache for decrypted master key (in-memory only)
let cachedMasterKey = null;

/**
 * Generate a device fingerprint (not cryptographically strong, but unique enough)
 * Combined with random salt for key derivation
 */
async function getDeviceFingerprint() {
 const components = [
 navigator.userAgent,
 navigator.language,
 screen.width + 'x' + screen.height,
 new Date().getTimezoneOffset(),
 // Add some randomness that persists
 localStorage.getItem('snapcal_device_id') || (() => {
 const id = crypto.randomUUID();
 localStorage.setItem('snapcal_device_id', id);
 return id;
 })(),
 ];
 
 // Hash the components
 const encoder = new TextEncoder();
 const data = encoder.encode(components.join('|'));
 const hashBuffer = await crypto.subtle.digest('SHA-256', data);
 return new Uint8Array(hashBuffer);
}

/**
 * Derive a key from device fingerprint + salt using PBKDF2
 */
async function deriveWrappingKey(salt) {
 const fingerprint = await getDeviceFingerprint();
 
 // Combine fingerprint with salt for key material
 const keyMaterial = new Uint8Array(fingerprint.length + salt.length);
 keyMaterial.set(fingerprint);
 keyMaterial.set(salt, fingerprint.length);
 
 // Import as raw key for PBKDF2
 const baseKey = await crypto.subtle.importKey(
 'raw',
 keyMaterial,
 'PBKDF2',
 false,
 ['deriveKey']
 );
 
 // Derive AES key using PBKDF2
 return crypto.subtle.deriveKey(
 {
 name: 'PBKDF2',
 salt: salt,
 iterations: 100000,
 hash: 'SHA-256',
 },
 baseKey,
 { name: 'AES-GCM', length: 256 },
 false,
 ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
 );
}

/**
 * Generate a new random master key
 */
async function generateMasterKey() {
 return crypto.subtle.generateKey(
 { name: 'AES-GCM', length: 256 },
 true, // extractable for wrapping
 ['encrypt', 'decrypt']
 );
}

/**
 * Get or create the master encryption key
 * Returns cached key if available, otherwise decrypts from storage
 */
export async function getMasterKey() {
 // Return cached key if available
 if (cachedMasterKey) {
 return cachedMasterKey;
 }
 
 // Check for existing encrypted key in IndexedDB
 const encryptedKeyData = await getFromIndexedDB('_crypto', ENCRYPTED_KEY_NAME);
 const saltData = await getFromIndexedDB('_crypto', SALT_NAME);
 
 if (encryptedKeyData && saltData) {
 try {
 const salt = new Uint8Array(saltData);
 const wrappingKey = await deriveWrappingKey(salt);
 
 // Unwrap the master key
 const masterKey = await crypto.subtle.unwrapKey(
 'raw',
 new Uint8Array(encryptedKeyData),
 wrappingKey,
 { name: 'AES-GCM', iv: salt.slice(0, 12) },
 { name: 'AES-GCM', length: 256 },
 true,
 ['encrypt', 'decrypt']
 );
 
 cachedMasterKey = masterKey;
 return masterKey;
 } catch (e) {
 console.error('Failed to unwrap master key, generating new one:', e);
 // Fall through to generate new key
 }
 }
 
 // Generate new master key
 const masterKey = await generateMasterKey();
 const salt = crypto.getRandomValues(new Uint8Array(16));
 const wrappingKey = await deriveWrappingKey(salt);
 
 // Wrap and store the master key
 const wrappedKey = await crypto.subtle.wrapKey(
 'raw',
 masterKey,
 wrappingKey,
 { name: 'AES-GCM', iv: salt.slice(0, 12) }
 );
 
 await storeInIndexedDB('_crypto', SALT_NAME, salt);
 await storeInIndexedDB('_crypto', ENCRYPTED_KEY_NAME, wrappedKey);
 await storeInIndexedDB('_crypto', 'version', KEY_VERSION);
 
 cachedMasterKey = masterKey;
 return masterKey;
}

/**
 * Encrypt data using AES-GCM
 * @param {string|object} data - Data to encrypt
 * @returns {Promise<string>} Base64 encoded encrypted data
 */
export async function encrypt(data) {
 const masterKey = await getMasterKey();
 const encoder = new TextEncoder();
 const plaintext = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
 
 // Generate random IV for each encryption
 const iv = crypto.getRandomValues(new Uint8Array(12));
 
 const ciphertext = await crypto.subtle.encrypt(
 { name: 'AES-GCM', iv },
 masterKey,
 plaintext
 );
 
 // Combine IV + ciphertext and encode as base64
 const combined = new Uint8Array(iv.length + ciphertext.byteLength);
 combined.set(iv);
 combined.set(new Uint8Array(ciphertext), iv.length);
 
 return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data encrypted with AES-GCM
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {Promise<string|object>} Decrypted data
 */
export async function decrypt(encryptedData) {
 if (!encryptedData || typeof encryptedData !== 'string') {
 return encryptedData;
 }
 
 const masterKey = await getMasterKey();
 
 // Decode base64
 const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
 
 // Extract IV and ciphertext
 const iv = combined.slice(0, 12);
 const ciphertext = combined.slice(12);
 
 const decrypted = await crypto.subtle.decrypt(
 { name: 'AES-GCM', iv },
 masterKey,
 ciphertext
 );
 
 const decoder = new TextDecoder();
 const text = decoder.decode(decrypted);
 
 // Try to parse as JSON, return as string if fails
 try {
 return JSON.parse(text);
 } catch {
 return text;
 }
}

/**
 * Check if data appears to be encrypted
 */
export function isEncrypted(data) {
 if (typeof data !== 'string') return false;
 // Our encrypted data is base64 and has specific length (IV + ciphertext)
 try {
 const decoded = Uint8Array.from(atob(data), c => c.charCodeAt(0));
 return decoded.length >= 12 + 16; // IV (12) + auth tag (16) minimum
 } catch {
 return false;
 }
}

/**
 * Encrypt an object's sensitive fields
 * @param {object} obj - Object to encrypt fields from
 * @param {string[]} fields - Field names to encrypt
 */
export async function encryptFields(obj, fields) {
 const result = { ...obj };
 for (const field of fields) {
 if (result[field] !== undefined && result[field] !== null) {
 result[field] = await encrypt(result[field]);
 result[`_${field}_encrypted`] = true;
 }
 }
 return result;
}

/**
 * Decrypt an object's encrypted fields
 * @param {object} obj - Object with encrypted fields
 * @param {string[]} fields - Field names that might be encrypted
 */
export async function decryptFields(obj, fields) {
 const result = { ...obj };
 for (const field of fields) {
 if (result[`_${field}_encrypted`]) {
 try {
 result[field] = await decrypt(result[field]);
 delete result[`_${field}_encrypted`];
 } catch (e) {
 console.error(`Failed to decrypt field ${field}:`, e);
 }
 }
 }
 return result;
}

// Internal IndexedDB helpers for crypto metadata
async function storeInIndexedDB(store, key, value) {
 return new Promise((resolve, reject) => {
 const request = indexedDB.open('snapcal-crypto', 1);
 
 request.onerror = () => reject(request.error);
 request.onsuccess = () => {
 const db = request.result;
 const tx = db.transaction(store, 'readwrite');
 const st = tx.objectStore(store);
 st.put(value, key);
 tx.oncomplete = () => resolve();
 tx.onerror = () => reject(tx.error);
 };
 
 request.onupgradeneeded = (e) => {
 const db = e.target.result;
 if (!db.objectStoreNames.contains(store)) {
 db.createObjectStore(store);
 }
 };
 });
}

async function getFromIndexedDB(store, key) {
 return new Promise((resolve, reject) => {
 const request = indexedDB.open('snapcal-crypto', 1);
 
 request.onerror = () => reject(request.error);
 request.onsuccess = () => {
 const db = request.result;
 if (!db.objectStoreNames.contains(store)) {
 resolve(null);
 return;
 }
 const tx = db.transaction(store, 'readonly');
 const st = tx.objectStore(store);
 const getRequest = st.get(key);
 getRequest.onsuccess = () => resolve(getRequest.result);
 getRequest.onerror = () => reject(getRequest.error);
 };
 
 request.onupgradeneeded = (e) => {
 const db = e.target.result;
 if (!db.objectStoreNames.contains(store)) {
 db.createObjectStore(store);
 }
 };
 });
}

/**
 * Clear cached master key (call on logout or security event)
 */
export function clearMasterKeyCache() {
 cachedMasterKey = null;
}

export default {
 encrypt,
 decrypt,
 isEncrypted,
 encryptFields,
 decryptFields,
 getMasterKey,
 clearMasterKeyCache,
};