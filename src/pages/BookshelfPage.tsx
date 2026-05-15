import { useState, useEffect } from 'react'
import { pb } from '../lib/pb'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import WeeklyChart from '../components/WeeklyChart'
import RightSidebar from '../components/RightSidebar'
import {
  Plus, Trash2, BookOpen, Search, Grid3X3, List, Cloud, CloudOff
} from 'lucide-react'
import { cn } from '../lib/utils'

interface Work {
  id: string
  title: string
  cover: string
  genres: string
  totalWords: number
  progress: number
  created: string
  updated: string
}

interface RecentEdit {
  id: string
  workTitle: string
  chapterTitle: string
  wordCount: number
  time: string
}

interface BookshelfPageProps {
  onShowRightSidebar?: boolean
}

export default function BookshelfPage({ onShowRightSidebar = true }: BookshelfPageProps) {
  const [works, setWorks] = useState<Work[]>([])
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newGenres, setNewGenres] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Work | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [recentEdits, setRecentEdits] = useState<RecentEdit[]>([])
  const { setWork, setPage } = useAppStore()

  const fetchWorks = async () => {
    try {
      const records = await pb.collection('works').getFullList<Work>({ sort: '-updated' })
      setWorks(records)
    } catch (err) {
      console.error('Failed to fetch works:', err)
    }
  }

  const fetchRecentEdits = async () => {
    try {
      const chapters = await pb.collection('chapters').getFullList<any>({
        sort: '-updated',
        expand: 'work',
      })
      const edits: RecentEdit[] = chapters.slice(0, 5).map((ch: any) => ({
        id: ch.id,
        workTitle: ch.expand?.work?.title || '未知作品',
        chapterTitle: ch.title,
        wordCount: ch.wordCount || 0,
        time: ch.updated,
      }))
      setRecentEdits(edits)
    } catch (err) {
      console.error('Failed to fetch recent edits:', err)
    }
  }

  useEffect(() => {
    fetchWorks()
    fetchRecentEdits()
  }, [])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setLoading(true)
    try {
      await pb.collection('works').create({
        title: newTitle.trim(),
        genres: newGenres.trim(),
        totalWords: 0,
        progress: 0,
      })
      setNewTitle('')
      setNewGenres('')
      setShowNewDialog(false)
      await fetchWorks()
    } catch (err) {
      console.error('Failed to create work:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await pb.collection('works').delete(deleteTarget.id)
      setDeleteTarget(null)
      await fetchWorks()
    } catch (err) {
      console.error('Failed to delete work:', err)
    }
  }

  const handleOpenWork = (work: Work) => {
    setWork(work.id, work.title)
    setPage('editor')
  }

  const getCoverGradient = (title: string) => {
    const gradients = [
      'from-blue-600 via-blue-700 to-indigo-800',
      'from-purple-600 via-violet-700 to-indigo-800',
      'from-emerald-600 via-teal-700 to-cyan-800',
      'from-rose-600 via-pink-700 to-red-800',
      'from-amber-600 via-orange-700 to-red-800',
      'from-cyan-600 via-blue-700 to-indigo-800',
      'from-slate-700 via-slate-800 to-gray-900',
      'from-stone-600 via-stone-700 to-neutral-800',
    ]
    const idx = title.charCodeAt(0) % gradients.length
    return gradients[idx]
  }

  const parseGenres = (genres: string): string[] => {
    if (!genres) return []
    return genres.split(/[,，]/).map(g => g.trim()).filter(Boolean)
  }

  const getProgressColor = (pct: number) => {
    if (pct >= 66) return 'bg-green-500'
    if (pct >= 33) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 60) return `${diffMin}分钟前`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}小时前`
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7) return `${diffDay}天前`
    return d.toLocaleDateString('zh-CN')
  }

  const weekDays = ['一', '二', '三', '四', '五', '六', '日']
  const weeklyData = weekDays.map((day, i) => ({
    day: `周${day}`,
    words: [1200, 3400, 800, 5200, 2100, 4500, 2800][i],
  }))

  const filteredWorks = searchQuery
    ? works.filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : works

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">书架</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-9 w-56"
                  placeholder="搜索作品..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600')}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* My Works Section */}
          <section className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4">我的作品</h3>
            {filteredWorks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <BookOpen className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg text-gray-500">还没有作品</p>
                <p className="text-sm mt-1">点击"新建作品"开始创作</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorks.map((work) => (
                  <div
                    key={work.id}
                    className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleOpenWork(work)}
                  >
                    {/* Cover with gradient and vertical title */}
                    <div className={cn('h-36 bg-gradient-to-br relative overflow-hidden', getCoverGradient(work.title))}>
                      <div className="absolute inset-0 flex items-center justify-end pr-4">
                        <span className="text-white/70 font-bold text-lg vertical-text select-none tracking-widest" style={{ writingMode: 'vertical-rl' }}>
                          {work.title}
                        </span>
                      </div>
                      {/* Decorative circles */}
                      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5" />
                    </div>
                    {/* Delete button */}
                    <button
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-black/30 text-white/80 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(work) }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Info */}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 truncate mb-2">{work.title}</h4>
                      {work.genres && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {parseGenres(work.genres).map((genre, i) => (
                            <Badge key={i} variant="blue" className="text-[10px]">{genre}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>{work.totalWords?.toLocaleString() || 0} 字</span>
                        <span>{work.progress || 0}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', getProgressColor(work.progress || 0))}
                          style={{ width: `${Math.min(work.progress || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {/* Add new work placeholder card */}
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center h-[240px] cursor-pointer hover:border-primary-300 hover:bg-blue-50/30 transition-all"
                  onClick={() => setShowNewDialog(true)}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-primary-500" />
                  </div>
                  <span className="text-sm text-gray-500">新建作品</span>
                </div>
              </div>
            )}
          </section>

          {/* Recently Edited Section */}
          {recentEdits.length > 0 && (
            <section className="mb-8">
              <h3 className="text-base font-semibold text-gray-900 mb-4">最近编辑</h3>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {recentEdits.map((edit, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer',
                      i < recentEdits.length - 1 && 'border-b border-gray-100'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {edit.workTitle} · {edit.chapterTitle || '未命名章节'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {edit.wordCount.toLocaleString()} 字
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-4">{formatTime(edit.time)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Weekly Stats Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">数据统计（本周）</h3>
              <button
                onClick={() => setPage('stats')}
                className="text-xs text-primary-500 hover:text-primary-600 font-medium"
              >
                查看详情 →
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <WeeklyChart data={weeklyData} trend="↑32%" />
            </div>
          </section>

          {/* WebDAV Sync Status */}
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3 mb-6">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">WebDAV 同步</span>
              <span className="text-xs text-green-600 font-medium">已同步 · 2分钟前</span>
            </div>
            <span className="text-xs text-gray-400">自动同步已开启</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      {onShowRightSidebar && (
        <RightSidebar
          showQuickActions={true}
          showCharacters={false}
          showWorldTree={false}
        />
      )}

      {/* New Work Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogHeader>
          <DialogTitle>新建作品</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">作品名称</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="输入作品名称"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">分类标签（用逗号分隔）</label>
            <Input
              value={newGenres}
              onChange={(e) => setNewGenres(e.target.value)}
              placeholder="如：玄幻, 仙侠, 热血"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewDialog(false)}>取消</Button>
          <Button onClick={handleCreate} disabled={loading || !newTitle.trim()}>
            {loading ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-gray-600">确定要删除作品「{deleteTarget?.title}」吗？此操作不可撤销。</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
          <Button variant="destructive" onClick={handleDelete}>删除</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
