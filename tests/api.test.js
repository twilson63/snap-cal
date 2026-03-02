/**
 * FoodLog API Tests
 * 
 * Tests for the core API endpoints and functionality.
 * Run with: npm test (requires server on port 3001)
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'

const baseUrl = process.env.API_URL || 'http://localhost:3001'

// Helper to check if server is running
async function checkServer() {
  try {
    const res = await fetch(`${baseUrl}/health`)
    return res.ok
  } catch {
    return false
  }
}

describe('FoodLog API', () => {
  
  describe('Health Check', () => {
    it('GET /health returns healthy status', async () => {
      const res = await fetch(`${baseUrl}/health`)
      assert.strictEqual(res.status, 200)
      
      const data = await res.json()
      assert.strictEqual(data.status, 'healthy')
      assert.strictEqual(data.database, 'sqlite')
      assert.ok(data.vision)
    })
  })

  describe('Entries API', () => {
    let createdEntryId

    it('POST /entries creates a manual entry', async () => {
      const res = await fetch(`${baseUrl}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Test breakfast eggs',
          calories: 380,
          protein: 25,
          carbs: 10,
          fat: 22
        })
      })
      
      assert.strictEqual(res.status, 201)
      
      const data = await res.json()
      assert.ok(data.entry)
      assert.ok(data.entry.id)
      assert.strictEqual(data.entry.description, 'Test breakfast eggs')
      assert.strictEqual(data.entry.calories, 380)
      assert.strictEqual(data.entry.protein, 25)
      
      createdEntryId = data.entry.id
    })

    it('GET /entries/:id returns the entry', async () => {
      const res = await fetch(`${baseUrl}/entries/${createdEntryId}`)
      assert.strictEqual(res.status, 200)
      
      const data = await res.json()
      assert.strictEqual(data.entry.id, createdEntryId)
    })

    it('GET /entries lists all entries', async () => {
      const res = await fetch(`${baseUrl}/entries`)
      assert.strictEqual(res.status, 200)
      
      const data = await res.json()
      assert.ok(Array.isArray(data.entries))
      assert.ok(data.total >= 1)
    })

    it('GET /entries/today returns today\'s entries with totals', async () => {
      const res = await fetch(`${baseUrl}/entries/today`)
      assert.strictEqual(res.status, 200)
      
      const data = await res.json()
      assert.ok(data.date)
      assert.ok(Array.isArray(data.entries))
      assert.ok(data.totals)
      assert.ok(typeof data.totals.calories === 'number')
    })

    it('PUT /entries/:id updates the entry', async () => {
      const res = await fetch(`${baseUrl}/entries/${createdEntryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calories: 420,
          description: 'Updated breakfast eggs'
        })
      })
      
      assert.strictEqual(res.status, 200)
      
      const data = await res.json()
      assert.strictEqual(data.entry.calories, 420)
      assert.strictEqual(data.entry.description, 'Updated breakfast eggs')
    })

    it('DELETE /entries/:id removes the entry', async () => {
      const res = await fetch(`${baseUrl}/entries/${createdEntryId}`, {
        method: 'DELETE'
      })
      
      assert.strictEqual(res.status, 200)
      
      const data = await res.json()
      assert.strictEqual(data.deleted, true)
      
      // Verify it's gone
      const getRes = await fetch(`${baseUrl}/entries/${createdEntryId}`)
      assert.strictEqual(getRes.status, 404)
    })

    it('GET /entries/stats/recent returns summary', async () => {
      const res = await fetch(`${baseUrl}/entries/stats/recent?days=7`)
      assert.strictEqual(res.status, 200)
      
      const data = await res.json()
      assert.strictEqual(data.days, 7)
      assert.ok(Array.isArray(data.summary))
    })
  })

  describe('Vision API', () => {
    it('GET /vision/status returns configuration status', async () => {
      const res = await fetch(`${baseUrl}/vision/status`)
      assert.strictEqual(res.status, 200)
      
      const data = await res.json()
      assert.ok(typeof data.configured === 'boolean')
    })

    it('POST /vision/analyze returns estimate', async () => {
      // Mock photo (tiny 1x1 pixel base64)
      const mockPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      
      const res = await fetch(`${baseUrl}/vision/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: mockPhoto })
      })
      
      assert.strictEqual(res.status, 200)
      
      const data = await res.json()
      assert.ok(data.estimate)
      assert.ok(data.estimate.description)
      assert.ok(typeof data.estimate.calories === 'number')
    })
  })

  describe('Error Handling', () => {
    it('GET /entries/:id with invalid ID returns 400', async () => {
      const res = await fetch(`${baseUrl}/entries/not-a-number`)
      assert.strictEqual(res.status, 400)
    })

    it('POST /entries without required fields returns 201 (partial entry allowed)', async () => {
      const res = await fetch(`${baseUrl}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      // We allow empty entries - they just have null values
      assert.strictEqual(res.status, 201)
      
      // Cleanup
      const data = await res.json()
      if (data.entry?.id) {
        await fetch(`${baseUrl}/entries/${data.entry.id}`, { method: 'DELETE' })
      }
    })

    it('POST /vision/analyze without photo returns 400', async () => {
      const res = await fetch(`${baseUrl}/vision/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      assert.strictEqual(res.status, 400)
    })
  })

  describe('Search API', () => {
    it('GET /entries/search returns matching entries', async () => {
      // First create a test entry to search for
      const createRes = await fetch(`${baseUrl}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Special test sandwich with cheese',
          calories: 450,
          protein: 25
        })
      })
      assert.strictEqual(createRes.status, 201)
      const createData = await createRes.json()
      const testId = createData.entry.id

      try {
        // Search for it
        const searchRes = await fetch(`${baseUrl}/entries/search?q=sandwich`)
        assert.strictEqual(searchRes.status, 200)
        
        const searchData = await searchRes.json()
        assert.ok(Array.isArray(searchData.entries))
        assert.ok(searchData.entries.length >= 1)
        assert.strictEqual(searchData.query, 'sandwich')
        assert.ok(searchData.entries.some(e => e.description.includes('sandwich')))
      } finally {
        // Cleanup
        await fetch(`${baseUrl}/entries/${testId}`, { method: 'DELETE' })
      }
    })

    it('GET /entries/search without query returns 400', async () => {
      const res = await fetch(`${baseUrl}/entries/search`)
      assert.strictEqual(res.status, 400)
    })
  })

  describe('Export API', () => {
    it('GET /entries/export returns JSON by default', async () => {
      const res = await fetch(`${baseUrl}/entries/export`)
      assert.strictEqual(res.status, 200)
      
      const data = await res.json()
      assert.ok(data.exportedAt)
      assert.ok(Array.isArray(data.entries))
    })

    it('GET /entries/export?format=csv returns CSV', async () => {
      const res = await fetch(`${baseUrl}/entries/export?format=csv`)
      assert.strictEqual(res.status, 200)
      assert.ok(res.headers.get('content-type').includes('text/csv'))
      
      const text = await res.text()
      assert.ok(text.includes('id,description,calories'))
    })

    it('GET /entries/export with date range filters entries', async () => {
      const today = new Date().toISOString().split('T')[0]
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const res = await fetch(`${baseUrl}/entries/export?start=${lastWeek}&end=${today}`)
      assert.strictEqual(res.status, 200)
      
      const data = await res.json()
      assert.ok(Array.isArray(data.entries))
    })
  })
})

console.log(`Running tests against ${baseUrl}`)
console.log(`Make sure server is running: npm run dev`)