import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const GOALS_STORAGE_KEY = 'foodlog_goals'

export interface Goals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

const DEFAULT_GOALS: Goals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
}

interface UseGoalsResult {
  goals: Goals
  loading: boolean
  updateGoals: (newGoals: Partial<Goals>) => Promise<void>
  resetGoals: () => Promise<void>
}

export function useGoals(): UseGoalsResult {
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const stored = await AsyncStorage.getItem(GOALS_STORAGE_KEY)
      if (stored) {
        setGoals(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load goals:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateGoals = useCallback(async (newGoals: Partial<Goals>) => {
    try {
      const updated = { ...goals, ...newGoals }
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(updated))
      setGoals(updated)
    } catch (err) {
      console.error('Failed to save goals:', err)
      throw err
    }
  }, [goals])

  const resetGoals = useCallback(async () => {
    try {
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(DEFAULT_GOALS))
      setGoals(DEFAULT_GOALS)
    } catch (err) {
      console.error('Failed to reset goals:', err)
      throw err
    }
  }, [])

  return { goals, loading, updateGoals, resetGoals }
}