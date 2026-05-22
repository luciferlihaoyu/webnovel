import { useAppStore } from './store/useAppStore'
import BookshelfPage from './pages/BookshelfPage'
import EditorPage from './pages/EditorPage'
import CharactersPage from './pages/CharactersPage'
import AIPage from './pages/AIPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import DailyProgress from './components/DailyProgress'
import {
  BookOpen, Bot, Users, BarChart3, Cloud, Settings, Plus,
  Bell, ChevronDown, Search
} from 'lucide-react'
import { cn } from './lib/utils'

const navItems = [
  { id: 'bookshelf' as const, label: '书架', icon: BookOpen },
  { id: 'ai' as const, label: 'AI助手', icon: Bot },
  { id: 'characters' as const, label: '取名助手', icon: Users },
  { id: 'stats' as const, label: '数据统计', icon: BarChart3 },
  { id: 'webdav' as const, label: 'WebDAV同步', icon: Cloud },
  { id: 'settings' as const, label: '设置', icon: Settings },
]

const pageTitles: Record<string, string> = {
  bookshelf: '书架',
  editor: '编辑器',
  ai: 'AI助手',
  characters: '取名助手',
  stats: '数据统计',
  settings: '设置',
}

export default function App() {
  const { currentPage, setPage, setShowNewWorkDialog } = useAppStore()

  const renderPage = () => {
    switch (currentPage) {
      case 'bookshelf': return <BookshelfPage onShowRightSidebar={true} />
      case 'editor': return <EditorPage onShowRightSidebar={true} />
      case 'ai': return <AIPage />
      case 'characters': return <CharactersPage />
      case 'stats': return <StatsPage />
      case 'settings': return <SettingsPage />
      default: return <BookshelfPage onShowRightSidebar={true} />
    }
  }

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <aside className="w-60 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0 h-full">
        {/* Logo + Branding */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">NovelWriter</h1>
              <p className="text-[11px] text-slate-400">星韵码字</p>
            </div>
          </div>
        </div>

        {/* New Work Button */}
        <div className="px-3 pb-3">
          <button
            onClick={() => {
              setPage('bookshelf')
              setShowNewWorkDialog(true)
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            新建作品
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-1 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id === 'webdav' ? 'settings' : item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all',
                currentPage === item.id
                  ? 'text-primary-600 bg-primary-50 font-medium'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
              style={currentPage === item.id ? { borderLeft: '3px solid #2563eb', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } : {}}
            >
              <item.icon className={cn('w-[18px] h-[18px]', currentPage === item.id ? 'text-primary-500' : 'text-slate-400')} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Daily Word Count Progress Ring */}
        <div className="px-3 pb-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 mb-3 text-center font-medium">今日字数</p>
            <DailyProgress currentWords={2800} targetWords={5000} />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-800">
            {pageTitles[currentPage] || '书架'}
          </h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <Search className="w-[18px] h-[18px]" />
            </button>
            {/* Notification Bell */}
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
            {/* User Avatar */}
            <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">U</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
