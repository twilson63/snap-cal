import { useState, useEffect } from 'react';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load current settings
    const savedKey = localStorage.getItem('foodlog_openrouter_key') || '';
    const savedGoals = JSON.parse(localStorage.getItem('foodlog_goals') || '{}');
    setApiKey(savedKey);
    setGoals({ ...goals, ...savedGoals });
  }, []);

  const handleSave = () => {
    localStorage.setItem('foodlog_openrouter_key', apiKey);
    localStorage.setItem('foodlog_goals', JSON.stringify(goals));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    if (confirm('Delete all food entries? This cannot be undone.')) {
      // Clear IndexedDB
      indexedDB.deleteDatabase('foodlog');
      // Clear localStorage
      localStorage.removeItem('foodlog_goals');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      {/* Goals Section */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Daily Goals</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Calories</label>
            <input
              type="number"
              value={goals.calories}
              onChange={(e) => setGoals({ ...goals, calories: parseInt(e.target.value) || 0 })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Protein (g)</label>
            <input
              type="number"
              value={goals.protein}
              onChange={(e) => setGoals({ ...goals, protein: parseInt(e.target.value) || 0 })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Carbs (g)</label>
            <input
              type="number"
              value={goals.carbs}
              onChange={(e) => setGoals({ ...goals, carbs: parseInt(e.target.value) || 0 })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Fat (g)</label>
            <input
              type="number"
              value={goals.fat}
              onChange={(e) => setGoals({ ...goals, fat: parseInt(e.target.value) || 0 })}
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {/* API Key Section */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">AI Vision</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add an OpenRouter API key to get real calorie estimates from food photos.
          Without a key, the app will use estimates.
        </p>
        
        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">OpenRouter API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className="input w-full"
          />
        </div>
        
        <a 
          href="https://openrouter.ai/keys" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary-600 text-sm hover:underline"
        >
          Get an API key at openrouter.ai →
        </a>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full btn-primary py-3 text-lg"
      >
        {saved ? 'Saved!' : 'Save Settings'}
      </button>

      {/* Clear Data */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Clear Data</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Delete all food entries from this device.
        </p>
        <button
          onClick={handleClearData}
          className="btn-secondary text-red-600"
        >
          Clear All Entries
        </button>
      </div>

      {/* About */}
      <div className="text-center text-sm text-gray-400 dark:text-gray-500">
        <p>FoodLog v1.0</p>
        <p className="mt-1">Data stored locally in your browser</p>
      </div>
    </div>
  );
}