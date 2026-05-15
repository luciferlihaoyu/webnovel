import { useAppStore } from './store/useAppStore'
import BookshelfPage from './pages/BookshelfPage'
import EditorPage from './pages/EditorPage'
import CharactersPage from './pages/CharactersPage'
import AIPage from './pages/AIPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import DailyProgress from './components/DailyProgress'
import {
  BookOpen, Bot, Users, BarChart3, Cloud, Settings, Plus
} from 'lucide-react'
import { cn } from './lib/utils'

const navItems = [
  { id: 'bookshelf' as const, label: '书架', icon: BookOpen },
  { id: 'ai' as const, label: 'AI 助手', icon: Bot },
  { id: 'characters' as const, label: '取名助手', icon: Users },
  { id: 'stats' as const, label: '数据统计', icon: BarChart3 },
  { id: 'settings' as const, label: '设置', icon: Settings },
]

const showRightSidebarPages = ['bookshelf', 'editor', 'characters']

export default function App() {
  const { currentPage, setPage, currentWorkId } = useAppStore()

  const renderPage = () => {
    switch (currentPage) {
      case 'bookshelf': return <BookshelfPage onShowRightSidebar={showRightSidebarPages.includes(currentPage)} />
      case 'editor': return <EditorPage onShowRightSidebar={true} />
      case 'ai': return <AIPage />
      case 'characters': return <CharactersPage onShowRightSidebar={true} />
      case 'stats': return <StatsPage />
      case 'settings': return <SettingsPage />
      default: return <BookshelfPage onShowRightSidebar={true} />
    }
  }

  const showRightSidebar = showRightSidebarPages.includes(currentPage)

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-60 bg-[#f8f9fa] border-r border-gray-200 flex flex-col flex-shrink-0 h-full">
        {/* Logo + Branding */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">NovelWriter</h1>
              <p className="text-[11px] text-gray-400">星的码字</p>
            </div>
          </div>
        </div>

        {/* New Work Button */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setPage('bookshelf')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            新建作品
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 my-0.5 text-sm rounded-lg transition-all',
                currentPage === item.id
                  ? 'text-primary-600 bg-blue-50 border-l-3 border-primary-500 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
              style={currentPage === item.id ? { borderLeft: '3px solid #3b82f6', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } : {}}
            >
              <item.icon className={cn('w-4 h-4', currentPage === item.id ? 'text-primary-500' : 'text-gray-400')} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* WebDAV Sync */}
        <div className="px-2 pb-2">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Cloud className="w-4 h-4" />
            WebDAV 同步
          </button>
        </div>

        {/* Daily Word Count */}
        <div className="px-4 pb-5">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 mb-3 text-center">今日字数</p>
            <DailyProgress currentWords={2800} targetWords={5000} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white">
        {renderPage()}
      </main>

      {/* Right Sidebar - rendered inside page components */}
    </div>
  )
}
