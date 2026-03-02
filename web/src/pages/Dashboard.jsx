import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, keys } from '../api.js';
import { goals } from '../lib/storage.js';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const queryClient = useQueryClient();
  const [dailyGoals, setDailyGoals] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  
  // Load goals from storage
  useEffect(() => {
    goals.get().then(setDailyGoals);
  }, []);

  // Fetch today's entries
  const { data, isLoading, error } = useQuery({
    queryKey: keys.today,
    queryFn: api.getToday,
    refetchOnWindowFocus: false,
  });

  const entries = data?.entries || [];
  const totals = data?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Calculate percentages
  const caloriePercent = Math.min(100, Math.round((totals.calories / dailyGoals.calories) * 100));
  const proteinPercent = Math.min(100, Math.round((totals.protein / dailyGoals.protein) * 100));
  const carbsPercent = Math.min(100, Math.round((totals.carbs / dailyGoals.carbs) * 100));
  const fatPercent = Math.min(100, Math.round((totals.fat / dailyGoals.fat) * 100));

  // Delete entry
  const handleDelete = async (id) => {
    if (confirm('Delete this entry?')) {
      await api.deleteEntry(id);
      queryClient.invalidateQueries({ queryKey: keys.today });
    }
  };

  // Format time
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl">
        Error loading entries. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Today</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Calorie Display */}
      <div className="card p-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-primary-600 dark:text-primary-400">{totals.calories}</div>
          <div className="text-gray-500 dark:text-gray-400 mt-1">/ {dailyGoals.calories} calories</div>
          <div className="mt-4">
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{totals.protein}g</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Protein</div>
          <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">{totals.carbs}g</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Carbs</div>
          <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-500 rounded-full transition-all duration-300"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totals.fat}g</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Fat</div>
          <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Entries</h2>
        
        {entries.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-3">🍽️</div>
            <p className="text-gray-500 dark:text-gray-400">No food logged yet today</p>
            <button 
              onClick={() => navigate('/add')}
              className="mt-4 btn-primary px-6 py-2"
            >
              Add Your First Meal
            </button>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="card p-4 flex items-start gap-4">
              {entry.photo ? (
                <img 
                  src={entry.photo} 
                  alt={entry.description}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🍽️</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {entry.description || 'Food entry'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {entry.calories} cal • {entry.protein}p / {entry.carbs}c / {entry.fat}f
                    </div>
                    {entry.confidence && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        AI confidence: {Math.round(entry.confidence * 100)}%
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatTime(entry.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}