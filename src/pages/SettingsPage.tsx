import { useState, useEffect } from 'react'
import { pb } from '../lib/pb'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Plus, Trash2, Wifi, Edit3, Settings, Cloud, Target, Database, Loader2 } from 'lucide-react'

interface AiConfig {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  model: string
  isDefault: boolean
}

export default function SettingsPage() {
  // AI Config state
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

  // WebDAV state
  const [webdavUrl, setWebdavUrl] = useState('')
  const [webdavUser, setWebdavUser] = useState('')
  const [webdavPass, setWebdavPass] = useState('')
  const [webdavSaving, setWebdavSaving] = useState(false)

  // Daily goal state
  const [dailyGoal, setDailyGoal] = useState(3000)

  const fetchConfigs = async () => {
    try {
      const records = await pb.collection('ai_configs').getFullList<AiConfig>({ sort: '-isDefault' })
      setConfigs(records)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchConfigs()
    // Load WebDAV settings from localStorage
    setWebdavUrl(localStorage.getItem('webdav_url') || '')
    setWebdavUser(localStorage.getItem('webdav_user') || '')
    setWebdavPass(localStorage.getItem('webdav_pass') || '')
    setDailyGoal(parseInt(localStorage.getItem('daily_goal') || '3000', 10))
  }, [])

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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.apiKey}` },
        body: JSON.stringify({ model: c.model, messages: [{ role: 'user', content: 'Hello' }], max_tokens: 5 }),
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

  const saveWebdav = () => {
    setWebdavSaving(true)
    localStorage.setItem('webdav_url', webdavUrl)
    localStorage.setItem('webdav_user', webdavUser)
    localStorage.setItem('webdav_pass', webdavPass)
    setTimeout(() => setWebdavSaving(false), 500)
  }

  const saveDailyGoal = () => {
    localStorage.setItem('daily_goal', String(dailyGoal))
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* AI Config Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Settings className="w-5 h-5 text-gray-500" />
              <h2 className="text-xl font-bold text-gray-900">AI 提供商配置</h2>
            </div>
            <p className="text-sm text-gray-500">支持任何兼容 OpenAI API 的服务商</p>
          </div>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-1" /> 添加
          </Button>
        </div>

        {configs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-xl">
            <p className="text-lg mb-2">暂无配置</p>
            <p className="text-sm">点击右上角"添加"来配置你的第一个 AI 服务</p>
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{c.name}</span>
                      {c.isDefault && <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">默认</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{c.model} · {c.baseUrl}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => testConnection(c)} disabled={testing === c.id}>
                      {testing === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
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
            testResult.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
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
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-gray-300" />
              设为默认配置
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button onClick={save}>保存</Button>
          </DialogFooter>
        </Dialog>
      </section>

      {/* WebDAV Sync Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-bold text-gray-900">WebDAV 同步配置</h2>
        </div>
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">服务器地址</label>
              <Input placeholder="https://dav.example.com/dav/" value={webdavUrl} onChange={(e) => setWebdavUrl(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">用户名</label>
                <Input placeholder="username" value={webdavUser} onChange={(e) => setWebdavUser(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">密码</label>
                <Input placeholder="password" type="password" value={webdavPass} onChange={(e) => setWebdavPass(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={saveWebdav} disabled={webdavSaving}>
                {webdavSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                保存配置
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Daily Goal Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-bold text-gray-900">每日写作目标</h2>
        </div>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1">每日目标字数</label>
                <Input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value) || 0)}
                  onBlur={saveDailyGoal}
                  min={0}
                  step={500}
                />
              </div>
              <div className="text-right pt-5">
                <p className="text-2xl font-bold text-primary-500">{dailyGoal.toLocaleString()}</p>
                <p className="text-xs text-gray-500">字/天</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Data Management Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-bold text-gray-900">数据管理</h2>
        </div>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500 mb-4">导出或导入你的作品数据。数据以 JSON 格式保存。</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => alert('导出功能开发中...')}>
                导出数据
              </Button>
              <Button variant="outline" onClick={() => alert('导入功能开发中...')}>
                导入数据
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
