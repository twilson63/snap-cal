import { useState, useEffect } from 'react'
import { goals as goalsApi } from '../lib/storage.js'

const DEFAULT_GOALS = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
}

export function useGoals() {
  const [goals, setGoalsState] = useState(DEFAULT_GOALS)
  const [loaded, setLoaded] = useState(false)

  // Load goals from encrypted IndexedDB on mount
  useEffect(() => {
    goalsApi.get().then(savedGoals => {
      if (savedGoals) {
        setGoalsState({ ...DEFAULT_GOALS, ...savedGoals })
      }
      setLoaded(true)
    }).catch(e => {
      console.error('Failed to load goals:', e)
      setLoaded(true)
    })
  }, [])

  // Save goals to encrypted storage when changed
  useEffect(() => {
    if (!loaded) return
    goalsApi.set(goals).catch(e => {
      console.error('Failed to save goals:', e)
    })
  }, [goals, loaded])

  const setGoals = (newGoals) => {
    setGoalsState(prev => ({ ...prev, ...newGoals }))
  }

  const resetGoals = () => {
    setGoalsState(DEFAULT_GOALS)
  }

  return { goals, setGoals, resetGoals, defaults: DEFAULT_GOALS, loaded }
}

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      if (saved !== null) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e)
    }
    return defaultValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}