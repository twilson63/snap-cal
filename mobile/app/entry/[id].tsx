import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Image, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { api } from '@/services/api'
import type { FoodEntry } from '@/types'

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [entry, setEntry] = useState<FoodEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadEntry()
  }, [id])

  const loadEntry = async () => {
    try {
      setLoading(true)
      const data = await api.getEntry(parseInt(id, 10))
      setEntry(data)
    } catch (err) {
      console.error('Failed to load entry:', err)
      Alert.alert('Error', 'Failed to load entry')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true)
              await api.deleteEntry(parseInt(id, 10))
              router.back()
            } catch (err) {
              console.error('Failed to delete:', err)
              Alert.alert('Error', 'Failed to delete entry')
              setDeleting(false)
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (!entry) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Entry not found</Text>
      </View>
    )
  }

  const timestamp = new Date(entry.timestamp)
  const dateStr = timestamp.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const timeStr = timestamp.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Photo */}
        {(entry.photo || entry.photoUrl) && (
          <View style={styles.photoContainer}>
            <Image 
              source={{ uri: entry.photoUrl || `data:image/jpeg;base64,${entry.photo}` }} 
              style={styles.photo}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.description}>
            {entry.description || 'Food Entry'}
          </Text>
          <Text style={styles.datetime}>
            {dateStr} at {timeStr}
          </Text>
          {entry.estimated && (
            <View style={styles.estimatedBadge}>
              <Text style={styles.estimatedText}>AI Estimated</Text>
            </View>
          )}
        </View>

        {/* Calories */}
        <View style={styles.caloriesCard}>
          <Text style={styles.caloriesValue}>
            {entry.calories ?? 0}
          </Text>
          <Text style={styles.caloriesUnit}>calories</Text>
        </View>

        {/* Macros */}
        <View style={styles.macrosCard}>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>
              {Math.round(entry.protein ?? 0)}g
            </Text>
            {(entry.protein ?? 0) && (
              <View style={[styles.macroBar, { width: `${Math.min(100, (entry.protein! / 50) * 100)}%` as any }]} />
            )}
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>
              {Math.round(entry.carbs ?? 0)}g
            </Text>
            {(entry.carbs ?? 0) && (
              <View style={[styles.macroBarCarbs, { width: `${Math.min(100, (entry.carbs! / 300) * 100)}%` as any }]} />
            )}
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Fat</Text>
            <Text style={styles.macroValue}>
              {Math.round(entry.fat ?? 0)}g
            </Text>
            {(entry.fat ?? 0) && (
              <View style={[styles.macroBarFat, { width: `${Math.min(100, (entry.fat! / 65) * 100)}%` as any }]} />
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push(`/edit/${id}` as any)}
          >
            <Text style={styles.editButtonText}>Edit Entry</Text>
          </TouchableOpacity>
          
          <Text style={styles.deleteButton} onPress={handleDelete}>
            {deleting ? 'Deleting...' : 'Delete Entry'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
  },
  photoContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  datetime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  estimatedBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 12,
  },
  estimatedText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600',
  },
  caloriesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caloriesValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  caloriesUnit: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  macrosCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  macroItem: {
    marginBottom: 16,
  },
  macroLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  macroBar: {
    height: 4,
    backgroundColor: '#ef4444',
    borderRadius: 2,
    marginTop: 4,
  },
  macroBarCarbs: {
    height: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginTop: 4,
  },
  macroBarFat: {
    height: 4,
    backgroundColor: '#f59e0b',
    borderRadius: 2,
    marginTop: 4,
  },
  actions: {
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '500',
  },
})