import { useState, useEffect } from 'react';
import { getSessionUrl } from '../lib/storage.js';
import { ConnectionStatus } from '../components/OfflineIndicator.jsx';

const APP_VERSION = '2.0.0';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const [saved, setSaved] = useState(false);
  const [sessionUrl, setSessionUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    // Load settings from IndexedDB
    const loadSettings = async () => {
      const { settings, apiKey: apiKeyStorage } = await import('../lib/storage.js');
      const savedGoals = await settings.get('goals');
      const savedKey = await apiKeyStorage.get();
      if (savedGoals) setGoals(savedGoals);
      if (savedKey) setApiKey(savedKey);
    };
    loadSettings();
    
    // Get session URL
    setSessionUrl(getSessionUrl());
  }, []);

  const handleSave = async () => {
    const { settings, apiKey: apiKeyStorage } = await import('../lib/storage.js');
    if (apiKey) {
      await apiKeyStorage.set(apiKey);
    }
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
      const sessionId = localStorage.getItem('snapcal_session');
      indexedDB.deleteDatabase(`snapcal-v1-${sessionId}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleNewSession = () => {
    if (confirm('Start a new journal? Your current data will remain accessible via your URL.')) {
      localStorage.removeItem('snapcal_session');
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
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowAbout(!showAbout)}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-xl">🍽️</span>
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">About SnapCal</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Version {APP_VERSION}</div>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${showAbout ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showAbout && (
          <div className="px-4 pb-4 space-y-3">
            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Connection</span>
              <ConnectionStatus />
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Storage</span>
              <span className="text-sm text-gray-900 dark:text-white">IndexedDB (encrypted)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Encryption</span>
              <span className="text-sm text-green-600 dark:text-green-400">AES-256-GCM ✓</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">AI Model</span>
              <span className="text-sm text-gray-900 dark:text-white">{apiKey ? 'GPT-4o Mini' : 'Offline Mode'}</span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                SnapCal is a privacy-first food tracking app. Your data stays on your device.
                No account required, no cloud sync.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <a href="/privacy" className="text-xs text-primary-600 hover:underline">Privacy Policy</a>
              <span className="text-gray-300">•</span>
              <a href="/terms" className="text-xs text-primary-600 hover:underline">Terms of Service</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}