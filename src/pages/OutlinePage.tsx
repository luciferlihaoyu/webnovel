import { useState } from 'react'
import { pb } from '../lib/pb'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent } from '../components/ui/card'
import { Sparkles, Copy, BookOpen, Check } from 'lucide-react'

export default function OutlinePage() {
  const { currentWorkId, currentWorkTitle } = useAppStore()
  const [synopsis, setSynopsis] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    setLoading(true)
    setResult('')
    try {
      const configs = await pb.collection('ai_configs').getFullList({ filter: 'isDefault=true' })
      const cfg = configs[0]
      if (!cfg) {
        alert('请先在设置中配置 AI')
        setLoading(false)
        return
      }

      const prompt = `你是一位资深网文编辑。请为小说"${currentWorkTitle}"生成一份详细的大纲。

${synopsis ? `故事简介：${synopsis}` : ''}

请输出：
1. 故事主线（一句话概括）
2. 分卷大纲（每卷包含主要情节节点）
3. 关键转折点
4. 高潮与结局方向

格式清晰，分段落。`

      const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
        }),
      })
      const data = await resp.json()
      setResult(data.choices?.[0]?.message?.content || '生成失败，请重试')
    } catch (err: any) {
      setResult(`❌ 生成失败: ${err.message}`)
    }
    setLoading(false)
  }

  const copyResult = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!currentWorkId) {
    return <div className="flex items-center justify-center h-full text-gray-500">请先在书架选择作品</div>
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-100">大纲生成</h2>
        <p className="text-sm text-gray-400 mt-1">AI 辅助生成小说大纲</p>
      </div>

      {/* Book Info */}
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardContent className="p-4 flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-violet-400" />
          <div>
            <p className="text-gray-100 font-medium">{currentWorkTitle}</p>
            <p className="text-xs text-gray-500">将基于此作品生成大纲</p>
          </div>
        </CardContent>
      </Card>

      {/* Synopsis Input */}
      <div className="mb-4">
        <label className="text-sm text-gray-300 mb-2 block">故事简介（可选）</label>
        <Textarea
          placeholder="输入一句话简介或核心创意，帮助 AI 理解你的故事方向..."
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          rows={3}
          className="bg-gray-900 border-gray-700 text-gray-100"
        />
      </div>

      {/* Generate Button */}
      <Button
        className="w-full mb-6"
        size="lg"
        onClick={generate}
        disabled={loading}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {loading ? 'AI 正在构思大纲...' : 'AI 生成大纲'}
      </Button>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <Sparkles className="w-8 h-8 text-violet-400" />
            <p className="text-gray-400">AI 正在构思中，请稍候...</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-violet-400">📋 生成结果</h3>
              <Button variant="outline" size="sm" onClick={copyResult}>
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? '已复制' : '复制'}
              </Button>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-gray-200 whitespace-pre-wrap leading-relaxed text-sm">
                {result}
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-900/30 border border-amber-800/50 rounded-lg text-xs text-amber-200/80">
              💡 提示：生成结果可选中复制，粘贴到写作页作为参考。不满意可以修改简介后重新生成。
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
