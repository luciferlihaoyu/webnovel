import { useState, useEffect } from 'react'
import { pb } from '../lib/pb'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Plus, Trash2, Wifi, Edit3, Star } from 'lucide-react'

interface AiConfig {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  model: string
  isDefault: boolean
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<AiConfig[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<AiConfig | null>(null)
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState('')

  const fetchConfigs = async () => {
    try {
      const records = await pb.collection('ai_configs').getFullList<AiConfig>({ sort: '-isDefault' })
      setConfigs(records)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchConfigs() }, [])

  const openNew = () => {
    setEditing(null)
    setName('')
    setBaseUrl('')
    setApiKey('')
    setModel('')
    setIsDefault(false)
    setShowDialog(true)
  }

  const openEdit = (c: AiConfig) => {
    setEditing(c)
    setName(c.name)
    setBaseUrl(c.baseUrl)
    setApiKey(c.apiKey)
    setModel(c.model)
    setIsDefault(c.isDefault)
    setShowDialog(true)
  }

  const save = async () => {
    const data = { name, baseUrl, apiKey, model, isDefault }
    try {
      if (editing) {
        await pb.collection('ai_configs').update(editing.id, data)
      } else {
        await pb.collection('ai_configs').create(data)
      }
      setShowDialog(false)
      fetchConfigs()
    } catch (err) {
      console.error(err)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('确定删除此配置？')) return
    await pb.collection('ai_configs').delete(id)
    fetchConfigs()
  }

  const testConnection = async (c: AiConfig) => {
    setTesting(c.id)
    setTestResult('')
    try {
      const resp = await fetch(`${c.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${c.apiKey}`,
        },
        body: JSON.stringify({
          model: c.model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        }),
      })
      if (resp.ok) {
        setTestResult(`✅ ${c.name} 连接成功`)
      } else {
        const err = await resp.text()
        setTestResult(`❌ ${c.name}: ${resp.status} ${err.slice(0, 100)}`)
      }
    } catch (err: any) {
      setTestResult(`❌ ${c.name}: ${err.message}`)
    }
    setTesting(null)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-100">AI 提供商配置</h2>
          <p className="text-sm text-gray-400 mt-1">支持任何兼容 OpenAI API 的服务商</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> 添加
        </Button>
      </div>

      {configs.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">暂无配置</p>
          <p className="text-sm">点击右上角"添加"来配置你的第一个 AI 服务</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((c) => (
            <Card key={c.id} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-100">{c.name}</span>
                    {c.isDefault && <Badge className="bg-amber-600 text-xs">默认</Badge>}
                  </div>
                  <p className="text-sm text-gray-400 truncate">{c.model} · {c.baseUrl}</p>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => testConnection(c)}
                    disabled={testing === c.id}
                  >
                    <Wifi className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(c.id)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {testResult && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          testResult.includes('✅') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
        }`}>
          {testResult}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogHeader>
          <DialogTitle>{editing ? '编辑配置' : '新增配置'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="配置名称 (如 Kimi / DeepSeek)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Base URL (如 https://api.deepseek.com/v1)" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          <Input placeholder="API Key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          <Input placeholder="模型名称 (如 deepseek-v4-flash)" value={model} onChange={(e) => setModel(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded bg-gray-800 border-gray-600" />
            设为默认配置
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
          <Button onClick={save}>保存</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
