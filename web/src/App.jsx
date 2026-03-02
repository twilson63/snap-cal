import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AddFood from './pages/AddFood.jsx';
import EditEntry from './pages/EditEntry.jsx';
import History from './pages/History.jsx';
import Stats from './pages/Stats.jsx';
import Settings from './pages/Settings.jsx';
import Welcome from './pages/Welcome.jsx';
import { getSession } from './lib/storage.js';

const queryClient = new QueryClient();

// Redirect component that works inside Router context
function RootRedirect() {
  const sessionId = getSession();
  if (sessionId) {
    return <Navigate to={`/s/${sessionId}`} replace />;
  }
  return <Welcome />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Welcome/new session page */}
          <Route path="/" element={<RootRedirect />} />
          
          {/* Session-scoped routes */}
          <Route path="/s/:sessionId" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="add" element={<AddFood />} />
            <Route path="edit/:entryId" element={<EditEntry />} />
            <Route path="history" element={<History />} />
            <Route path="stats" element={<Stats />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;