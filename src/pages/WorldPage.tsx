import { useState, useEffect } from 'react'
import { pb } from '../lib/pb'
import { aiChat } from '../lib/ai'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Sparkles, Copy, Globe, Loader2 } from 'lucide-react'

export default function WorldPage() {
  const { currentWorkId, currentWorkTitle } = useAppStore()
  const [nodes, setNodes] = useState<any[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [parentId, setParentId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')

  const fetchNodes = async () => {
    if (!currentWorkId) return
    try {
      const records = await pb.collection('world_nodes').getFullList({
        filter: `work="${currentWorkId}"`,
        sort: 'category,name',
      })
      setNodes(records)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchNodes() }, [])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const roots = nodes.filter((n: any) => !n.parent)
  const children = (parentId: string) => nodes.filter((n: any) => n.parent === parentId)

  const addNode = async () => {
    if (!newName.trim() || !currentWorkId) return
    try {
      await pb.collection('world_nodes').create({
        name: newName.trim(),
        work: currentWorkId,
        parent: parentId || null,
        category: '',
        description: '',
      })
      setNewName('')
      setShowAdd(false)
      setParentId(null)
      fetchNodes()
    } catch (err) {
      console.error(err)
    }
  }

  const removeNode = async (id: string) => {
    if (!confirm('确定删除此节点？子节点也会被删除。')) return
    // Delete children first
    const kids = children(id)
    for (const k of kids) {
      await pb.collection('world_nodes').delete(k.id)
    }
    await pb.collection('world_nodes').delete(id)
    fetchNodes()
  }

  const categories = ['势力', '地点', '功法', '历史', '规则', '社会结构']

  const categoryHints: Record<string, string> = {
    '势力': '请包含：势力名称、势力规模、核心成员、势力目标、与其他势力关系',
    '地点': '请包含：地点名称、地理特征、重要性、关联势力/人物',
    '功法': '请包含：功法名称、修炼条件、威力等级、创始人、特殊效果',
    '历史': '请包含：事件名称、时间背景、关键人物、影响',
    '规则': '请包含：规则名称、适用范围、具体内容、例外情况',
    '社会结构': '请包含：结构名称、阶层划分、运行机制、矛盾冲突',
  }

  const generateNode = async () => {
    setShowCategoryDialog(true)
  }

  const doGenerateNode = async (category: string) => {
    setShowCategoryDialog(false)
    setGenLoading(true)
    try {
      const hint = categoryHints[category] || ''
      const prompt = `请为小说《${currentWorkTitle || '未命名作品'}》生成一个世界观设定节点。
分类：${category}
${hint}
返回JSON格式：{"name":"", "description":""}`
      const text = await aiChat(prompt, 0.9)
      let json: any = {}
      try {
        json = JSON.parse(text.replace(/```json\n?/g, '').replace(/```/g, '').trim())
      } catch {
        json = { name: text.slice(0, 50), category, description: text }
      }
      await pb.collection('world_nodes').create({
        name: json.name || '新节点',
        work: currentWorkId,
        category: category,
        description: json.description || '',
        parent: null,
      })
      fetchNodes()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'AI 生成失败')
    }
    setGenLoading(false)
  }

  const catIcons: Record<string, string> = { '势力': '🛡️', '地点': '📍', '功法': '⚡', '历史': '🕐' }

  const renderNode = (node: any, depth: number) => {
    const kids = children(node.id)
    const isExpanded = expanded.has(node.id)
    const hasKids = kids.length > 0

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors group`}
          style={{ paddingLeft: `${12 + depth * 24}px` }}
        >
          <button onClick={() => hasKids && toggleExpand(node.id)} className="text-gray-500 w-4">
            {hasKids ? (isExpanded ? '▾' : '▸') : '·'}
          </button>
          <span>{catIcons[node.category] || '🌐'}</span>
          <span className="text-gray-900 text-sm flex-1" onClick={() => toggleExpand(node.id)}>{node.name}</span>
          {node.category && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{node.category}</span>
          )}
          {node.description && (
            <span className="text-xs text-gray-500 truncate max-w-[200px] hidden group-hover:inline">{node.description}</span>
          )}
          <button onClick={() => { setParentId(node.id); setShowAdd(true) }}
            className="text-gray-600 hover:text-green-400 text-xs px-1">+</button>
          <button onClick={() => removeNode(node.id)}
            className="text-gray-600 hover:text-red-400 text-xs px-1 opacity-0 group-hover:opacity-100">✕</button>
        </div>
        {hasKids && isExpanded && kids.map((k: any) => renderNode(k, depth + 1))}
      </div>
    )
  }

  if (!currentWorkId) {
    return <div className="flex items-center justify-center h-full text-gray-500">请先在书架选择作品</div>
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">世界观</h2>
          <p className="text-sm text-gray-400 mt-1">管理你的世界设定</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateNode} disabled={genLoading}>
            <Sparkles className="w-4 h-4 mr-1" />
            {genLoading ? '生成中...' : 'AI 生成'}
          </Button>
          <Button onClick={() => { setParentId(null); setShowAdd(true) }}>
            + 新节点
          </Button>
        </div>
      </div>

      {roots.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Globe className="w-12 h-12 mx-auto mb-3 text-gray-700" />
          <p className="text-lg mb-1">暂无世界观节点</p>
          <p className="text-sm">点击上方按钮添加或 AI 生成</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          {roots.map((r: any) => renderNode(r, 0))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {parentId ? '添加子节点' : '新建节点'}
            </h3>
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 text-sm mb-4"
              placeholder="节点名称"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addNode()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setShowAdd(false); setNewName('') }}>取消</Button>
              <Button onClick={addNode}>创建</Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Dialog */}
      {showCategoryDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI 生成世界观节点</h3>
            <p className="text-sm text-gray-500 mb-4">选择要生成的节点分类</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border ${
                    selectedCategory === cat
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowCategoryDialog(false); setSelectedCategory('') }}>取消</Button>
              <Button onClick={() => doGenerateNode(selectedCategory)} disabled={!selectedCategory || genLoading}>
                {genLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                生成
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
