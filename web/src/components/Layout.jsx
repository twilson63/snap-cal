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
      {/* Main Content - pb-28 ensures content clears the floating pill nav */}
      <main className="flex-1 pb-28 overflow-auto">
        <div className="max-w-lg mx-auto px-4 pt-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Floating pill-style tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto bg-white/90 backdrop-blur-xl dark:bg-gray-800/90 border border-gray-200/60 dark:border-gray-700/60 rounded-[2rem] shadow-lg shadow-black/5 dark:shadow-black/20 flex items-center justify-around px-1 py-1">
          <NavLink
            to={`${basePath}/`}
            end
            className={({ isActive }) =>
              `nav-pill-item ${isActive ? 'nav-pill-active' : ''}`
            }
          >
            <Home className="w-[18px] h-[18px]" />
            <span className="nav-pill-label">Today</span>
          </NavLink>

          <NavLink
            to={`${basePath}/history`}
            className={({ isActive }) =>
              `nav-pill-item ${isActive ? 'nav-pill-active' : ''}`
            }
          >
            <Clock className="w-[18px] h-[18px]" />
            <span className="nav-pill-label">History</span>
          </NavLink>

          <NavLink
            to={`${basePath}/add`}
            className={({ isActive }) =>
              `nav-pill-item nav-pill-add ${isActive ? 'nav-pill-active' : ''}`
            }
          >
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center shadow-md shadow-primary-500/30">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
          </NavLink>

          <NavLink
            to={`${basePath}/stats`}
            className={({ isActive }) =>
              `nav-pill-item ${isActive ? 'nav-pill-active' : ''}`
            }
          >
            <BarChart3 className="w-[18px] h-[18px]" />
            <span className="nav-pill-label">Stats</span>
          </NavLink>

          <NavLink
            to={`${basePath}/settings`}
            className={({ isActive }) =>
              `nav-pill-item ${isActive ? 'nav-pill-active' : ''}`
            }
          >
            <Settings className="w-[18px] h-[18px]" />
            <span className="nav-pill-label">Settings</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}