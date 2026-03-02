// Session-based API - no backend needed!
import { entries, goals, apiKey } from './lib/storage.js';

// Vision API (calls OpenRouter directly from browser)
const VISION_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function analyzeWithVision(photoBase64) {
  const key = await apiKey.get();
  
  if (!key) {
    return getMockEstimate();
  }
  
  try {
    const response = await fetch(VISION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'FoodLog',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a nutrition expert. Analyze this food image and estimate:
1. What food/drinks are shown (be specific)
2. Estimated calories
3. Estimated protein in grams
4. Estimated carbs in grams
5. Estimated fat in grams
6. Your confidence level (0-1)

Respond as JSON only:
{"description": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "confidence": 0.8}`
            },
            {
              type: 'image_url',
              image_url: { url: photoBase64.startsWith('data:') ? photoBase64 : `data:image/jpeg;base64,${photoBase64}` }
            }
          ]
        }],
        max_tokens: 300,
      }),
    });
    
    if (!response.ok) {
      console.error('Vision API error:', response.status);
      return getMockEstimate();
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return getMockEstimate();
  } catch (error) {
    console.error('Vision error:', error);
    return getMockEstimate();
  }
}

function getMockEstimate() {
  const foods = [
    { description: 'Grilled chicken salad', calories: 350, protein: 35, carbs: 15, fat: 18, confidence: 0.7 },
    { description: 'Pasta with marinara', calories: 420, protein: 14, carbs: 72, fat: 8, confidence: 0.65 },
    { description: 'Avocado toast with egg', calories: 380, protein: 16, carbs: 28, fat: 24, confidence: 0.75 },
    { description: 'Smoothie bowl', calories: 290, protein: 12, carbs: 52, fat: 8, confidence: 0.68 },
    { description: 'Burger with fries', calories: 850, protein: 42, carbs: 65, fat: 45, confidence: 0.72 },
  ];
  return foods[Math.floor(Math.random() * foods.length)];
}

// API object matching previous interface (but async)
export const api = {
  // Entries
  getToday: () => entries.getToday(),
  getEntries: () => entries.getToday().then(r => r.entries),
  getRecentStats: (days = 7) => entries.getRecentStats(days),
  createEntry: (data) => entries.create(data),
  updateEntry: (id, data) => entries.update(id, data),
  deleteEntry: (id) => entries.delete(id),
  
  // Vision
  analyzePhoto: analyzeWithVision,
  
  // Goals
  getGoals: () => goals.get(),
  setGoals: (g) => goals.set(g),
  
  // Health check
  health: () => Promise.resolve({ status: 'healthy', storage: 'indexeddb-session' }),
};

// React Query keys
export const keys = {
  today: ['today'],
  entries: (limit, offset) => ['entries', limit, offset],
  recentStats: (days) => ['stats', 'recent', days],
};