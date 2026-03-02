import { useState, useEffect } from 'react';
import { getSessionUrl } from '../lib/storage.js';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const [saved, setSaved] = useState(false);
  const [sessionUrl, setSessionUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load settings from IndexedDB
    const loadSettings = async () => {
      const { settings } = await import('../lib/storage.js');
      const savedGoals = await settings.get('goals');
      const savedKey = await settings.get('openrouter_key');
      if (savedGoals) setGoals(savedGoals);
      if (savedKey) setApiKey(savedKey);
    };
    loadSettings();
    
    // Get session URL
    setSessionUrl(getSessionUrl());
  }, []);

  const handleSave = async () => {
    const { settings } = await import('../lib/storage.js');
    await settings.set('openrouter_key', apiKey);
    await settings.set('goals', goals);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(sessionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      prompt('Copy this URL:', sessionUrl);
    }
  };

  const handleClearData = async () => {
    if (confirm('Delete all food entries? This cannot be undone.')) {
      const sessionId = localStorage.getItem('foodlog_session');
      indexedDB.deleteDatabase(`foodlog-v2-${sessionId}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleNewSession = () => {
    if (confirm('Start a new journal? Your current data will remain accessible via your URL.')) {
      localStorage.removeItem('foodlog_session');
      window.location.href = '/';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      {/* Session / Share */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Your Journal</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Share this URL to access your journal from another device
        </p>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={sessionUrl}
            readOnly
            className="input flex-1 text-sm"
          />
          <button
            onClick={handleCopyUrl}
            className="btn-primary px-4"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        
        <button
          onClick={handleNewSession}
          className="w-full btn-secondary"
        >
          Start New Journal
        </button>
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
          Delete all food entries from this journal.
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
        <p>FoodLog v2.0</p>
        <p className="mt-1">Session-based • No account needed</p>
      </div>
    </div>
  );
}