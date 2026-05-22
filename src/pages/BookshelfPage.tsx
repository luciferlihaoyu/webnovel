import { useState, useEffect } from 'react'
import { pb } from '../lib/pb'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import WeeklyChart from '../components/WeeklyChart'
import {
  Plus, Trash2, BookOpen, Search, Grid3X3, List, Cloud, CloudOff,
  PenLine, Sparkles, Wand2, UserPlus, BarChart3, ChevronRight,
  FileText, Eye, Globe, ShieldCheck
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

const quickEntries = [
  { icon: PenLine, label: '继续写作', color: 'bg-blue-500', bg: 'bg-blue-50' },
  { icon: Sparkles, label: '大纲生成', color: 'bg-purple-500', bg: 'bg-purple-50' },
  { icon: BookOpen, label: '设定生成', color: 'bg-amber-500', bg: 'bg-amber-50' },
  { icon: Wand2, label: '扩写', color: 'bg-green-500', bg: 'bg-green-50' },
  { icon: UserPlus, label: '取名助手', color: 'bg-pink-500', bg: 'bg-pink-50' },
  { icon: BarChart3, label: '数据统计', color: 'bg-cyan-500', bg: 'bg-cyan-50' },
]

const quickActionsRight = [
  { icon: PenLine, label: '续写', color: 'text-blue-500 bg-blue-50' },
  { icon: UserPlus, label: '取名', color: 'text-pink-500 bg-pink-50' },
  { icon: Eye, label: '审核', color: 'text-amber-500 bg-amber-50' },
  { icon: Globe, label: '世界观', color: 'text-purple-500 bg-purple-50' },
]

export default function BookshelfPage({ onShowRightSidebar = true }: BookshelfPageProps) {
  const [works, setWorks] = useState<Work[]>([])
  const { showNewWorkDialog, setShowNewWorkDialog } = useAppStore()
  const [newTitle, setNewTitle] = useState('')
  const [newGenres, setNewGenres] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Work | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [recentEdits, setRecentEdits] = useState<RecentEdit[]>([])
  const { setWork, setPage } = useAppStore()

  // Real stats from database
  const [stats, setStats] = useState({
    completedWorks: 0,
    newWords: 0,
    activeDays: 0,
    aiAssists: 0,
  })

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
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // 已完成作品数
      const allWorks = await pb.collection('works').getFullList<any>()
      const completed = allWorks.filter((w: any) => (w.progress || 0) >= 100).length

      // 本月新增字数
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const chapters = await pb.collection('chapters').getFullList<any>()
      let totalNewWords = 0
      const activeDaySet = new Set<string>()
      chapters.forEach((ch: any) => {
        if (!ch.updated) return
        const d = new Date(ch.updated)
        if (d >= monthStart) {
          totalNewWords += ch.wordCount || 0
          activeDaySet.add(d.toISOString().slice(0, 10))
        }
      })

      setStats({
        completedWorks: completed,
        newWords: totalNewWords,
        activeDays: activeDaySet.size,
        aiAssists: 0, // TODO: 需要 AI 调用记录表
      })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

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
      setShowNewWorkDialog(false)
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
      'from-blue-500 via-blue-600 to-indigo-700',
      'from-purple-500 via-violet-600 to-indigo-700',
      'from-emerald-500 via-teal-600 to-cyan-700',
      'from-rose-500 via-pink-600 to-red-700',
      'from-amber-500 via-orange-600 to-red-700',
      'from-cyan-500 via-blue-600 to-indigo-700',
      'from-slate-600 via-slate-700 to-gray-800',
      'from-stone-500 via-stone-600 to-neutral-700',
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

  const [weeklyData, setWeeklyData] = useState<{ day: string; words: number }[]>(
    ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(d => ({ day: d, words: 0 }))
  )
  const [todayWords, setTodayWords] = useState(0)
  const [dailyTarget, setDailyTarget] = useState(5000)

  useEffect(() => {
    pb.collection('chapters').getFullList<any>().then(chapters => {
      const now = new Date()
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - dayOfWeek)
      weekStart.setHours(0, 0, 0, 0)

      const week = [0, 0, 0, 0, 0, 0, 0]
      let today = 0
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)

      chapters.forEach((c: any) => {
        if (!c.updated || !c.wordCount) return
        const d = new Date(c.updated)
        const diff = Math.floor((d.getTime() - weekStart.getTime()) / 86400000)
        if (diff >= 0 && diff < 7) week[diff] += c.wordCount
        if (d.getTime() >= todayStart.getTime()) today += c.wordCount
      })

      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      setWeeklyData(days.map((d, i) => ({ day: d, words: week[i] })))
      setTodayWords(today)
    }).catch(() => { })
  }, [works])

  const filteredWorks = searchQuery
    ? works.filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : works

  const dotColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500']

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1100px] mx-auto">

          {/* Quick Entry Grid */}
          <section className="mb-8">
            <div className="grid grid-cols-6 gap-3">
              {quickEntries.map((entry) => (
                <button
                  key={entry.label}
                  onClick={() => {
                    if (entry.label === '数据统计') setPage('stats')
                    else if (entry.label === '大纲生成') setPage('ai')
                    else if (entry.label === '取名助手') setPage('characters')
                    else if (entry.label === '继续写作') setPage('editor')
                    else if (entry.label === '设定生成') setPage('ai')
                    else if (entry.label === '扩写') setPage('editor')
                  }}
                  className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                >
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', entry.bg)}>
                    <entry.icon className={cn('w-5 h-5', entry.color.replace('bg-', 'text-'))} />
                  </div>
                  <span className="text-xs text-slate-700 font-medium">{entry.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* My Works Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-800">我的作品</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="pl-9 w-48 h-8 text-sm bg-slate-50 border-slate-200"
                    placeholder="搜索作品..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {filteredWorks.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center h-[280px] cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all"
                  onClick={() => setShowNewWorkDialog(true)}
                >
                  <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-primary-500" />
                  </div>
                  <span className="text-sm text-slate-500">新建作品</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredWorks.map((work) => (
                  <div
                    key={work.id}
                    className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all cursor-pointer shadow-sm"
                    onClick={() => handleOpenWork(work)}
                  >
                    {/* Cover with 3:4 aspect ratio */}
                    <div className={cn('aspect-[3/4] bg-gradient-to-br relative overflow-hidden', getCoverGradient(work.title))}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white/80 font-bold text-xl select-none" style={{ writingMode: 'vertical-rl', letterSpacing: '0.15em' }}>
                          {work.title}
                        </span>
                      </div>
                      {/* Decorative elements */}
                      <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/10" />
                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5" />
                    </div>
                    {/* Delete button */}
                    <button
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-black/30 text-white/80 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(work) }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Info */}
                    <div className="p-3">
                      <h4 className="font-semibold text-sm text-slate-800 truncate mb-1.5">{work.title}</h4>
                      {work.genres && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {parseGenres(work.genres).map((genre, i) => (
                            <Badge key={i} variant="blue" className="text-[10px]">{genre}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span>{work.totalWords?.toLocaleString() || 0} 字</span>
                        <span className="font-medium">{work.progress || 0}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                  className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center aspect-[3/4] cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all"
                  onClick={() => setShowNewWorkDialog(true)}
                >
                  <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-primary-500" />
                  </div>
                  <span className="text-sm text-slate-500">新建作品</span>
                </div>
              </div>
            )}
          </section>

          {/* Recently Edited Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-800">最近编辑</h3>
              <button className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-0.5">
                查看全部 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {recentEdits.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {recentEdits.map((edit, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer',
                      i < recentEdits.length - 1 && 'border-b border-slate-100'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', dotColors[i % dotColors.length])} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {edit.workTitle} · {edit.chapterTitle || '未命名章节'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {edit.wordCount.toLocaleString()} 字
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 ml-4">{formatTime(edit.time)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">暂无编辑记录</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Right Sidebar */}
      {onShowRightSidebar && (
        <aside className="w-[280px] flex-shrink-0 border-l border-slate-200 bg-white overflow-y-auto">
          <div className="p-4 space-y-5">
            {/* 本月统计 */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-800 mb-4">本月统计</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-primary-600">{stats.completedWorks}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">已完成作品</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.newWords.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">新增字数</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{stats.activeDays}/{new Date().getDate()}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">活跃天数</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{stats.aiAssists}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">AI辅助</p>
                </div>
              </div>
            </div>

            {/* 本周写作 Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">本周写作</h4>
              <WeeklyChart data={weeklyData} />
            </div>

            {/* 快捷操作 */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">快捷操作</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickActionsRight.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                    if (action.label === '取名') setPage('characters')
                    else if (action.label === '续写') setPage('editor')
                    else if (action.label === '审核') setPage('editor')
                    else if (action.label === '世界观') setPage('ai')
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                  >
                    <div className={cn('p-1.5 rounded-lg', action.color)}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* New Work Dialog */}
      <Dialog open={showNewWorkDialog} onOpenChange={setShowNewWorkDialog}>
        <DialogHeader>
          <DialogTitle>新建作品</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1.5">作品名称</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="输入作品名称"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1.5">分类标签（用逗号分隔）</label>
            <Input
              value={newGenres}
              onChange={(e) => setNewGenres(e.target.value)}
              placeholder="如：玄幻, 仙侠, 热血"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewWorkDialog(false)}>取消</Button>
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
          <p className="text-slate-600">确定要删除作品「{deleteTarget?.title}」吗？此操作不可撤销。</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
          <Button variant="destructive" onClick={handleDelete}>删除</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
