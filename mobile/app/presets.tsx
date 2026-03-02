import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { usePresets, type FoodPreset } from '@/hooks/usePresets'
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react-native'

export default function PresetsScreen() {
  const { presets, loading, addPreset, updatePreset, deletePreset } = usePresets()
  const [showForm, setShowForm] = useState(false)
  const [editingPreset, setEditingPreset] = useState<FoodPreset | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  })
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
    })
    setEditingPreset(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter a name for the preset')
      return
    }

    const calories = parseInt(form.calories) || 0
    if (calories <= 0) {
      Alert.alert('Error', 'Please enter a valid calorie amount')
      return
    }

    try {
      setSaving(true)
      const presetData = {
        name: form.name.trim(),
        description: form.description.trim(),
        calories,
        protein: parseFloat(form.protein) || 0,
        carbs: parseFloat(form.carbs) || 0,
        fat: parseFloat(form.fat) || 0,
      }

      if (editingPreset) {
        await updatePreset(editingPreset.id, presetData)
      } else {
        await addPreset(presetData)
      }

      resetForm()
    } catch (err) {
      Alert.alert('Error', 'Failed to save preset. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (preset: FoodPreset) => {
    setEditingPreset(preset)
    setForm({
      name: preset.name,
      description: preset.description,
      calories: preset.calories.toString(),
      protein: preset.protein?.toString() || '',
      carbs: preset.carbs?.toString() || '',
      fat: preset.fat?.toString() || '',
    })
    setShowForm(true)
  }

  const handleDelete = (preset: FoodPreset) => {
    Alert.alert(
      'Delete Preset',
      `Are you sure you want to delete "${preset.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePreset(preset.id),
        },
      ]
    )
  }

  const PresetCard = ({ preset }: { preset: FoodPreset }) => (
    <View style={styles.presetCard}>
      <View style={styles.presetHeader}>
        <View style={styles.presetInfo}>
          <Text style={styles.presetName}>{preset.name}</Text>
          {preset.description ? (
            <Text style={styles.presetDescription}>{preset.description}</Text>
          ) : null}
        </View>
        <View style={styles.presetActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleEdit(preset)}
          >
            <Edit2 size={18} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDelete(preset)}
          >
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.presetNutrition}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{preset.calories}</Text>
          <Text style={styles.nutritionLabel}>cal</Text>
        </View>
        {preset.protein > 0 && (
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{preset.protein}g</Text>
            <Text style={styles.nutritionLabel}>protein</Text>
          </View>
        )}
        {preset.carbs > 0 && (
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{preset.carbs}g</Text>
            <Text style={styles.nutritionLabel}>carbs</Text>
          </View>
        )}
        {preset.fat > 0 && (
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{preset.fat}g</Text>
            <Text style={styles.nutritionLabel}>fat</Text>
          </View>
        )}
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Food Presets</Text>
          <Text style={styles.subtitle}>
            Save common foods for quick logging
          </Text>
        </View>

        {!showForm && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(true)}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Preset</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editingPreset ? 'Edit Preset' : 'New Preset'}
              </Text>
              <TouchableOpacity onPress={resetForm}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Name (e.g., Morning Coffee)"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              placeholderTextColor="#9ca3af"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={2}
            />

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Calories *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={form.calories}
                  onChangeText={(text) => setForm({ ...form, calories: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Macros (optional)</Text>
            <View style={styles.macroRow}>
              <View style={styles.inputThird}>
                <Text style={styles.inputLabel}>Protein</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={form.protein}
                  onChangeText={(text) => setForm({ ...form, protein: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.inputThird}>
                <Text style={styles.inputLabel}>Carbs</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={form.carbs}
                  onChangeText={(text) => setForm({ ...form, carbs: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.inputThird}>
                <Text style={styles.inputLabel}>Fat</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={form.fat}
                  onChangeText={(text) => setForm({ ...form, fat: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>
                    {editingPreset ? 'Update Preset' : 'Save Preset'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 32 }} />
        ) : presets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No presets yet</Text>
            <Text style={styles.emptyText}>
              Create presets for foods you eat regularly to log them faster
            </Text>
          </View>
        ) : (
          <View style={styles.presetsList}>
            <Text style={styles.listTitle}>Your Presets ({presets.length})</Text>
            {presets.map((preset) => (
              <PresetCard key={preset.id} preset={preset} />
            ))}
          </View>
        )}
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
    marginBottom: 16,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputRow: {
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputThird: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  },
  presetsList: {
    gap: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  presetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  presetDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  presetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  presetNutrition: {
    flexDirection: 'row',
    gap: 16,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
})