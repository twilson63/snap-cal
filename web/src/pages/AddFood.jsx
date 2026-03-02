import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, keys } from '../api.js';
import { Camera, Upload, X, Loader } from 'lucide-react';

export default function AddFood() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const basePath = sessionId ? `/s/${sessionId}` : '';
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState('select'); // select, photo, edit, success
  const [photo, setPhoto] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [editData, setEditData] = useState({
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handle photo capture/upload
  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result;
      setPhoto(base64);
      setStep('photo');
      
      // Analyze photo
      setIsAnalyzing(true);
      try {
        const result = await api.analyzePhoto(base64);
        setAnalysis(result);
        setEditData({
          description: result.description || '',
          calories: result.calories?.toString() || '',
          protein: result.protein?.toString() || '',
          carbs: result.carbs?.toString() || '',
          fat: result.fat?.toString() || '',
        });
      } catch (err) {
        console.error('Analysis failed:', err);
      }
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  // Save entry
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      return api.createEntry(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.today });
      setStep('success');
    },
    onError: (err) => {
      alert('Failed to save entry: ' + err.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      photo,
      description: editData.description,
      calories: parseInt(editData.calories) || 0,
      protein: parseInt(editData.protein) || 0,
      carbs: parseInt(editData.carbs) || 0,
      fat: parseInt(editData.fat) || 0,
      confidence: analysis?.confidence || 0.5,
    });
  };

  // Photo selection step
  if (step === 'select') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Entry</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">How would you like to log your food?</p>
        </div>

        <div className="space-y-3">
          <label className="card-hover p-6 flex items-center gap-4 cursor-pointer">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <Camera className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">Take Photo</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Use camera to capture your meal</div>
            </div>
          </label>

          <label className="card-hover p-6 flex items-center gap-4 cursor-pointer">
            <input 
              type="file" 
              accept="image/*"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-accent-100 dark:bg-accent-900 flex items-center justify-center">
              <Upload className="w-6 h-6 text-accent-600 dark:text-accent-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">Choose from Gallery</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Select a photo from your device</div>
            </div>
          </label>

          <button
            onClick={() => {
              setStep('edit');
              setEditData({ description: '', calories: '', protein: '', carbs: '', fat: '' });
            }}
            className="card-hover p-6 w-full flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-2xl">✏️</span>
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900 dark:text-white">Manual Entry</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Enter details yourself</div>
            </div>
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full btn-ghost"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Photo preview step
  if (step === 'photo') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analyzing</h1>
          <button onClick={() => navigate('/add')} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {photo && (
          <div className="relative">
            <img src={photo} alt="Food" className="w-full rounded-xl" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                <div className="text-white text-center">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p>Analyzing food...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!isAnalyzing && analysis && (
          <>
            <div className="card p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Detected</div>
              <div className="font-medium text-gray-900 dark:text-white">{analysis.description}</div>
              {analysis.confidence && (
                <div className="text-xs text-gray-400 mt-1">
                  Confidence: {Math.round(analysis.confidence * 100)}%
                </div>
              )}
            </div>

            <div className="card p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">Estimated Nutrition</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.calories}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">calories</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.protein}g</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">protein</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.carbs}g</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">carbs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.fat}g</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">fat</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('edit')} className="flex-1 btn-secondary">
                Edit
              </button>
              <button onClick={handleSave} className="flex-1 btn-primary">
                Save Entry
              </button>
            </div>
          </>
        )}

        {!isAnalyzing && !analysis && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Analysis failed. Please try again.
          </div>
        )}
      </div>
    );
  }

  // Edit step
  if (step === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Entry</h1>
          <button onClick={() => navigate('/add')} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {photo && (
          <img src={photo} alt="Food" className="w-full rounded-xl max-h-48 object-cover" />
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Description</label>
            <input
              type="text"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="What did you eat?"
              className="input w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Calories</label>
              <input
                type="number"
                value={editData.calories}
                onChange={(e) => setEditData({ ...editData, calories: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Protein (g)</label>
              <input
                type="number"
                value={editData.protein}
                onChange={(e) => setEditData({ ...editData, protein: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Carbs (g)</label>
              <input
                type="number"
                value={editData.carbs}
                onChange={(e) => setEditData({ ...editData, carbs: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Fat (g)</label>
              <input
                type="number"
                value={editData.fat}
                onChange={(e) => setEditData({ ...editData, fat: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate('/add')} className="flex-1 btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 btn-primary">
            Save Entry
          </button>
        </div>
      </div>
    );
  }

  // Success step
  if (step === 'success') {
    return (
      <div className="space-y-6 text-center">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entry Saved!</h1>
        <p className="text-gray-500 dark:text-gray-400">Your food has been logged</p>
        
        <div className="flex gap-3">
          <button onClick={() => navigate('/')} className="flex-1 btn-secondary">
            View Today
          </button>
          <button onClick={() => setStep('select')} className="flex-1 btn-primary">
            Add Another
          </button>
        </div>
      </div>
    );
  }

  return null;
}