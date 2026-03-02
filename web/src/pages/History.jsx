import { useQuery } from '@tanstack/react-query';
import { api, keys } from '../api.js';
import { useState } from 'react';

export default function History() {
  const [expandedDay, setExpandedDay] = useState(null);

  // Fetch recent stats
  const { data, isLoading, error } = useQuery({
    queryKey: keys.recentStats(7),
    queryFn: () => api.getRecentStats(7),
    refetchOnWindowFocus: false,
  });

  // Fetch today for comparison
  const { data: todayData } = useQuery({
    queryKey: keys.today,
    queryFn: api.getToday,
    refetchOnWindowFocus: false,
  });

  const days = data || [];
  const todayTotals = todayData?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const avgCalories = days.length > 0 
    ? Math.round(days.reduce((sum, d) => sum + d.calories, 0) / days.length)
    : 0;

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Calculate max for chart
  const maxCalories = Math.max(2000, ...days.map(d => d.calories));

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
        Error loading history. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">History</h1>
        <p className="text-gray-500 dark:text-gray-400">Last 7 days</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{todayTotals.calories}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Today</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-accent-600 dark:text-accent-400">{avgCalories}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Daily Avg</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">Calories per Day</h3>
        <div className="flex items-end gap-2 h-32">
          {days.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              No data yet
            </div>
          ) : (
            days.map((day, i) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-primary-500 rounded-t transition-all duration-300"
                  style={{ height: `${(day.calories / maxCalories) * 100}%`, minHeight: '4px' }}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-full text-center">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Day List */}
      <div className="space-y-3">
        {days.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-500 dark:text-gray-400">No entries yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start logging to see your history</p>
          </div>
        ) : (
          days.map((day) => (
            <div key={day.date} className="card overflow-hidden">
              <button
                onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
                className="w-full p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{formatDate(day.date)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{day.entries} entries</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-white">{day.calories}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">calories</div>
                </div>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}