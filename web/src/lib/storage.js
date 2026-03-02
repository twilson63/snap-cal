// Session-based storage service
// Each session has its own data, accessible via URL or passphrase

const DB_VERSION = 1;
const DB_NAME = 'foodlog-v2';

// Get current session from URL or localStorage
export function getSession() {
  // Check URL first: /s/:sessionId
  const match = window.location.pathname.match(/^\/s\/([^/]+)/);
  if (match) {
    const sessionId = match[1];
    localStorage.setItem('foodlog_session', sessionId);
    return sessionId;
  }
  
  // Check localStorage
  const stored = localStorage.getItem('foodlog_session');
  if (stored) {
    return stored;
  }
  
  // Generate new session
  const newSession = generateSessionId();
  localStorage.setItem('foodlog_session', newSession);
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
  
  localStorage.setItem('foodlog_session', sessionId);
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

// Entries API
export const entries = {
  async getToday() {
    const db = await openDB();
    const today = getTodayStr();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('entries', 'readonly');
      const store = transaction.objectStore('entries');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const entries = request.result.filter(e => e.date === today);
        const totals = entries.reduce((acc, e) => ({
          calories: acc.calories + (e.calories || 0),
          protein: acc.protein + (e.protein || 0),
          carbs: acc.carbs + (e.carbs || 0),
          fat: acc.fat + (e.fat || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        
        resolve({ entries, totals, date: today });
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
      
      request.onsuccess = () => {
        const entries = request.result;
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
    const entry = {
      id: generateId(),
      date: getTodayStr(),
      createdAt: new Date().toISOString(),
      ...data,
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
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('entries', 'readwrite');
      const store = transaction.objectStore('entries');
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const entry = { ...getRequest.result, ...data, updatedAt: new Date().toISOString() };
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
      
      request.onsuccess = () => resolve(request.result);
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

// Goals API
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

// API key API
export const apiKey = {
  async get() {
    return settings.get('openrouter_key');
  },
  
  async set(key) {
    return settings.set('openrouter_key', key);
  },
};

// Session URL helpers
export function getSessionUrl() {
  const sessionId = getSession();
  return `${window.location.origin}/s/${sessionId}`;
}

export function navigateToSession(sessionId) {
  window.history.pushState({}, '', `/s/${sessionId}`);
  localStorage.setItem('foodlog_session', sessionId);
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