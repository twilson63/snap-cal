// Local Storage Service for FoodLog
// No backend needed - everything stored in browser

const DB_VERSION = 1;
const DB_NAME = 'foodlog';
const ENTRIES_STORE = 'entries';

// Open IndexedDB for photos (localStorage can't handle large data)
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
        db.createObjectStore(ENTRIES_STORE, { keyPath: 'id' });
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
  // Get all entries for today
  async getToday() {
    const db = await openDB();
    const today = getTodayStr();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ENTRIES_STORE, 'readonly');
      const store = transaction.objectStore(ENTRIES_STORE);
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
  
  // Get recent days stats
  async getRecentStats(days = 7) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ENTRIES_STORE, 'readonly');
      const store = transaction.objectStore(ENTRIES_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const entries = request.result;
        const daysMap = {};
        
        // Group by date
        entries.forEach(e => {
          if (!daysMap[e.date]) {
            daysMap[e.date] = { date: e.date, calories: 0, entries: 0 };
          }
          daysMap[e.date].calories += e.calories || 0;
          daysMap[e.date].entries += 1;
        });
        
        // Get last N days
        const result = Object.values(daysMap)
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, days);
        
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  },
  
  // Create entry
  async create(data) {
    const db = await openDB();
    const entry = {
      id: generateId(),
      date: getTodayStr(),
      createdAt: new Date().toISOString(),
      ...data,
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ENTRIES_STORE, 'readwrite');
      const store = transaction.objectStore(ENTRIES_STORE);
      const request = store.add(entry);
      
      request.onsuccess = () => resolve(entry);
      request.onerror = () => reject(request.error);
    });
  },
  
  // Update entry
  async update(id, data) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ENTRIES_STORE, 'readwrite');
      const store = transaction.objectStore(ENTRIES_STORE);
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
  
  // Delete entry
  async delete(id) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ENTRIES_STORE, 'readwrite');
      const store = transaction.objectStore(ENTRIES_STORE);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve({ success: true });
      request.onerror = () => reject(request.error);
    });
  },
  
  // Get entry by ID
  async get(id) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ENTRIES_STORE, 'readonly');
      const store = transaction.objectStore(ENTRIES_STORE);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
};

// Goals API (stored in localStorage for simplicity)
export const goals = {
  get() {
    const stored = localStorage.getItem('foodlog_goals');
    return stored ? JSON.parse(stored) : {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fat: 65,
    };
  },
  
  set(goals) {
    localStorage.setItem('foodlog_goals', JSON.stringify(goals));
    return goals;
  },
};

// Theme API
export const theme = {
  get() {
    return localStorage.getItem('foodlog_theme') || 'system';
  },
  
  set(theme) {
    localStorage.setItem('foodlog_theme', theme);
    return theme;
  },
};

export default { entries, goals, theme };