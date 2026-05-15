import { useState } from 'react'
import { pb } from '../lib/pb'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Sparkles, Copy, Globe } from 'lucide-react'

export default function WorldPage() {
  const { currentWorkId } = useAppStore()
  const [nodes, setNodes] = useState<any[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [parentId, setParentId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [genLoading, setGenLoading] = useState(false)

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

  useState(() => { fetchNodes() })

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

  const generateNode = async () => {
    setGenLoading(true)
    try {
      const configs = await pb.collection('ai_configs').getFullList({ filter: 'isDefault=true' })
      const cfg = configs[0]
      if (!cfg) {
        alert('请先在设置中配置 AI')
        setGenLoading(false)
        return
      }
      const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [{
            role: 'user',
            content: `Generate a world-building element for a fantasy novel. Return JSON: {"name":"...","category":"势力/地点/功法/历史","description":"..."}`,
          }],
          temperature: 0.9,
        }),
      })
      const data = await resp.json()
      const text = data.choices?.[0]?.message?.content || ''
      // Parse JSON from response
      let json: any = {}
      try {
        json = JSON.parse(text.replace(/```json\n?/g, '').replace(/```/g, '').trim())
      } catch {
        json = { name: text.slice(0, 50), category: '', description: text }
      }
      await pb.collection('world_nodes').create({
        name: json.name || '新节点',
        work: currentWorkId,
        category: json.category || '',
        description: json.description || '',
        parent: null,
      })
      fetchNodes()
    } catch (err) {
      console.error(err)
      alert('AI 生成失败')
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
          className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer hover:bg-gray-800 transition-colors group`}
          style={{ paddingLeft: `${12 + depth * 24}px` }}
        >
          <button onClick={() => hasKids && toggleExpand(node.id)} className="text-gray-500 w-4">
            {hasKids ? (isExpanded ? '▾' : '▸') : '·'}
          </button>
          <span>{catIcons[node.category] || '🌐'}</span>
          <span className="text-gray-100 text-sm flex-1" onClick={() => toggleExpand(node.id)}>{node.name}</span>
          {node.category && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900/50 text-violet-300">{node.category}</span>
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
          <h2 className="text-xl font-bold text-gray-100">世界观</h2>
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
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-2">
          {roots.map((r: any) => renderNode(r, 0))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              {parentId ? '添加子节点' : '新建节点'}
            </h3>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 text-sm mb-4"
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
    </div>
  )
}
