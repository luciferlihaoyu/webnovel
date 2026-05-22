import { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { cn } from '../lib/utils'
import {
  PenLine, Sparkles, BookOpen, Wand2, UserPlus,
  BarChart3, Users, ChevronRight, ChevronDown, Map
} from 'lucide-react'

interface CharacterData {
  id: string
  name: string
  role: string
  gender: string
  age: number
  identity: string
  faction: string
  personality: string
  avatar?: string
}

interface WorldTreeNode {
  id: string
  name: string
  children?: WorldTreeNode[]
}

interface RightSidebarProps {
  showQuickActions?: boolean
  showCharacters?: boolean
  showWorldTree?: boolean
  characters?: CharacterData[]
  worldTree?: WorldTreeNode[]
}

const quickActions = [
  { icon: PenLine, label: '继续写作', color: 'text-blue-500 bg-blue-50' },
  { icon: Sparkles, label: '大纲生成', color: 'text-purple-500 bg-purple-50' },
  { icon: BookOpen, label: '设定生成', color: 'text-amber-500 bg-amber-50' },
  { icon: Wand2, label: '扩写', color: 'text-green-500 bg-green-50' },
  { icon: UserPlus, label: '取名助手', color: 'text-pink-500 bg-pink-50' },
  { icon: BarChart3, label: '数据统计', color: 'text-cyan-500 bg-cyan-50' },
]

export default function RightSidebar({
  showQuickActions = true,
  showCharacters = true,
  showWorldTree = true,
  characters = [],
  worldTree = [],
}: RightSidebarProps) {
  const { setPage } = useAppStore()
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // Auto-expand first root node on mount
  useEffect(() => {
    if (worldTree.length > 0 && worldTree[0].name) {
      setExpandedNodes(new Set([worldTree[0].name]))
    }
  }, [worldTree])

  const toggleNode = (name: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const getRoleColor = (role: string) => {
    const map: Record<string, string> = {
      '主角': 'bg-amber-100 text-amber-700',
      '配角': 'bg-blue-100 text-blue-700',
      '反派': 'bg-red-100 text-red-700',
      '路人': 'bg-gray-100 text-gray-600',
      '导师': 'bg-purple-100 text-purple-700',
      '恋人': 'bg-pink-100 text-pink-700',
    }
    return map[role] || 'bg-gray-100 text-gray-600'
  }

  const renderWorldNode = (node: WorldTreeNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.name)

    return (
      <div key={node.id || node.name}>
        <div
          className={cn(
            'flex items-center gap-1.5 py-1 px-1 rounded cursor-pointer hover:bg-gray-100 text-sm transition-colors',
            depth === 0 && 'font-medium text-gray-900'
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => hasChildren && toggleNode(node.name)}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />
          ) : (
            <span className="w-3 h-3 flex items-center justify-center text-gray-300">·</span>
          )}
          <span className="flex-1 truncate">{node.name}</span>
        </div>
        {hasChildren && isExpanded && node.children!.map((child) => renderWorldNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <aside className="w-[280px] flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        {showQuickActions && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">快捷操作</h4>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    if (action.label === '数据统计') setPage('stats')
                    else if (action.label === '大纲生成') setPage('ai')
                    else if (action.label === '取名助手') setPage('characters')
                    else if (action.label === '继续写作') setPage('editor')
                    else if (action.label === '设定生成') setPage('ai')
                    else if (action.label === '扩写') setPage('editor')
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={cn('p-2 rounded-lg', action.color)}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-gray-600">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Character Cards */}
        {showCharacters && characters.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">角色卡片</h4>
            <div className="space-y-3">
              {characters.slice(0, 1).map((char) => (
                <div key={char.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-start gap-3">
                    {/* Anime-style portrait placeholder */}
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-semibold text-sm text-gray-900">{char.name}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', getRoleColor(char.role))}>{char.role}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {char.gender} · {char.age || '?'}岁
                      </p>
                      {char.identity && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{char.identity}</p>
                      )}
                      {char.faction && (
                        <span className="text-[10px] mt-1 inline-block bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                          {char.faction}
                        </span>
                      )}
                    </div>
                  </div>
                  {char.personality && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{char.personality}</p>
                  )}
                </div>
              ))}
              {characters.slice(1, 4).map((char) => (
                <div key={char.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-xs text-gray-900">{char.name}</span>
                      <span className={cn('text-[9px] px-1 py-0.5 rounded-full', getRoleColor(char.role))}>{char.role}</span>
                    </div>
                    {char.identity && <p className="text-[11px] text-gray-400 truncate">{char.identity}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Worldview Tree */}
        {showWorldTree && worldTree.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">世界观树</h4>
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
              {worldTree.map((node) => renderWorldNode(node))}
            </div>
          </div>
        )}

        {/* Empty state when no content */}
        {!showQuickActions && !showCharacters && (
          <div className="text-center py-8 text-gray-400">
            <Map className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">暂无侧边栏内容</p>
          </div>
        )}
      </div>
    </aside>
  )
}

export { quickActions }
