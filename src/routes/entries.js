import { Hono } from 'hono'
import { z } from 'zod'
import { entryRepository } from '../db/index.js'

const app = new Hono()

// Validation schemas
const CreateEntrySchema = z.object({
  photo: z.string().optional(), // Base64 encoded image
  photoUrl: z.string().url().optional(), // Or URL
  description: z.string().optional(),
  calories: z.number().int().positive().optional(),
  protein: z.number().positive().optional(),
  carbs: z.number().positive().optional(),
  fat: z.number().positive().optional(),
  timestamp: z.string().datetime().optional()
})

const UpdateEntrySchema = z.object({
  description: z.string().optional(),
  calories: z.number().int().positive().optional(),
  protein: z.number().positive().optional(),
  carbs: z.number().positive().optional(),
  fat: z.number().positive().optional()
})

// GET /entries - List all entries
app.get('/', (c) => {
  const { limit = '50', offset = '0' } = c.req.query()
  const limitNum = Math.min(parseInt(limit) || 50, 100)
  const offsetNum = parseInt(offset) || 0
  
  const entries = entryRepository.findAll(limitNum, offsetNum)
  const total = entryRepository.count()
  
  return c.json({
    entries,
    total,
    limit: limitNum,
    offset: offsetNum
  })
})

// GET /entries/today - Get today's entries
app.get('/today', (c) => {
  const entries = entryRepository.getToday()
  const totals = entryRepository.getTodayTotals()
  
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  
  return c.json({
    date: dateStr,
    entries,
    totals,
    count: entries.length
  })
})

// GET /entries/date/:date - Get entries for a specific date
app.get('/date/:date', (c) => {
  const date = c.req.param('date')
  
  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400)
  }
  
  const entries = entryRepository.findByDate(date)
  
  return c.json({
    date,
    entries,
    count: entries.length
  })
})

// GET /entries/stats/recent - Get recent days summary
app.get('/stats/recent', (c) => {
  const { days = '7' } = c.req.query()
  const daysNum = Math.min(parseInt(days) || 7, 30)
  
  const summary = entryRepository.getRecentDays(daysNum)
  
  return c.json({
    days: daysNum,
    summary
  })
})

// GET /entries/search - Search entries by description
app.get('/search', (c) => {
  const { q, limit = '20' } = c.req.query()
  
  if (!q || q.trim().length === 0) {
    return c.json({ error: 'Search query required' }, 400)
  }
  
  const limitNum = Math.min(parseInt(limit) || 20, 100)
  const entries = entryRepository.search(q.trim(), limitNum)
  
  return c.json({
    query: q,
    count: entries.length,
    entries
  })
})

// GET /entries/export - Export all entries
app.get('/export', (c) => {
  const { format = 'json', start, end } = c.req.query()
  
  let entries
  if (start && end) {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      return c.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400)
    }
    entries = entryRepository.findByDateRange(start, end)
  } else {
    entries = entryRepository.exportAll()
  }
  
  if (format === 'csv') {
    // Generate CSV
    const headers = ['id', 'description', 'calories', 'protein', 'carbs', 'fat', 'timestamp', 'estimated']
    const csvRows = [headers.join(',')]
    
    for (const entry of entries) {
      csvRows.push([
        entry.id,
        `"${(entry.description || '').replace(/"/g, '""')}"`,
        entry.calories || '',
        entry.protein || '',
        entry.carbs || '',
        entry.fat || '',
        entry.timestamp,
        entry.estimated ? 1 : 0
      ].join(','))
    }
    
    return c.text(csvRows.join('\n'), 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="foodlog-export.csv"'
    })
  }
  
  // Default to JSON
  return c.json({
    exportedAt: new Date().toISOString(),
    count: entries.length,
    entries
  })
})

// GET /entries/:id - Get single entry
app.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  
  if (isNaN(id)) {
    return c.json({ error: 'Invalid entry ID' }, 400)
  }
  
  const entry = entryRepository.findById(id)
  
  if (!entry) {
    return c.json({ error: 'Entry not found' }, 404)
  }
  
  return c.json({ entry })
})

// POST /entries - Create new entry
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validated = CreateEntrySchema.parse(body)
    
    // Vision integration: estimate nutrition from photo if provided
    let nutritionEstimate = null
    let estimated = false
    
    // Import vision service lazily to avoid circular dependency
    const { visionService } = await import('../services/vision.js')
    
    if ((validated.photo || validated.photoUrl) && !validated.calories) {
      console.log('[Entries] Photo provided without calories - calling vision service')
      nutritionEstimate = await visionService.estimateNutrition({
        photo: validated.photo,
        photoUrl: validated.photoUrl
      })
      estimated = true
      
      console.log('[Entries] Vision estimate:', {
        description: nutritionEstimate.description,
        calories: nutritionEstimate.calories,
        confidence: nutritionEstimate.confidence
      })
    }
    
    const entryData = {
      photo: validated.photo || null,
      photoUrl: validated.photoUrl || null,
      description: validated.description || nutritionEstimate?.description || null,
      calories: validated.calories ?? nutritionEstimate?.calories ?? null,
      protein: validated.protein ?? nutritionEstimate?.protein ?? null,
      carbs: validated.carbs ?? nutritionEstimate?.carbs ?? null,
      fat: validated.fat ?? nutritionEstimate?.fat ?? null,
      timestamp: validated.timestamp ? new Date(validated.timestamp) : new Date(),
      estimated
    }
    
    const entry = entryRepository.create(entryData)
    
    const response = { entry }
    if (nutritionEstimate) {
      response.visionEstimate = {
        description: nutritionEstimate.description,
        calories: nutritionEstimate.calories,
        protein: nutritionEstimate.protein,
        carbs: nutritionEstimate.carbs,
        fat: nutritionEstimate.fat,
        confidence: nutritionEstimate.confidence,
        model: nutritionEstimate.model
      }
    }
    
    return c.json(response, 201)
  } catch (err) {
    if (err.name === 'ZodError') {
      return c.json({ error: 'Validation failed', details: err.errors }, 400)
    }
    console.error('Error creating entry:', err)
    return c.json({ error: 'Failed to create entry' }, 500)
  }
})

// PUT /entries/:id - Update entry
app.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid entry ID' }, 400)
    }
    
    const body = await c.req.json()
    const validated = UpdateEntrySchema.parse(body)
    
    const entry = entryRepository.findById(id)
    if (!entry) {
      return c.json({ error: 'Entry not found' }, 404)
    }
    
    // Merge existing values with updates (only update provided fields)
    const mergedUpdate = {
      description: validated.description ?? entry.description,
      calories: validated.calories ?? entry.calories,
      protein: validated.protein ?? entry.protein,
      carbs: validated.carbs ?? entry.carbs,
      fat: validated.fat ?? entry.fat
    }
    
    const updated = entryRepository.update(id, mergedUpdate)
    
    return c.json({ entry: updated })
  } catch (err) {
    if (err.name === 'ZodError') {
      return c.json({ error: 'Validation failed', details: err.errors }, 400)
    }
    console.error('Error updating entry:', err)
    return c.json({ error: 'Failed to update entry' }, 500)
  }
})

// DELETE /entries/:id - Delete entry
app.delete('/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  
  if (isNaN(id)) {
    return c.json({ error: 'Invalid entry ID' }, 400)
  }
  
  const deleted = entryRepository.delete(id)
  
  if (!deleted) {
    return c.json({ error: 'Entry not found' }, 404)
  }
  
  return c.json({ deleted: true, id })
})

export default app