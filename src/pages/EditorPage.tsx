import { useState, useEffect, useRef, useCallback } from 'react'
import { pb } from '../lib/pb'
import { aiChat, ANTI_AI_RULES } from '../lib/ai'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import RightSidebar from '../components/RightSidebar'
import {
  Plus, Save, ChevronRight, ChevronDown, ArrowLeft,
  Undo2, Redo2, Wifi, WifiOff, User,
  Sparkles, ShieldCheck, UserCircle, Loader2, Copy
} from 'lucide-react'
import { cn } from '../lib/utils'

interface Chapter {
  id: string
  title: string
  content: string
  wordCount: number
  chapterNumber: number
  sortOrder: number
  work: string
  volume: string
  expand?: any
}

interface Volume {
  id: string
  title: string
  sortOrder: number
  work: string
}

interface EditorPageProps {
  onShowRightSidebar?: boolean
}

export default function EditorPage({ onShowRightSidebar = true }: EditorPageProps) {
  const { currentWorkId, currentWorkTitle, setPage } = useAppStore()
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [chapterTitle, setChapterTitle] = useState('')
  const [chapterContent, setChapterContent] = useState('')
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState('已保存')
  const [showNewChapter, setShowNewChapter] = useState(false)
  const [showNewVolume, setShowNewVolume] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [newVolumeTitle, setNewVolumeTitle] = useState('')
  const [selectedVolumeId, setSelectedVolumeId] = useState('')
  const [editorTab, setEditorTab] = useState('chapter')
  const editorRef = useRef<HTMLDivElement>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewResult, setReviewResult] = useState('')
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [nameDesc, setNameDesc] = useState('')
  const [nameResult, setNameResult] = useState('')
  const [nameLoading, setNameLoading] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!currentWorkId) return
    try {
      const [volData, chapData] = await Promise.all([
        pb.collection('volumes').getFullList<Volume>({
          filter: `work = "${currentWorkId}"`,
          sort: 'sortOrder',
        }),
        pb.collection('chapters').getFullList<Chapter>({
          filter: `work = "${currentWorkId}"`,
          sort: 'sortOrder',
        }),
      ])
      setVolumes(volData)
      setChapters(chapData)
      if (volData.length > 0) {
        setExpandedVolumes(new Set([volData[0].id]))
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
  }, [currentWorkId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const wordCount = (text: string) => {
    if (!text) return 0
    return text.replace(/\s/g, '').length
  }

  const selectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter)
    setChapterTitle(chapter.title)
    setChapterContent(chapter.content || '')
  }

  const handleSave = async () => {
    if (!selectedChapter) return
    setSaving(true)
    try {
      const content = chapterContent
      const wc = wordCount(content)
      await pb.collection('chapters').update(selectedChapter.id, {
        title: chapterTitle,
        content,
        wordCount: wc,
      })
      setSelectedChapter({ ...selectedChapter, title: chapterTitle, content, wordCount: wc })
      setAutoSaveStatus('已保存')
      await fetchData()
    } catch (err) {
      console.error('Failed to save:', err)
      setAutoSaveStatus('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!selectedChapter) return
    const timer = setInterval(() => {
      if (chapterContent !== selectedChapter.content) {
        setAutoSaveStatus('自动保存中...')
        handleSave()
      }
    }, 30000)
    return () => clearInterval(timer)
  }, [selectedChapter, chapterContent])

  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim() || !currentWorkId) return
    try {
      const maxOrder = chapters
        .filter((c) => (selectedVolumeId ? c.volume === selectedVolumeId : !c.volume))
        .reduce((max, c) => Math.max(max, c.sortOrder), 0)

      await pb.collection('chapters').create({
        title: newChapterTitle.trim(),
        content: '',
        wordCount: 0,
        chapterNumber: chapters.length + 1,
        sortOrder: maxOrder + 1,
        work: currentWorkId,
        volume: selectedVolumeId || '',
      })
      setNewChapterTitle('')
      setShowNewChapter(false)
      await fetchData()
    } catch (err) {
      console.error('Failed to create chapter:', err)
    }
  }

  const handleCreateVolume = async () => {
    if (!newVolumeTitle.trim() || !currentWorkId) return
    try {
      const maxOrder = volumes.reduce((max, v) => Math.max(max, v.sortOrder), 0)
      await pb.collection('volumes').create({
        title: newVolumeTitle.trim(),
        sortOrder: maxOrder + 1,
        work: currentWorkId,
      })
      setNewVolumeTitle('')
      setShowNewVolume(false)
      await fetchData()
    } catch (err) {
      console.error('Failed to create volume:', err)
    }
  }

  const toggleVolume = (id: string) => {
    setExpandedVolumes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleContentInput = () => {
    if (editorRef.current) {
      setChapterContent(editorRef.current.innerText || '')
    }
  }

  const handleExpand = async () => {
    const content = chapterContent.trim()
    if (!content) { alert('请先写入一些内容'); return }
    setAiLoading(true)
    try {
      const prompt = `${ANTI_AI_RULES}\n请将以下内容进行扩展和润色，保持原文风格，扩充细节和情节：\n${content}`
      const result = await aiChat(prompt)
      setChapterContent(result)
      if (editorRef.current) editorRef.current.innerText = result
    } catch (err: any) {
      alert(err.message || 'AI 扩写失败')
    }
    setAiLoading(false)
  }

  const handleReview = async () => {
    const content = chapterContent.trim()
    if (!content) { alert('请先写入一些内容'); return }
    setAiLoading(true)
    setReviewResult('')
    setShowReviewDialog(true)
    try {
      const prompt = `请对以下小说章节进行专业审核，从以下6个维度评分（1-10分）并给出修改建议：
1. 人设一致性
2. 逻辑连贯性  
3. AI痕迹（是否像AI写的）
4. 水字数程度
5. 钩子/悬念设置
6. 断章技巧

章节标题：${chapterTitle}
章节内容：${content}

请用Markdown表格格式输出评分和建议。`
      const result = await aiChat(prompt)
      setReviewResult(result)
    } catch (err: any) {
      setReviewResult(`❌ ${err.message || '审核失败'}`)
    }
    setAiLoading(false)
  }

  const handleGenerateNames = async () => {
    if (!nameDesc.trim()) return
    setNameLoading(true)
    setNameResult('')
    try {
      const prompt = `${ANTI_AI_RULES}\n请根据以下描述，生成5个适合小说角色的名字（中文），每个名字附带简短寓意：\n描述：${nameDesc}\n返回格式：每个名字一行，格式为"名字 — 寓意"`
      const result = await aiChat(prompt)
      setNameResult(result)
    } catch (err: any) {
      setNameResult(`❌ ${err.message || '生成失败'}`)
    }
    setNameLoading(false)
  }

  const handleBack = () => setPage('bookshelf')

  if (!currentWorkId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <BookOpenIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg text-gray-500">请先选择一部作品</p>
          <p className="text-sm mt-1">在书架中选择或创建作品开始写作</p>
        </div>
      </div>
    )
  }

  const chaptersForVolume = (volumeId: string) =>
    chapters.filter((c) => c.volume === volumeId).sort((a, b) => a.sortOrder - b.sortOrder)

  const orphanChapters = chapters.filter((c) => !c.volume).sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="flex h-full">
      {/* Chapter Tree Panel */}
      <div className="w-60 border-r border-gray-200 bg-gray-50 flex flex-col flex-shrink-0 overflow-hidden">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">目录</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNewVolume(true)} title="新建卷">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {volumes.map((vol) => (
            <div key={vol.id}>
              <button
                className="w-full flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors"
                onClick={() => toggleVolume(vol.id)}
              >
                {expandedVolumes.has(vol.id) ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span className="font-medium truncate">{vol.title}</span>
              </button>
              {expandedVolumes.has(vol.id) && (
                <div className="ml-4">
                  {chaptersForVolume(vol.id).map((ch) => (
                    <button
                      key={ch.id}
                      className={cn(
                        'w-full text-left px-2 py-1.5 text-sm rounded transition-colors truncate',
                        selectedChapter?.id === ch.id
                          ? 'bg-blue-50 text-primary-600 font-medium'
                          : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                      )}
                      onClick={() => selectChapter(ch)}
                    >
                      {ch.title || '未命名章节'}
                    </button>
                  ))}
                  <button
                    className="w-full text-left px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => { setSelectedVolumeId(vol.id); setShowNewChapter(true) }}
                  >
                    + 添加章节
                  </button>
                </div>
              )}
            </div>
          ))}
          {orphanChapters.length > 0 && (
            <div>
              <div className="px-2 py-1.5 text-xs text-gray-400 font-medium">未分类</div>
              {orphanChapters.map((ch) => (
                <button
                  key={ch.id}
                  className={cn(
                    'w-full text-left px-2 py-1.5 text-sm rounded transition-colors truncate',
                    selectedChapter?.id === ch.id
                      ? 'bg-blue-50 text-primary-600 font-medium'
                      : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  )}
                  onClick={() => selectChapter(ch)}
                >
                  {ch.title || '未命名章节'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                《{currentWorkTitle}》{selectedChapter ? ` · 第${selectedChapter.chapterNumber}章 ${selectedChapter.title}` : ''}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-save indicator */}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              {autoSaveStatus === '已保存' && <Wifi className="w-3 h-3 text-green-500" />}
              {autoSaveStatus === '自动保存中...' && <Wifi className="w-3 h-3 text-amber-500 animate-pulse" />}
              {autoSaveStatus}
            </span>
            {/* Undo/Redo */}
            <Button variant="ghost" size="icon" className="h-7 w-7" title="撤销">
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="重做">
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
            {/* User avatar */}
            <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center ml-2">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>

        {/* Offline warning */}
        {!isOnline && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-700 flex items-center gap-2 flex-shrink-0">
            <WifiOff className="w-3 h-3" />
            当前离线模式 · 内容将在恢复连接后自动同步
          </div>
        )}

        {/* Tabs */}
        <div className="px-4 pt-2 pb-0 flex-shrink-0">
          <Tabs value={editorTab} onValueChange={setEditorTab}>
            <TabsList>
              <TabsTrigger value="chapter">章节编辑</TabsTrigger>
              <TabsTrigger value="outline">大纲</TabsTrigger>
              <TabsTrigger value="notes">笔记</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {selectedChapter ? (
          <>
            {/* Chapter title + word count */}
            <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0">
              <Input
                className="max-w-xs h-8 text-sm border-gray-200"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="章节标题"
              />
              <span className="text-xs text-gray-400 flex-shrink-0">
                {wordCount(chapterContent).toLocaleString()} 字
              </span>
              <div className="flex-1" />
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-3.5 h-3.5 mr-1" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>

            {/* AI Action Bar */}
            <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <span className="text-xs text-gray-500 mr-1">AI 工具：</span>
              <Button variant="outline" size="sm" onClick={handleExpand} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                扩写
              </Button>
              <Button variant="outline" size="sm" onClick={handleReview} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1" />}
                审核
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowNameDialog(true)}>
                <UserCircle className="w-3.5 h-3.5 mr-1" />
                取名
              </Button>
            </div>

            {/* Writing Area */}
            <div className="flex-1 overflow-auto">
              <div
                ref={editorRef}
                className="editor-content min-h-full p-8 outline-none whitespace-pre-wrap"
                contentEditable
                suppressContentEditableWarning
                onInput={handleContentInput}
                dangerouslySetInnerHTML={{ __html: chapterContent.replace(/\n/g, '<br/>') }}
                style={{ fontFamily: "'Noto Serif SC', 'Source Han Serif SC', Georgia, serif" }}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-400">
            <p>请从左侧目录选择章节开始写作</p>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      {onShowRightSidebar && selectedChapter && (
        <RightSidebar
          showQuickActions={true}
          showCharacters={true}
          showWorldTree={true}
          characters={[
            {
              id: '1',
              name: '主角名',
              role: '主角',
              gender: '男',
              age: 18,
              identity: '修真者',
              faction: '青云门',
              personality: '坚韧不拔，重情重义',
            },
            {
              id: '2',
              name: '女主名',
              role: '主角',
              gender: '女',
              age: 17,
              identity: '天族后裔',
              faction: '天族',
              personality: '活泼开朗',
            },
            {
              id: '3',
              name: '师父',
              role: '导师',
              gender: '男',
              age: 200,
              identity: '青云掌门',
              faction: '青云门',
              personality: '严厉但关爱弟子',
            },
            {
              id: '4',
              name: '反派BOSS',
              role: '反派',
              gender: '男',
              age: 500,
              identity: '魔尊',
              faction: '魔教',
              personality: '阴险狡诈',
            },
          ]}
          worldTree={[
            {
              id: 'w1',
              name: '宇宙设定',
              children: [
                {
                  id: 'w2', name: '星系',
                  children: [
                    { id: 'w3', name: '太阳系' },
                    { id: 'w4', name: '地球' },
                  ]
                },
                {
                  id: 'w5', name: '时间维度',
                  children: [
                    { id: 'w6', name: '纪元' },
                    { id: 'w7', name: '时间线' },
                  ]
                },
              ]
            }
          ]}
        />
      )}

      {/* New Chapter Dialog */}
      <Dialog open={showNewChapter} onOpenChange={setShowNewChapter}>
        <DialogHeader><DialogTitle>新建章节</DialogTitle></DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">章节标题</label>
            <Input value={newChapterTitle} onChange={(e) => setNewChapterTitle(e.target.value)} placeholder="输入章节标题" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewChapter(false)}>取消</Button>
          <Button onClick={handleCreateChapter} disabled={!newChapterTitle.trim()}>创建</Button>
        </DialogFooter>
      </Dialog>

      {/* New Volume Dialog */}
      <Dialog open={showNewVolume} onOpenChange={setShowNewVolume}>
        <DialogHeader><DialogTitle>新建卷</DialogTitle></DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">卷名</label>
            <Input value={newVolumeTitle} onChange={(e) => setNewVolumeTitle(e.target.value)} placeholder="如：第一卷" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewVolume(false)}>取消</Button>
          <Button onClick={handleCreateVolume} disabled={!newVolumeTitle.trim()}>创建</Button>
        </DialogFooter>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogHeader><DialogTitle>AI 审核结果</DialogTitle></DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-auto">
          {aiLoading && !reviewResult ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              AI 正在审核中...
            </div>
          ) : (
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{reviewResult}</div>
          )}
        </div>
        <DialogFooter>
          {reviewResult && (
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(reviewResult)}>
              <Copy className="w-3.5 h-3.5 mr-1" />复制
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowReviewDialog(false)}>关闭</Button>
        </DialogFooter>
      </Dialog>

      {/* Name Generation Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogHeader><DialogTitle>取名助手</DialogTitle></DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">角色描述</label>
            <Textarea
              value={nameDesc}
              onChange={(e) => setNameDesc(e.target.value)}
              placeholder="例如：古风仙侠，男性主角，性格冷酷"
              rows={3}
              className="resize-none"
            />
          </div>
          <Button className="w-full" onClick={handleGenerateNames} disabled={nameLoading || !nameDesc.trim()}>
            {nameLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {nameLoading ? '生成中...' : '生成名字'}
          </Button>
          {nameResult && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">生成结果</span>
                <button onClick={() => navigator.clipboard.writeText(nameResult)} className="text-xs text-primary-500 hover:text-primary-600">复制</button>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{nameResult}</div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowNameDialog(false); setNameResult(''); setNameDesc('') }}>关闭</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  )
}
