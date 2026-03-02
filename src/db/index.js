import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Database path - use DATA_DIR env var or default to ./data
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', '..', 'data')
const DB_PATH = join(DATA_DIR, 'foodlog.db')

// Ensure data directory exists
import { mkdirSync, existsSync } from 'fs'
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

// Initialize database connection
const db = new Database(DB_PATH)

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL')

// Enable foreign keys
db.pragma('foreign_keys = ON')

/**
 * Run database migrations
 */
function runMigrations() {
  // Create migrations tracking table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Get applied migrations
  const applied = db.prepare('SELECT name FROM _migrations').all().map(r => r.name)

  // Migration definitions
  const migrations = [
    {
      name: '001_initial_schema',
      up: () => db.exec(`
        CREATE TABLE IF NOT EXISTS entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          photo TEXT,
          photo_url TEXT,
          description TEXT,
          calories INTEGER,
          protein REAL,
          carbs REAL,
          fat REAL,
          timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          estimated INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
      `)
    },
    {
      name: '002_add_daily_summary_view',
      up: () => db.exec(`
        CREATE VIEW IF NOT EXISTS daily_summary AS
        SELECT 
          date(timestamp) as date,
          COUNT(*) as entry_count,
          SUM(COALESCE(calories, 0)) as total_calories,
          SUM(COALESCE(protein, 0)) as total_protein,
          SUM(COALESCE(carbs, 0)) as total_carbs,
          SUM(COALESCE(fat, 0)) as total_fat
        FROM entries
        GROUP BY date(timestamp)
        ORDER BY date DESC;
      `)
    },
    {
      name: '003_add_search_index',
      up: () => db.exec(`
        CREATE INDEX IF NOT EXISTS idx_entries_description ON entries(description);
      `)
    }
  ]

  // Apply pending migrations
  const insertMigration = db.prepare('INSERT INTO _migrations (name) VALUES (?)')
  
  for (const migration of migrations) {
    if (!applied.includes(migration.name)) {
      console.log(`[DB] Applying migration: ${migration.name}`)
      migration.up()
      insertMigration.run(migration.name)
      console.log(`[DB] Migration applied: ${migration.name}`)
    }
  }
}

// Run migrations on startup
runMigrations()

/**
 * Prepared statements for performance
 */
const statements = {
  // Entries
  insertEntry: db.prepare(`
    INSERT INTO entries (photo, photo_url, description, calories, protein, carbs, fat, timestamp, estimated)
    VALUES (@photo, @photoUrl, @description, @calories, @protein, @carbs, @fat, @timestamp, @estimated)
  `),
  
  getEntryById: db.prepare(`
    SELECT * FROM entries WHERE id = ?
  `),
  
  getAllEntries: db.prepare(`
    SELECT * FROM entries 
    ORDER BY timestamp DESC 
    LIMIT ? OFFSET ?
  `),
  
  countEntries: db.prepare(`SELECT COUNT(*) as count FROM entries`),
  
  getTodayEntries: db.prepare(`
    SELECT * FROM entries 
    WHERE date(timestamp) = date('now', 'localtime')
    ORDER BY timestamp DESC
  `),
  
  getEntriesByDate: db.prepare(`
    SELECT * FROM entries 
    WHERE date(timestamp) = ?
    ORDER BY timestamp DESC
  `),
  
  deleteEntry: db.prepare(`DELETE FROM entries WHERE id = ?`),
  
  updateEntry: db.prepare(`
    UPDATE entries 
    SET description = @description,
        calories = @calories,
        protein = @protein,
        carbs = @carbs,
        fat = @fat,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `),

  // Statistics
  getDailyTotals: db.prepare(`
    SELECT 
      SUM(COALESCE(calories, 0)) as calories,
      SUM(COALESCE(protein, 0)) as protein,
      SUM(COALESCE(carbs, 0)) as carbs,
      SUM(COALESCE(fat, 0)) as fat
    FROM entries
    WHERE date(timestamp) = date('now', 'localtime')
  `),

  getRecentDays: db.prepare(`
    SELECT * FROM daily_summary 
    ORDER BY date DESC 
    LIMIT ?
  `),

  // Search
  searchEntries: db.prepare(`
    SELECT * FROM entries 
    WHERE description LIKE ? COLLATE NOCASE
    ORDER BY timestamp DESC 
    LIMIT ?
  `),

  // Export - get all entries
  getAllEntriesForExport: db.prepare(`
    SELECT * FROM entries 
    ORDER BY timestamp DESC
  `),

  // Get entries in date range
  getEntriesInRange: db.prepare(`
    SELECT * FROM entries 
    WHERE date(timestamp) BETWEEN date(?) AND date(?)
    ORDER BY timestamp DESC
  `)
}

/**
 * Convert database row to API format
 */
function rowToJSON(row) {
  if (!row) return null
  return {
    id: row.id,
    photo: row.photo,
    photoUrl: row.photo_url,
    description: row.description,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    timestamp: row.timestamp,
    estimated: !!row.estimated,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * Entry repository
 */
export const entryRepository = {
  create(data) {
    const result = statements.insertEntry.run({
      photo: data.photo || null,
      photoUrl: data.photoUrl || null,
      description: data.description || null,
      calories: data.calories ?? null,
      protein: data.protein ?? null,
      carbs: data.carbs ?? null,
      fat: data.fat ?? null,
      timestamp: data.timestamp?.toISOString?.() || new Date().toISOString(),
      estimated: data.estimated ? 1 : 0
    })
    
    const entry = statements.getEntryById.get(result.lastInsertRowid)
    return rowToJSON(entry)
  },

  findById(id) {
    const row = statements.getEntryById.get(id)
    return rowToJSON(row)
  },

  findAll(limit = 50, offset = 0) {
    const rows = statements.getAllEntries.all(limit, offset)
    return rows.map(rowToJSON)
  },

  count() {
    const result = statements.countEntries.get()
    return result.count
  },

  getToday() {
    const rows = statements.getTodayEntries.all()
    return rows.map(rowToJSON)
  },

  findByDate(date) {
    const rows = statements.getEntriesByDate.all(date)
    return rows.map(rowToJSON)
  },

  getTodayTotals() {
    const result = statements.getDailyTotals.get()
    return {
      calories: result.calories || 0,
      protein: result.protein || 0,
      carbs: result.carbs || 0,
      fat: result.fat || 0
    }
  },

  update(id, data) {
    const result = statements.updateEntry.run({
      id,
      description: data.description ?? null,
      calories: data.calories ?? null,
      protein: data.protein ?? null,
      carbs: data.carbs ?? null,
      fat: data.fat ?? null
    })
    
    if (result.changes === 0) return null
    return this.findById(id)
  },

  delete(id) {
    const result = statements.deleteEntry.run(id)
    return result.changes > 0
  },

  getRecentDays(days = 7) {
    return statements.getRecentDays.all(days)
  },

  search(query, limit = 20) {
    const searchPattern = `%${query}%`
    const rows = statements.searchEntries.all(searchPattern, limit)
    return rows.map(rowToJSON)
  },

  exportAll() {
    const rows = statements.getAllEntriesForExport.all()
    return rows.map(rowToJSON)
  },

  findByDateRange(startDate, endDate) {
    const rows = statements.getEntriesInRange.all(startDate, endDate)
    return rows.map(rowToJSON)
  }
}

// Export database instance for advanced usage
export { db }

// Cleanup on process exit
process.on('exit', () => {
  db.close()
})

process.on('SIGINT', () => {
  db.close()
  process.exit(0)
})