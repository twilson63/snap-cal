import { useQuery } from '@tanstack/react-query';
import { api, keys } from '../api.js';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function Stats() {
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch stats for 30 days
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['stats', 'month'],
    queryFn: () => api.getRecentStats(30),
    refetchOnWindowFocus: false,
  });

  // Calculate date range
  const dateRange = useMemo(() => {
    const end = new Date(currentDate);
    const start = new Date(currentDate);
    const days = viewMode === 'week' ? 7 : 30;
    start.setDate(start.getDate() - days + 1);
    return { start, end, days };
  }, [currentDate, viewMode]);

  // Filter stats for current view
  const filteredStats = useMemo(() => {
    if (!statsData) return [];
    const startStr = dateRange.start.toISOString().split('T')[0];
    return statsData.filter(d => d.date >= startStr);
  }, [statsData, dateRange]);

  // Calculate totals and averages
  const summary = useMemo(() => {
    if (filteredStats.length === 0) {
      return { avgCalories: 0, totalCalories: 0, totalEntries: 0, daysLogged: 0 };
    }
    
    const totalCalories = filteredStats.reduce((sum, d) => sum + d.calories, 0);
    const totalEntries = filteredStats.reduce((sum, d) => sum + d.entries, 0);
    const avgCalories = Math.round(totalCalories / filteredStats.length);

    return { avgCalories, totalCalories, totalEntries, daysLogged: filteredStats.length };
  }, [filteredStats]);

  // Get comparison with previous period
  const comparison = useMemo(() => {
    if (!statsData || statsData.length < 14) return null;
    
    const currentAvg = summary.avgCalories;
    const previousStart = new Date(dateRange.start);
    previousStart.setDate(previousStart.getDate() - dateRange.days);
    const previousEnd = new Date(dateRange.start);
    previousEnd.setDate(previousEnd.getDate() - 1);
    
    const previousStats = statsData.filter(d => {
      const prevStartStr = previousStart.toISOString().split('T')[0];
      const prevEndStr = previousEnd.toISOString().split('T')[0];
      return d.date >= prevStartStr && d.date <= prevEndStr;
    });
    
    if (previousStats.length === 0) return null;
    
    const previousAvg = Math.round(previousStats.reduce((sum, d) => sum + d.calories, 0) / previousStats.length);
    const diff = currentAvg - previousAvg;
    const percent = previousAvg > 0 ? Math.round((diff / previousAvg) * 100) : 0;
    
    return { previousAvg, diff, percent };
  }, [statsData, dateRange, summary]);

  // Navigation
  const goBack = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - (viewMode === 'week' ? 7 : 30));
    setCurrentDate(newDate);
  };
  
  const goForward = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (viewMode === 'week' ? 7 : 30));
    if (newDate <= new Date()) {
      setCurrentDate(newDate);
    }
  };

  const isCurrentPeriod = useMemo(() => {
    const today = new Date();
    const endDate = new Date(currentDate);
    return endDate.toDateString() === today.toDateString();
  }, [currentDate]);

  // Max for chart
  const maxCalories = Math.max(2000, ...filteredStats.map(d => d.calories), 2500);

  // Format date label
  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h1>
        <p className="text-gray-500 dark:text-gray-400">Track your nutrition trends</p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'week'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'month'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={goBack} className="btn-ghost p-2">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="font-medium text-gray-900 dark:text-white">
            {dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' - '}
            {dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          {!isCurrentPeriod && (
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs text-primary-600 dark:text-primary-400"
            >
              Go to today
            </button>
          )}
        </div>
        <button 
          onClick={goForward} 
          className={`btn-ghost p-2 ${isCurrentPeriod ? 'opacity-30 cursor-not-allowed' : ''}`}
          disabled={isCurrentPeriod}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Daily Average</div>
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{summary.avgCalories}</div>
          <div className="text-xs text-gray-400">calories</div>
          {comparison && (
            <div className={`flex items-center gap-1 text-xs mt-1 ${
              comparison.diff > 0 ? 'text-amber-500' : comparison.diff < 0 ? 'text-green-500' : 'text-gray-400'
            }`}>
              {comparison.diff > 0 ? <TrendingUp className="w-3 h-3" /> : 
               comparison.diff < 0 ? <TrendingDown className="w-3 h-3" /> : 
               <Minus className="w-3 h-3" />}
              {Math.abs(comparison.percent)}% vs previous
            </div>
          )}
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
          <div className="text-3xl font-bold text-accent-600 dark:text-accent-400">{summary.totalCalories}</div>
          <div className="text-xs text-gray-400">calories</div>
          <div className="text-xs text-gray-400 mt-1">{summary.daysLogged} days, {summary.totalEntries} entries</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">Calories per Day</h3>
        {filteredStats.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-gray-400">
            No data for this period
          </div>
        ) : (
          <div className="space-y-1">
            {/* Y-axis labels */}
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>0</span>
              <span>{maxCalories}</span>
            </div>
            
            {/* Bars */}
            <div className="flex items-end gap-1 h-32">
              {filteredStats.map((day, i) => {
                const height = (day.calories / maxCalories) * 100;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full h-full flex items-end">
                      <div 
                        className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t transition-all duration-300 group-hover:from-primary-400 group-hover:to-primary-300"
                        style={{ height: `${Math.max(height, 2)}%`, minHeight: '4px' }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                            {day.calories} cal
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* X-axis labels */}
            <div className="flex gap-1 mt-1">
              {filteredStats.map((day, i) => {
                // Show fewer labels in month view
                if (viewMode === 'month' && i % 3 !== 0) {
                  return <div key={day.date} className="flex-1" />;
                }
                return (
                  <div key={day.date} className="flex-1 text-center">
                    <span className="text-xs text-gray-400">
                      {formatDateLabel(day.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Insights */}
      {viewMode === 'week' && filteredStats.length > 0 && (
        <div className="card p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Insights</h3>
          <div className="space-y-2 text-sm">
            {summary.avgCalories > 2000 && (
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                <span>⚠️</span>
                <span>Average calorie intake is above 2000 goal</span>
              </div>
            )}
            {summary.avgCalories < 1500 && (
              <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400">
                <span>💡</span>
                <span>Low average intake - consider adding nutritious meals</span>
              </div>
            )}
            {summary.avgCalories >= 1500 && summary.avgCalories <= 2000 && (
              <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
                <span>✅</span>
                <span>Calorie intake within healthy range</span>
              </div>
            )}
            {comparison && comparison.diff > 10 && (
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                <span>📈</span>
                <span>Up {comparison.percent}% from previous week</span>
              </div>
            )}
            {comparison && comparison.diff < -10 && (
              <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
                <span>📉</span>
                <span>Down {Math.abs(comparison.percent)}% from previous week</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Day Breakdown */}
      <div className="card p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Daily Breakdown</h3>
        <div className="space-y-2">
          {filteredStats.length === 0 ? (
            <div className="text-center text-gray-400 py-4">
              No entries in this period
            </div>
          ) : (
            filteredStats.map((day) => {
              const date = new Date(day.date);
              const today = new Date();
              const isToday = day.date === today.toISOString().split('T')[0];
              const isYesterday = day.date === new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
              
              let label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              if (isToday) label = 'Today';
              else if (isYesterday) label = 'Yesterday';
              
              return (
                <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{label}</div>
                    <div className="text-xs text-gray-400">{day.entries} entries</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">{day.calories}</div>
                    <div className="text-xs text-gray-400">calories</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}