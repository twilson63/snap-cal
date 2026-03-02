import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '@/services/api'
import type { FoodEntry } from '@/types'

const PRESETS_STORAGE_KEY = 'foodlog_presets'

export interface FoodPreset {
  id: string
  name: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  createdAt: string
}

interface UsePresetsResult {
  presets: FoodPreset[]
  loading: boolean
  addPreset: (preset: Omit<FoodPreset, 'id' | 'createdAt'>) => Promise<void>
  updatePreset: (id: string, preset: Partial<FoodPreset>) => Promise<void>
  deletePreset: (id: string) => Promise<void>
  createEntryFromPreset: (preset: FoodPreset) => Promise<FoodEntry>
}

export function usePresets(): UsePresetsResult {
  const [presets, setPresets] = useState<FoodPreset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPresets()
  }, [])

  const loadPresets = async () => {
    try {
      const stored = await AsyncStorage.getItem(PRESETS_STORAGE_KEY)
      if (stored) {
        setPresets(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load presets:', err)
    } finally {
      setLoading(false)
    }
  }

  const addPreset = useCallback(async (preset: Omit<FoodPreset, 'id' | 'createdAt'>) => {
    try {
      const newPreset: FoodPreset = {
        ...preset,
        id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      }
      const updated = [...presets, newPreset]
      await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated))
      setPresets(updated)
    } catch (err) {
      console.error('Failed to add preset:', err)
      throw err
    }
  }, [presets])

  const updatePreset = useCallback(async (id: string, updates: Partial<FoodPreset>) => {
    try {
      const updated = presets.map(p => 
        p.id === id ? { ...p, ...updates } : p
      )
      await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated))
      setPresets(updated)
    } catch (err) {
      console.error('Failed to update preset:', err)
      throw err
    }
  }, [presets])

  const deletePreset = useCallback(async (id: string) => {
    try {
      const updated = presets.filter(p => p.id !== id)
      await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated))
      setPresets(updated)
    } catch (err) {
      console.error('Failed to delete preset:', err)
      throw err
    }
  }, [presets])

  const createEntryFromPreset = useCallback(async (preset: FoodPreset): Promise<FoodEntry> => {
    const result = await api.createEntry({
      description: preset.description,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fat: preset.fat,
    })
    return result.entry
  }, [])

  return { 
    presets, 
    loading, 
    addPreset, 
    updatePreset, 
    deletePreset,
    createEntryFromPreset,
  }
}