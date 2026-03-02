import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Share } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { api } from '@/services/api'
import { useGoals } from '@/hooks/useGoals'

export default function SettingsScreen() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  const [apiInfo, setApiInfo] = useState<{ database: string; vision: { configured: boolean; model: string } } | null>(null)
  const [editingGoals, setEditingGoals] = useState(false)
  const [tempGoals, setTempGoals] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 })

  const { goals, updateGoals, resetGoals } = useGoals()

  useEffect(() => {
    checkApiHealth()
  }, [])

  const checkApiHealth = async () => {
    try {
      setApiStatus('checking')
      const health = await api.health()
      setApiStatus('ok')
      setApiInfo({
        database: health.database,
        vision: health.vision,
      })
    } catch (err) {
      setApiStatus('error')
      setApiInfo(null)
    }
  }

  const openEditGoals = () => {
    setTempGoals(goals)
    setEditingGoals(true)
  }

  const saveGoals = async () => {
    try {
      await updateGoals(tempGoals)
      setEditingGoals(false)
      Alert.alert('Goals Saved', 'Your daily goals have been updated.')
    } catch (err) {
      Alert.alert('Error', 'Failed to save goals. Please try again.')
    }
  }

  const GoalInput = ({ label, value, unit, onChange }: { label: string; value: number; unit: string; onChange: (v: number) => void }) => (
    <View style={styles.goalRow}>
      <Text style={styles.goalLabel}>{label}</Text>
      <View style={styles.goalInputRow}>
        <TouchableOpacity
          style={styles.goalButton}
          onPress={() => onChange(Math.max(0, value - 10))}
        >
          <Text style={styles.goalButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.goalValue}>{value}</Text>
        <TouchableOpacity
          style={styles.goalButton}
          onPress={() => onChange(value + 10)}
        >
          <Text style={styles.goalButtonText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.goalUnit}>{unit}</Text>
      </View>
    </View>
  )

  const resetGoalsToDefaults = async () => {
    await resetGoals()
    Alert.alert('Goals Reset', 'Your daily goals have been reset to defaults.')
  }

  const exportJSON = async () => {
    try {
      Alert.alert('Exporting...', 'Fetching your data...')
      const data = await api.exportEntries('json') as any
      
      const jsonString = JSON.stringify(data, null, 2)
      const fileName = `foodlog-export-${new Date().toISOString().split('T')[0]}.json`
      const filePath = `${FileSystem.documentDirectory}${fileName}`
      
      await FileSystem.writeAsStringAsync(filePath, jsonString, {
        encoding: FileSystem.EncodingType.UTF8
      })
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export FoodLog Data'
        })
      } else {
        Alert.alert('Export Complete', `Data exported to ${fileName}`)
      }
    } catch (err) {
      console.error('Export failed:', err)
      Alert.alert('Export Failed', 'Could not export data. Please try again.')
    }
  }

  const exportCSV = async () => {
    try {
      Alert.alert('Exporting...', 'Fetching your data...')
      const csvString = await api.exportEntries('csv') as string
      
      const fileName = `foodlog-export-${new Date().toISOString().split('T')[0]}.csv`
      const filePath = `${FileSystem.documentDirectory}${fileName}`
      
      await FileSystem.writeAsStringAsync(filePath, csvString, {
        encoding: FileSystem.EncodingType.UTF8
      })
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export FoodLog Data'
        })
      } else {
        Alert.alert('Export Complete', `Data exported to ${fileName}`)
      }
    } catch (err) {
      console.error('Export failed:', err)
      Alert.alert('Export Failed', 'Could not export data. Please try again.')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your experience</Text>
        </View>

        {/* Daily Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Goals</Text>
            {!editingGoals ? (
              <TouchableOpacity onPress={openEditGoals}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          
          {!editingGoals ? (
            <View style={styles.goalsCard}>
              <View style={styles.goalDisplayRow}>
                <View style={styles.goalDisplayItem}>
                  <Text style={styles.goalDisplayValue}>{goals.calories}</Text>
                  <Text style={styles.goalDisplayLabel}>Calories</Text>
                </View>
                <View style={styles.goalDisplayItem}>
                  <Text style={styles.goalDisplayValue}>{goals.protein}g</Text>
                  <Text style={styles.goalDisplayLabel}>Protein</Text>
                </View>
                <View style={styles.goalDisplayItem}>
                  <Text style={styles.goalDisplayValue}>{goals.carbs}g</Text>
                  <Text style={styles.goalDisplayLabel}>Carbs</Text>
                </View>
                <View style={styles.goalDisplayItem}>
                  <Text style={styles.goalDisplayValue}>{goals.fat}g</Text>
                  <Text style={styles.goalDisplayLabel}>Fat</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.editGoalsCard}>
              <GoalInput
                label="Calories"
                value={tempGoals.calories}
                unit="kcal"
                onChange={(v) => setTempGoals({ ...tempGoals, calories: v })}
              />
              <GoalInput
                label="Protein"
                value={tempGoals.protein}
                unit="g"
                onChange={(v) => setTempGoals({ ...tempGoals, protein: v })}
              />
              <GoalInput
                label="Carbs"
                value={tempGoals.carbs}
                unit="g"
                onChange={(v) => setTempGoals({ ...tempGoals, carbs: v })}
              />
              <GoalInput
                label="Fat"
                value={tempGoals.fat}
                unit="g"
                onChange={(v) => setTempGoals({ ...tempGoals, fat: v })}
              />
              
              <View style={styles.editGoalsButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingGoals(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={saveGoals}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.resetButton} onPress={resetGoals}>
                <Text style={styles.resetButtonText}>Reset to Defaults</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* API Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusIndicator}>
                {apiStatus === 'checking' && (
                  <>
                    <ActivityIndicator size="small" color="#6b7280" />
                    <Text style={[styles.statusText, { color: '#6b7280' }]}>Checking...</Text>
                  </>
                )}
                {apiStatus === 'ok' && (
                  <>
                    <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
                    <Text style={[styles.statusText, { color: '#22c55e' }]}>Connected</Text>
                  </>
                )}
                {apiStatus === 'error' && (
                  <>
                    <View style={[styles.statusDot, { backgroundColor: '#ef4444' }]} />
                    <Text style={[styles.statusText, { color: '#ef4444' }]}>Disconnected</Text>
                  </>
                )}
              </View>
            </View>
            
            {apiInfo && (
              <>
                <View style={styles.statusDivider} />
                <View style={styles.statusDetails}>
                  <View style={styles.statusDetailRow}>
                    <Text style={styles.statusDetailLabel}>Database</Text>
                    <Text style={styles.statusDetailValue}>{apiInfo.database}</Text>
                  </View>
                  <View style={styles.statusDetailRow}>
                    <Text style={styles.statusDetailLabel}>Vision API</Text>
                    <Text style={styles.statusDetailValue}>
                      {apiInfo.vision.configured ? `Active (${apiInfo.vision.model})` : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </>
            )}
            
            {apiStatus === 'error' && (
              <View style={styles.errorHelp}>
                <Text style={styles.errorHelpText}>
                  Make sure the API is running on port 3001
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={checkApiHealth}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Export Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Data</Text>
          <View style={styles.exportCard}>
            <Text style={styles.exportDescription}>
              Download your food log data as JSON or CSV for backup or analysis.
            </Text>
            <View style={styles.exportButtons}>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={exportJSON}
              >
                <Text style={styles.exportButtonIcon}>📋</Text>
                <Text style={styles.exportButtonText}>Export as JSON</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportButton, styles.exportButtonSecondary]}
                onPress={exportCSV}
              >
                <Text style={styles.exportButtonIcon}>📊</Text>
                <Text style={styles.exportButtonText}>Export as CSV</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>FoodLog</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              Track your meals with AI-powered nutrition analysis. Take a photo of your food and let the AI estimate calories, protein, carbs, and fat.
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  editButton: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  goalsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  goalDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  goalDisplayItem: {
    alignItems: 'center',
  },
  goalDisplayValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  goalDisplayLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  editGoalsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  goalLabel: {
    fontSize: 16,
    color: '#374151',
  },
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalButtonText: {
    fontSize: 18,
    color: '#374151',
  },
  goalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
    minWidth: 50,
    textAlign: 'center',
  },
  goalUnit: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  editGoalsButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    marginTop: 12,
    alignItems: 'center',
    padding: 8,
  },
  resetButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
  statusDetails: {
    gap: 8,
  },
  statusDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusDetailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusDetailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  errorHelp: {
    marginTop: 12,
    alignItems: 'center',
  },
  errorHelpText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  aboutVersion: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  exportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  exportDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  exportButtons: {
    gap: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonSecondary: {
    backgroundColor: '#6b7280',
  },
  exportButtonIcon: {
    fontSize: 18,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})