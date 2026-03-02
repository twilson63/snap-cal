import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { BarCodeScanner } from 'expo-barcode-scanner'
import { api } from '@/services/api'
import { usePresets } from '@/hooks/usePresets'
import type { NutritionEstimate } from '@/types'

type InputMode = 'photo' | 'barcode' | 'manual'

export default function AddEntryScreen() {
  const params = useLocalSearchParams<{ preset?: string }>()
  const { presets } = usePresets()
  
  const [mode, setMode] = useState<InputMode>('photo')
  const [description, setDescription] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [visionEstimate, setVisionEstimate] = useState<NutritionEstimate | null>(null)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const [barcodeResult, setBarcodeResult] = useState<any>(null)
  const [saveAsPreset, setSaveAsPreset] = useState(false)
  const [presetName, setPresetName] = useState('')

  // Request camera permission for barcode scanner
  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === 'granted')
    }
    getBarCodeScannerPermissions()
  }, [])

  // Load preset if provided in URL params
  useEffect(() => {
    if (params.preset && presets.length > 0) {
      const preset = presets.find(p => p.id === params.preset)
      if (preset) {
        setDescription(preset.description)
        setCalories(String(preset.calories))
        setProtein(String(preset.protein || ''))
        setCarbs(String(preset.carbs || ''))
        setFat(String(preset.fat || ''))
        setMode('manual')
      }
    }
  }, [params.preset, presets])

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return
    setScanned(true)
    setAnalyzing(true)

    try {
      const result = await api.lookupBarcode(data)
      
      if (result.error && !result.description) {
        Alert.alert('Not Found', `No product found for barcode ${data}`)
        setScanned(false)
      } else {
        setBarcodeResult(result)
        setDescription(result.description)
        setCalories(String(Math.round(result.calories)))
        setProtein(String(result.protein))
        setCarbs(String(result.carbs))
        setFat(String(result.fat))
      }
    } catch (err) {
      console.error('Barcode lookup error:', err)
      Alert.alert('Error', 'Failed to look up barcode')
      setScanned(false)
    } finally {
      setAnalyzing(false)
    }
  }

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please grant camera access to add food photos')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        base64: true,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        setPhotoUri(asset.uri)
        setPhotoBase64(asset.base64 || null)
        setAnalyzing(true)

        try {
          const { estimate } = await api.analyzePhoto(asset.base64!)
          setVisionEstimate(estimate)

          // Auto-fill from estimate
          setDescription(estimate.description)
          setCalories(String(estimate.calories))
          setProtein(String(estimate.protein))
          setCarbs(String(estimate.carbs))
          setFat(String(estimate.fat))
        } catch (err) {
          console.error('Vision analysis failed:', err)
          Alert.alert('Analysis failed', 'Could not analyze image. Please enter details manually.')
        } finally {
          setAnalyzing(false)
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      Alert.alert('Error', 'Failed to open camera')
    }
  }

  const handleSubmit = async () => {
    if (!description && !calories && !photoBase64) {
      Alert.alert('Missing info', 'Please enter at least a description or calories, or take a photo')
      return
    }

    setLoading(true)
    try {
      const entryData = {
        photo: photoBase64 || undefined,
        description: description || undefined,
        calories: calories ? parseInt(calories, 10) : undefined,
        protein: protein ? parseFloat(protein) : undefined,
        carbs: carbs ? parseFloat(carbs) : undefined,
        fat: fat ? parseFloat(fat) : undefined,
        estimated: visionEstimate?.estimated ?? false,
      }

      await api.createEntry(entryData)
      router.back()
    } catch (err) {
      console.error('Create entry error:', err)
      Alert.alert('Error', 'Failed to create entry')
    } finally {
      setLoading(false)
    }
  }

  const { addPreset } = usePresets()

  const handleSaveAsPreset = async () => {
    if (!description.trim()) {
      Alert.alert('Missing info', 'Please enter a description for the preset')
      return
    }
    if (!calories || parseInt(calories, 10) <= 0) {
      Alert.alert('Missing info', 'Please enter calories for the preset')
      return
    }

    try {
      await addPreset({
        name: presetName.trim() || description.trim().slice(0, 30),
        description: description.trim(),
        calories: parseInt(calories, 10),
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
      })
      Alert.alert('Saved', 'Preset saved successfully!')
      setSaveAsPreset(false)
      setPresetName('')
    } catch (err) {
      Alert.alert('Error', 'Failed to save preset')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'photo' && styles.modeButtonActive]}
            onPress={() => { 
              setMode('photo'); 
              setVisionEstimate(null); 
              setPhotoBase64(null);
              setScanned(false);
              setBarcodeResult(null);
            }}
          >
            <Text style={[styles.modeText, mode === 'photo' && styles.modeTextActive]}>
              📷 Photo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'barcode' && styles.modeButtonActive]}
            onPress={() => { 
              setMode('barcode'); 
              setScanned(false);
              setBarcodeResult(null);
            }}
          >
            <Text style={[styles.modeText, mode === 'barcode' && styles.modeTextActive]}>
              📱 Barcode
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'manual' && styles.modeButtonActive]}
            onPress={() => setMode('manual')}
          >
            <Text style={[styles.modeText, mode === 'manual' && styles.modeTextActive]}>
              ✏️ Manual
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'photo' ? (
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <Text style={styles.photoButtonIcon}>📷</Text>
              <Text style={styles.photoButtonText}>Take a photo of your food</Text>
            </TouchableOpacity>

            {photoUri && (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.retakeButton}
                  onPress={() => { setPhotoUri(null); setPhotoBase64(null); setVisionEstimate(null); }}
                >
                  <Text style={styles.retakeButtonText}>✕ Retake</Text>
                </TouchableOpacity>
              </View>
            )}

            {analyzing && (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.analyzingText}>Analyzing your food...</Text>
              </View>
            )}

            {visionEstimate && !analyzing && (
              <View style={styles.estimateCard}>
                <Text style={styles.estimateTitle}>
                  {visionEstimate.fallback ? '⚠️ Fallback Estimate' : '✨ AI Estimate'}
                </Text>
                <Text style={styles.estimateModel}>
                  Model: {visionEstimate.model}
                </Text>
                <Text style={styles.estimateConfidence}>
                  Confidence: {Math.round(visionEstimate.confidence * 100)}%
                </Text>
                {visionEstimate.notes && (
                  <Text style={styles.estimateNotes}>{visionEstimate.notes}</Text>
                )}
              </View>
            )}
          </View>
        ) : mode === 'barcode' ? (
          <View style={styles.barcodeSection}>
            {hasPermission === null ? (
              <Text style={styles.permissionText}>Requesting camera permission...</Text>
            ) : !hasPermission ? (
              <View style={styles.permissionDenied}>
                <Text style={styles.permissionText}>Camera permission denied</Text>
                <TouchableOpacity 
                  style={styles.permissionButton}
                  onPress={async () => {
                    const { status } = await BarCodeScanner.requestPermissionsAsync()
                    setHasPermission(status === 'granted')
                  }}
                >
                  <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.scannerContainer}>
                <BarCodeScanner
                  onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                  style={styles.scanner}
                />
                <View style={styles.scannerOverlay}>
                  <View style={styles.scanTarget} />
                  <Text style={styles.scannerText}>
                    {scanned ? 'Processing...' : 'Point camera at barcode'}
                  </Text>
                </View>
              </View>
            )}

            {analyzing && (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.analyzingText}>Looking up product...</Text>
              </View>
            )}

            {barcodeResult && !analyzing && (
              <View style={styles.barcodeResultCard}>
                <View style={styles.barcodeHeader}>
                  <Text style={styles.barcodeIcon}>✅</Text>
                  <Text style={styles.barcodeTitle}>Product Found!</Text>
                </View>
                {barcodeResult.imageUrl && (
                  <Image source={{ uri: barcodeResult.imageUrl }} style={styles.productImage} />
                )}
                <Text style={styles.productName}>{barcodeResult.description}</Text>
                {barcodeResult.brand && (
                  <Text style={styles.productBrand}>{barcodeResult.brand}</Text>
                )}
                <Text style={styles.nutrientsLabel}>
                  Per 100g: {Math.round(barcodeResult.calories)} cal | {Math.round(barcodeResult.protein)}g protein
                </Text>
                <TouchableOpacity 
                  style={styles.rescanButton}
                  onPress={() => { setScanned(false); setBarcodeResult(null); }}
                >
                  <Text style={styles.rescanButtonText}>Scan Another</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}

        {/* Manual Input Fields */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="What did you eat?"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Calories *</Text>
            <TextInput
              style={styles.input}
              value={calories}
              onChangeText={setCalories}
              placeholder="Total calories"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.macroRow}>
            <View style={[styles.field, styles.macroField]}>
              <Text style={styles.label}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                value={protein}
                onChangeText={setProtein}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.field, styles.macroField]}>
              <Text style={styles.label}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                value={carbs}
                onChangeText={setCarbs}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.field, styles.macroField]}>
              <Text style={styles.label}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                value={fat}
                onChangeText={setFat}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Save Entry</Text>
            )}
          </TouchableOpacity>
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
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  modeTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  photoSection: {
    marginBottom: 20,
  },
  photoButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  photoButtonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  photoButtonText: {
    fontSize: 16,
    color: '#4b5563',
  },
  photoPreview: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  retakeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  analyzingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  analyzingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  estimateCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  estimateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  estimateModel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  estimateConfidence: {
    fontSize: 12,
    color: '#6b7280',
  },
  estimateNotes: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  macroRow: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  macroField: {
    flex: 1,
    marginHorizontal: 6,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Barcode Scanner Styles
  barcodeSection: {
    marginBottom: 20,
  },
  permissionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  permissionDenied: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scannerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 300,
    position: 'relative',
  },
  scanner: {
    width: '100%',
    height: '100%',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanTarget: {
    width: 250,
    height: 100,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 16,
    fontWeight: '500',
  },
  barcodeResultCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  barcodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barcodeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  barcodeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  productBrand: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  nutrientsLabel: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 8,
  },
  rescanButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rescanButtonText: {
    color: '#2563eb',
    fontWeight: '600',
  },
})