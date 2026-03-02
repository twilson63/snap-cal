import { Outlet, NavLink, useParams } from 'react-router-dom'
import { Home, PlusCircle, Clock, BarChart3, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Layout() {
  const { sessionId } = useParams()
  const basePath = sessionId ? `/s/${sessionId}` : ''
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return JSON.parse(saved)
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  // Listen for dark mode changes from settings page
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'darkMode') {
        setDarkMode(JSON.parse(e.newValue))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 dark:bg-gray-800/80 dark:border-gray-700 safe-bottom z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
          <NavLink
            to={`${basePath}/`}
            className={({ isActive }) =>
              isActive ? 'nav-item-active' : 'nav-item'
            }
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Today</span>
          </NavLink>

          <NavLink
            to={`${basePath}/history`}
            className={({ isActive }) =>
              isActive ? 'nav-item-active' : 'nav-item'
            }
          >
            <Clock className="w-6 h-6" />
            <span className="text-xs font-medium">History</span>
          </NavLink>

          <NavLink
            to={`${basePath}/add`}
            className={({ isActive }) =>
              isActive ? 'nav-item-active' : 'nav-item'
            }
          >
            <div className="w-14 h-14 -mt-4 bg-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30">
              <PlusCircle className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-medium mt-1">Add</span>
          </NavLink>

          <NavLink
            to={`${basePath}/stats`}
            className={({ isActive }) =>
              isActive ? 'nav-item-active' : 'nav-item'
            }
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">Stats</span>
          </NavLink>

          <NavLink
            to={`${basePath}/settings`}
            className={({ isActive }) =>
              isActive ? 'nav-item-active' : 'nav-item'
            }
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">Settings</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )