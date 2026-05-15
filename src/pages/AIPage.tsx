import { useState } from 'react'
import { pb } from '../lib/pb'
import { useAppStore } from '../store/useAppStore'
import { Sparkles, BookOpen, Wand2, FileText } from 'lucide-react'

export default function AIPage() {
  const { currentWorkId, currentWorkTitle } = useAppStore()
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<'outline' | 'expand' | 'character'>('outline')
  const [loading, setLoading] = useState(false)

  const modes = [
    { id: 'outline' as const, label: '大纲生成', icon: BookOpen, color: 'text-green-600 bg-green-50' },
    { id: 'expand' as const, label: '内容扩写', icon: Wand2, color: 'text-orange-600 bg-orange-50' },
    { id: 'character' as const, label: '角色生成', icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
  ]

  const generate = async () => {
    setLoading(true)
    setResult('')
    try {
      const configs = await pb.collection('ai_configs').getFullList({ filter: 'isDefault=true' })
      const cfg = configs[0]
      if (!cfg) { alert('请先在设置中配置 AI'); setLoading(false); return }

      const prompts: Record<string, string> = {
        outline: `请为小说"${currentWorkTitle}"生成一份详细大纲。${prompt ? `要求：${prompt}` : ''}`,
        expand: `请将以下内容进行扩展和润色，保持原文风格：\n\n${prompt}`,
        character: `请生成一个适合"${currentWorkTitle}"的角色设定，包含姓名、性别、年龄、身份、势力、性格、能力、背景。${prompt ? `要求：${prompt}` : ''}。返回JSON格式。`,
      }

      const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({ model: cfg.model, messages: [{ role: 'user', content: prompts[mode] }], temperature: 0.8 }),
      })
      const data = await resp.json()
      setResult(data.choices?.[0]?.message?.content || '生成失败')
    } catch (err: any) { setResult(`❌ ${err.message}`) }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 助手</h2>
      <p className="text-gray-500 text-sm mb-6">AI 辅助创作，提升写作效率</p>

      {/* Mode Selector */}
      <div className="flex gap-3 mb-6">
        {modes.map((m) => (
          <button key={m.id} onClick={() => { setMode(m.id); setResult(''); setPrompt('') }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m.id ? `${m.color} shadow-sm` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <m.icon className="w-4 h-4" />{m.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="mb-4">
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder={mode === 'expand' ? '粘贴需要扩写的内容...' : '输入创作要求（可选）...'}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
          rows={4} />
      </div>

      {/* Generate */}
      <button onClick={generate} disabled={loading || (mode === 'expand' && !prompt)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-6 shadow-sm">
        <Sparkles className="w-4 h-4" />
        {loading ? 'AI 正在创作...' : '开始生成'}
      </button>

      {/* Result */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" /> 生成结果
            </div>
            <button onClick={() => navigator.clipboard.writeText(result)}
              className="text-xs text-primary-500 hover:text-primary-600">复制</button>
          </div>
          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{result}</div>
        </div>
      )}
    </div>
  )
}
