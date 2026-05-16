import { useState } from 'react'
import { pb } from '../lib/pb'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Sparkles, BookOpen, Wand2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface OutlineSections {
  worldSetting: string
  coreConflict: string
  protagonist: string
  mainPlot: string
  volumeStructure: string
}

const sectionDefs: { key: keyof OutlineSections; label: string; placeholder: string; promptHint: string }[] = [
  { key: 'worldSetting', label: '世界观设定', placeholder: '描述故事发生的世界背景、历史、魔法/科技体系等...', promptHint: '世界观背景、历史、规则体系' },
  { key: 'coreConflict', label: '核心冲突', placeholder: '故事的核心矛盾、对立面、主要张力...', promptHint: '核心矛盾和冲突' },
  { key: 'protagonist', label: '主角设定', placeholder: '主角的身份、能力、性格、动机...', promptHint: '主角设定，包括身份、能力、性格' },
  { key: 'mainPlot', label: '故事主线', placeholder: '故事的主要发展线索和关键节点...', promptHint: '故事主线和关键情节节点' },
  { key: 'volumeStructure', label: '卷/篇章结构', placeholder: '各卷/篇章的标题和概要...', promptHint: '卷/篇章划分和概要' },
]

export default function AIPage() {
  const { currentWorkTitle } = useAppStore()
  const [mode, setMode] = useState<'outline' | 'expand'>('outline')
  const [sections, setSections] = useState<OutlineSections>({
    worldSetting: '', coreConflict: '', protagonist: '', mainPlot: '', volumeStructure: '',
  })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingSection, setGeneratingSection] = useState<string | null>(null)
  const [expandText, setExpandText] = useState('')
  const [expandResult, setExpandResult] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const getAIConfig = async () => {
    const configs = await pb.collection('ai_configs').getFullList({ filter: 'isDefault=true' })
    const cfg = configs[0] || (await pb.collection('ai_configs').getFullList())[0]
    if (!cfg) throw new Error('请先在设置中配置 AI')
    return cfg
  }

  const callAI = async (prompt: string): Promise<string> => {
    const cfg = await getAIConfig()
    const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({ model: cfg.model, messages: [{ role: 'user', content: prompt }], temperature: 0.8 }),
    })
    const data = await resp.json()
    return data.choices?.[0]?.message?.content || '生成失败'
  }

  const generateSection = async (key: keyof OutlineSections) => {
    setGeneratingSection(key)
    try {
      const def = sectionDefs.find(d => d.key === key)!
      const contextParts = sectionDefs
        .filter(d => d.key !== key && sections[d.key])
        .map(d => `${d.label}：${sections[d.key]}`)
      const contextStr = contextParts.length ? `\n\n已确定的设定：\n${contextParts.join('\n')}` : ''
      const prompt = `请为小说《${currentWorkTitle}》生成${def.promptHint}。要求具体、有创意，直接输出内容，不要标题。${contextStr}`
      const text = await callAI(prompt)
      setSections(prev => ({ ...prev, [key]: text }))
    } catch (err: any) {
      alert(err.message)
    }
    setGeneratingSection(null)
  }

  const generateAllEmpty = async () => {
    setLoading(true)
    try {
      for (const def of sectionDefs) {
        if (!sections[def.key]) {
          const contextParts = sectionDefs
            .filter(d => d.key !== def.key && sections[d.key])
            .map(d => `${d.label}：${sections[d.key]}`)
          const contextStr = contextParts.length ? `\n\n已确定的设定：\n${contextParts.join('\n')}` : ''
          const prompt = `请为小说《${currentWorkTitle}》生成${def.promptHint}。要求具体、有创意，直接输出内容，不要标题。${contextStr}`
          const text = await callAI(prompt)
          setSections(prev => ({ ...prev, [def.key]: text }))
        }
      }
    } catch (err: any) {
      alert(err.message)
    }
    setLoading(false)
  }

  const generateFullOutline = async () => {
    setLoading(true)
    setResult('')
    try {
      const filled = sectionDefs
        .filter(d => sections[d.key])
        .map(d => `${d.label}：\n${sections[d.key]}`)
      const contextStr = filled.length ? `\n\n已有设定：\n${filled.join('\n\n')}` : ''
      const prompt = `请基于以下设定，为小说《${currentWorkTitle}》生成一份完整详细的小说大纲，包含各卷章节安排、剧情走向、伏笔设计等。${contextStr}\n\n请输出完整大纲。`
      const text = await callAI(prompt)
      setResult(text)
    } catch (err: any) {
      setResult(`❌ ${err.message}`)
    }
    setLoading(false)
  }

  const handleExpand = async () => {
    setLoading(true)
    setExpandResult('')
    try {
      const text = await callAI(`请将以下内容进行扩展和润色，保持原文风格，丰富细节：\n\n${expandText}`)
      setExpandResult(text)
    } catch (err: any) {
      setExpandResult(`❌ ${err.message}`)
    }
    setLoading(false)
  }

  const updateSection = (key: keyof OutlineSections, value: string) => {
    setSections(prev => ({ ...prev, [key]: value }))
  }

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const hasAnySection = Object.values(sections).some(v => v)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 助手</h2>
      <p className="text-gray-500 text-sm mb-6">AI 辅助创作，提升写作效率</p>

      {/* Mode Selector */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => { setMode('outline'); setExpandResult('') }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'outline' ? 'text-green-600 bg-green-50 shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          <BookOpen className="w-4 h-4" />大纲生成
        </button>
        <button onClick={() => { setMode('expand'); setResult('') }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'expand' ? 'text-orange-600 bg-orange-50 shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          <Wand2 className="w-4 h-4" />内容扩写
        </button>
      </div>

      {mode === 'outline' && (
        <div className="space-y-4">
          {/* Modular Sections */}
          <div className="space-y-3">
            {sectionDefs.map(def => {
              const isOpen = expandedSections.has(def.key) || !!sections[def.key]
              return (
                <div key={def.key} className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <button
                    onClick={() => toggleSection(def.key)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{def.label}</span>
                      {sections[def.key] && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已填</span>
                      )}
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 space-y-2">
                      <Textarea
                        value={sections[def.key]}
                        onChange={(e) => updateSection(def.key, e.target.value)}
                        placeholder={def.placeholder}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateSection(def.key)}
                          disabled={generatingSection !== null}
                        >
                          {generatingSection === def.key ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 mr-1" />
                          )}
                          AI 填充
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={generateAllEmpty}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              全部自动生成
            </Button>
            <Button
              className="flex-1"
              onClick={generateFullOutline}
              disabled={loading || !hasAnySection}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              生成完整大纲
            </Button>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 font-medium">完整大纲</span>
                <button onClick={() => navigator.clipboard.writeText(result)}
                  className="text-xs text-primary-500 hover:text-primary-600">复制</button>
              </div>
              <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{result}</div>
            </div>
          )}
        </div>
      )}

      {mode === 'expand' && (
        <div className="space-y-4">
          <Textarea
            value={expandText}
            onChange={(e) => setExpandText(e.target.value)}
            placeholder="粘贴需要扩写的内容..."
            rows={6}
          />
          <Button
            className="w-full"
            onClick={handleExpand}
            disabled={loading || !expandText.trim()}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {loading ? 'AI 正在扩写...' : '开始扩写'}
          </Button>
          {expandResult && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 font-medium">扩写结果</span>
                <button onClick={() => navigator.clipboard.writeText(expandResult)}
                  className="text-xs text-primary-500 hover:text-primary-600">复制</button>
              </div>
              <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{expandResult}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
