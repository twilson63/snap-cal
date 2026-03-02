import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getSession } from '../lib/storage.js';

export default function Welcome() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('new'); // 'new' or 'join'
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  
  // Check if already has session
  const existingSession = getSession();
  
  const handleCreate = () => {
    const sessionId = passphrase 
      ? createSession(passphrase)
      : createSession('my-journal-' + Date.now().toString(36));
    
    navigate(`/s/${sessionId}`);
  };
  
  const handleJoin = () => {
    if (!passphrase.trim()) {
      setError('Please enter a passphrase');
      return;
    }
    
    const sessionId = createSession(passphrase.trim());
    navigate(`/s/${sessionId}`);
  };

  // If has existing session, show continue option
  if (existingSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FoodLog</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Your personal food journal</p>
          </div>
          
          <div className="card p-6 space-y-4">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">Continue your session?</p>
              <div className="text-2xl mb-4">🍽️</div>
              <code className="text-primary-600 dark:text-primary-400 font-mono text-lg">
                {existingSession}
              </code>
            </div>
            
            <button
              onClick={() => navigate(`/s/${existingSession}`)}
              className="w-full btn-primary py-3 text-lg"
            >
              Continue
            </button>
            
            <button
              onClick={() => setMode('new')}
              className="w-full btn-secondary"
            >
              Start New Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FoodLog</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Your personal food journal</p>
        </div>
        
        <div className="card p-6 space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => setMode('new')}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                mode === 'new' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              New
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                mode === 'join' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Join
            </button>
          </div>
          
          {mode === 'new' ? (
            <div className="space-y-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                Create a new food journal with a unique address
              </p>
              
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Passphrase (optional)
                </label>
                <input
                  type="text"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="e.g., my-food-log"
                  className="input w-full"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Create a memorable phrase to easily share your journal
                </p>
              </div>
              
              <button
                onClick={handleCreate}
                className="w-full btn-primary py-3 text-lg"
              >
                Create Journal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                Join an existing journal with its passphrase
              </p>
              
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Passphrase
                </label>
                <input
                  type="text"
                  value={passphrase}
                  onChange={(e) => { setPassphrase(e.target.value); setError(''); }}
                  placeholder="e.g., my-food-log"
                  className="input w-full"
                  autoFocus
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>
              
              <button
                onClick={handleJoin}
                className="w-full btn-primary py-3 text-lg"
              >
                Join Journal
              </button>
            </div>
          )}
        </div>
        
        <p className="text-center text-sm text-gray-400 dark:text-gray-500">
          No account needed. Your data is stored in your browser.
        </p>
      </div>
    </div>
  );
}