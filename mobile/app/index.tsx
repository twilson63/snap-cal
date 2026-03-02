import React from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { useToday } from '@/hooks/useApi'
import { useGoals } from '@/hooks/useGoals'
import { usePresets } from '@/hooks/usePresets'
import { ProgressRing } from '@/components/StatCard'
import { EntryCard } from '@/components/EntryCard'

export default function HomeScreen() {
  const { data, loading, error, refresh } = useToday()
  const { goals } = useGoals()
  const { presets } = usePresets()

  const today = data?.date ?? new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {/* Header with Navigation */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.dateLabel}>{today}</Text>
            <Text style={styles.title}>FoodLog</Text>
          </View>
          <View style={styles.headerButtons}>
            <Link href="/history" asChild>
              <TouchableOpacity style={styles.headerButton}>
                <Text style={styles.headerButtonText}>📊 History</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/settings" asChild>
              <TouchableOpacity style={styles.headerButton}>
                <Text style={styles.headerButtonText}>⚙️</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
        
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Today's Stats */}
        <View style={styles.statsCard}>
          <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesValue}>
              {data?.totals?.calories ?? 0}
            </Text>
            <Text style={styles.caloriesLabel}>of {goals.calories} calories</Text>
            <View style={styles.caloriesBar}>
              <View 
                style={[
                  styles.caloriesBarFill, 
                  { 
                    width: `${Math.min(100, ((data?.totals?.calories ?? 0) / goals.calories) * 100)}%`,
                    backgroundColor: ((data?.totals?.calories ?? 0) > goals.calories) ? '#ef4444' : '#2563eb'
                  }
                ]} 
              />
            </View>
            {((data?.totals?.calories ?? 0) > goals.calories) && (
              <Text style={styles.overBudget}>⚠️ Over daily goal by {((data?.totals?.calories ?? 0) - goals.calories)} cal</Text>
            )}
          </View>

          <View style={styles.macrosRow}>
            <ProgressRing
              label="Protein"
              value={data?.totals?.protein ?? 0}
              goal={goals.protein}
              color="#ef4444"
            />
            <ProgressRing
              label="Carbs"
              value={data?.totals?.carbs ?? 0}
              goal={goals.carbs}
              color="#3b82f6"
            />
            <ProgressRing
              label="Fat"
              value={data?.totals?.fat ?? 0}
              goal={goals.fat}
              color="#f59e0b"
            />
          </View>
        </View>

        {/* Quick Add from Presets */}
        {presets.length > 0 && (
          <View style={styles.presetsSection}>
            <View style={styles.presetsHeader}>
              <Text style={styles.sectionTitle}>Quick Add</Text>
              <Link href="/presets" asChild>
                <TouchableOpacity>
                  <Text style={styles.manageLink}>Manage</Text>
                </TouchableOpacity>
              </Link>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsList}
            >
              {presets.slice(0, 5).map((preset) => (
                <Link key={preset.id} href={`/add?preset=${preset.id}`} asChild>
                  <TouchableOpacity style={styles.presetChip}>
                    <Text style={styles.presetEmoji}>🍽️</Text>
                    <Text style={styles.presetName} numberOfLines={1}>{preset.name}</Text>
                    <Text style={styles.presetCals}>{preset.calories} cal</Text>
                  </TouchableOpacity>
                </Link>
              ))}
              <Link href="/presets" asChild>
                <TouchableOpacity style={[styles.presetChip, styles.addPresetChip]}>
                  <Text style={styles.addPresetText}>+ Add</Text>
                </TouchableOpacity>
              </Link>
            </ScrollView>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Link href="/add" asChild>
            <TouchableOpacity style={styles.quickAddButton}>
              <Text style={styles.quickAddIcon}>📷</Text>
              <Text style={styles.quickAddText}>Add Food</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Today's Entries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Today's Entries ({data?.count ?? 0})
          </Text>

          {loading && !data ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : !data?.entries?.length ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyText}>No entries yet today</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first meal
              </Text>
            </View>
          ) : (
            data?.entries?.map((entry) => (
              <Link
                key={entry.id}
                href={`/entry/${entry.id}`}
                asChild
              >
                <EntryCard entry={entry} />
              </Link>
            ))
          )}
        </View>

        {/* Quick Stats */}
        {data && data.count > 0 && (
          <View style={styles.quickStats}>
            <Text style={styles.quickStatText}>
              📊 Average: {Math.round((data.totals?.calories ?? 0) / Math.max(1, data.count))} cal/entry
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <Link href="/add" style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </Link>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  headerButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  caloriesContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  caloriesValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 8,
  },
  caloriesBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  caloriesBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  overBudget: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
    fontWeight: '500',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  quickActions: {
    marginBottom: 16,
  },
  quickAddButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAddIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  quickAddText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  quickStats: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  quickStatText: {
    color: '#1e40af',
    fontSize: 14,
  },
  presetsSection: {
    marginBottom: 16,
  },
  presetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  manageLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  presetsList: {
    paddingVertical: 4,
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginRight: 8,
  },
  presetEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  presetName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  presetCals: {
    fontSize: 11,
    color: '#6b7280',
  },
  addPresetChip: {
    minWidth: 70,
    justifyContent: 'center',
  },
  addPresetText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
})