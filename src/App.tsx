import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { JiraDashboard } from './components/JiraDashboard'
import { ActivityTracker } from './components/ActivityTracker'
import { BlockerTracker } from './components/BlockerTracker'
import { Timeline } from './components/Timeline'
import { Analytics } from './components/Analytics'
import { Reports } from './components/Reports'
import { Settings } from './components/Settings'
import { Sun, Moon, Timer, ExternalLink } from 'lucide-react'
import { db } from './db'
import { useLiveQuery } from 'dexie-react-hooks'

function App() {
  console.log("[BOOT] App rendering...");
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(false);

  // Global Active Timer state
  const activeActivity = useLiveQuery(() => db.activities.where('status').equals('active').first());

  useEffect(() => {
    console.log("[BOOT] App mounted/effect triggered");
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'jira': return <JiraDashboard />;
      case 'tracker': return <ActivityTracker />;
      case 'blockers': return <BlockerTracker />;
      case 'timeline': return <Timeline />;
      case 'analytics': return <Analytics />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-semibold capitalize">{activeTab.replace('-', ' ')}</h2>
            <div className="hidden md:flex items-center bg-secondary/50 rounded-full px-4 py-1.5 w-80">
              <input
                type="text"
                placeholder="Search activities, projects..."
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-muted-foreground"
              />
              <kbd className="text-[10px] bg-background border px-1.5 py-0.5 rounded-md text-muted-foreground ml-2 font-mono">⌘K</kbd>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {activeActivity && (
              <div
                className="flex items-center gap-3 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full cursor-pointer hover:bg-green-500/20 transition-all"
                onClick={() => {
                  if (activeActivity.jiraKey) {
                    setActiveTab('jira');
                    // We might need a way to trigger the detail view,
                    // but for now switching to Jira tab is a good start.
                  }
                }}
              >
                <div className="flex flex-col items-end mr-1">
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter leading-none">Active Timer</span>
                  <span className="text-xs font-mono font-bold leading-none">{activeActivity.jiraKey || activeActivity.taskName}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30 animate-pulse">
                  <Timer size={16} />
                </div>
              </div>
            )}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto w-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App
