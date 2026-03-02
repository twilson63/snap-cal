import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useRouter } from 'expo-router'
import { api } from '@/services/api'
import type { FoodEntry } from '@/types'

export default function SearchScreen() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    
    try {
      setLoading(true)
      setError(null)
      setSearched(true)
      Keyboard.dismiss()
      
      const response = await api.searchEntries(query.trim())
      setResults(response.entries || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${dateStr}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${dateStr}`
    }
    return dateStr
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const EntryItem = ({ item }: { item: FoodEntry }) => (
    <Link href={`/entry/${item.id}`} asChild>
      <TouchableOpacity style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.entryInfo}>
            <Text style={styles.entryDescription} numberOfLines={2}>
              {item.description || 'Food Entry'}
            </Text>
            <View style={styles.entryMeta}>
              <Text style={styles.entryDate}>{formatDate(item.timestamp)}</Text>
              <Text style={styles.entryTime}>{formatTime(item.timestamp)}</Text>
            </View>
          </View>
          <View style={styles.entryCalories}>
            <Text style={styles.entryCaloriesValue}>{item.calories || 0}</Text>
            <Text style={styles.entryCaloriesLabel}>cal</Text>
          </View>
        </View>
        
        <View style={styles.entryMacros}>
          {item.protein !== null && item.protein !== undefined && (
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{item.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
          )}
          {item.carbs !== null && item.carbs !== undefined && (
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{item.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
          )}
          {item.fat !== null && item.fat !== undefined && (
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{item.fat}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          )}
        </View>
        
        {item.estimated && (
          <View style={styles.estimatedBadge}>
            <Text style={styles.estimatedText}>AI Estimated</Text>
          </View>
        )}
      </TouchableOpacity>
    </Link>
  )

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>Find past entries</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search food entries..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setQuery('')
                setResults([])
                setSearched(false)
              }}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchButton, !query.trim() && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={!query.trim()}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={EntryItem}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            searched ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyText}>
                  No entries match "{query}"
                </Text>
                <Text style={styles.emptyHint}>
                  Try different keywords or check spelling
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔎</Text>
                <Text style={styles.emptyTitle}>Search your food log</Text>
                <Text style={styles.emptyText}>
                  Find past entries by description
                </Text>
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Try searching for:</Text>
                  <View style={styles.suggestionsRow}>
                    {['chicken', 'salad', 'coffee', 'breakfast'].map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion}
                        style={styles.suggestionChip}
                        onPress={() => {
                          setQuery(suggestion)
                          handleSearch()
                        }}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  searchButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  resultsList: {
    padding: 16,
    paddingBottom: 100,
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryInfo: {
    flex: 1,
    marginRight: 12,
  },
  entryDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  entryMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  entryDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  entryTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  entryCalories: {
    alignItems: 'flex-end',
  },
  entryCaloriesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  entryCaloriesLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  entryMacros: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  macroLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  estimatedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  estimatedText: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 13,
    color: '#9ca3af',
  },
  suggestionsContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  suggestionsTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionChip: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  suggestionText: {
    color: '#374151',
    fontSize: 14,
  },
})