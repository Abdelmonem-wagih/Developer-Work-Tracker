import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { ActivityTracker } from './components/ActivityTracker'
import { BlockerTracker } from './components/BlockerTracker'
import { Timeline } from './components/Timeline'
import { Analytics } from './components/Analytics'
import { Reports } from './components/Reports'
import { Settings } from './components/Settings'
import { Sun, Moon } from 'lucide-react'

function App() {
  console.log("[BOOT] App rendering...");
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(false);

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
