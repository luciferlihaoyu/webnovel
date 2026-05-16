import { useState, useEffect, useCallback } from 'react'
import { pb } from '../lib/pb'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Select } from '../components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Plus, Sparkles, FileText, Edit3, Trash2, Users, Loader2 } from 'lucide-react'

interface Character {
  id: string
  name: string
  gender: string
  age: number
  identity: string
  faction: string
  personality: string
  role: string
  ability: string
  appearance: string
  background: string
  motivation: string
  arc: string
  debutChapter: string
  status: string
  work: string
}

const emptyChar: Character = {
  id: '', name: '', gender: '男', age: 0, identity: '', faction: '',
  personality: '', role: '配角', ability: '', appearance: '', background: '',
  motivation: '', arc: '', debutChapter: '', status: '存活', work: '',
}

const roleColorMap: Record<string, string> = {
  '主角': 'default',
  '配角': 'secondary',
  '反派': 'destructive',
  '路人': 'warning',
}

type FieldGroup = 'basic' | 'detail' | 'story'

const fieldGroupMap: Record<FieldGroup, (keyof Character)[]> = {
  basic: ['name', 'gender', 'age', 'identity', 'role', 'status', 'faction', 'personality'],
  detail: ['appearance', 'ability', 'background'],
  story: ['motivation', 'arc', 'debutChapter'],
}

const fieldGroupLabels: Record<FieldGroup, string> = {
  basic: '基本信息',
  detail: '详细设定',
  story: '故事相关',
}

const aiFieldPrompts: Record<string, string> = {
  name: '姓名',
  gender: '性别（男/女/其他）',
  age: '年龄（数字）',
  identity: '身份',
  role: '角色定位（主角/配角/反派/路人）',
  status: '状态（存活/死亡/失踪）',
  faction: '所属势力',
  personality: '性格描述',
  appearance: '外貌描述',
  ability: '能力描述',
  background: '背景故事',
  motivation: '动机',
  arc: '角色弧光/成长线',
  debutChapter: '登场章节',
}

export default function CharactersPage() {
  const { currentWorkId, currentWorkTitle } = useAppStore()
  const [characters, setCharacters] = useState<Character[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingChar, setEditingChar] = useState<Character>({ ...emptyChar })
  const [formTab, setFormTab] = useState('basic')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [generatingGroup, setGeneratingGroup] = useState<string | null>(null)
  const [importText, setImportText] = useState('')
  const [showImport, setShowImport] = useState(false)

  const fetchCharacters = useCallback(async () => {
    if (!currentWorkId) return
    try {
      const records = await pb.collection('characters').getFullList<Character>({
        filter: `work = "${currentWorkId}"`,
        sort: '-created',
      })
      setCharacters(records)
    } catch (err) {
      console.error('Failed to fetch characters:', err)
    }
  }, [currentWorkId])

  useEffect(() => {
    fetchCharacters()
  }, [fetchCharacters])

  const openNew = () => {
    setEditingChar({ ...emptyChar, work: currentWorkId || '' })
    setFormTab('basic')
    setShowDialog(true)
  }

  const openEdit = (char: Character) => {
    setEditingChar({ ...char })
    setFormTab('basic')
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!editingChar.name.trim()) return
    setLoading(true)
    try {
      const data = { ...editingChar, work: currentWorkId }
      if (editingChar.id) {
        await pb.collection('characters').update(editingChar.id, data)
      } else {
        await pb.collection('characters').create(data)
      }
      setShowDialog(false)
      await fetchCharacters()
    } catch (err) {
      console.error('Failed to save character:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await pb.collection('characters').delete(id)
      await fetchCharacters()
    } catch (err) {
      console.error('Failed to delete character:', err)
    }
  }

  const getAIConfig = async () => {
    const configs = await pb.collection('ai_configs').getFullList({ filter: 'isDefault = true' })
    return configs[0] || (await pb.collection('ai_configs').getFullList())[0]
  }

  const callAI = async (prompt: string): Promise<string> => {
    const config = await getAIConfig()
    if (!config) throw new Error('请先在设置中配置 AI')
    const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], temperature: 0.8 }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  const parseAIJson = (reply: string): Record<string, any> | null => {
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/)
      if (jsonMatch) return JSON.parse(jsonMatch[0])
    } catch { /* ignore */ }
    return null
  }

  const generateFieldGroup = async (group: FieldGroup) => {
    setGeneratingGroup(group)
    try {
      const fields = fieldGroupMap[group]
      const fieldsToGenerate = fields.filter(f => {
        const val = editingChar[f]
        return !val || val === '0' || val === 0
      })
      if (fieldsToGenerate.length === 0) {
        setGeneratingGroup(null)
        return
      }

      const fieldsDesc = fieldsToGenerate.map(f => `"${f}": "${aiFieldPrompts[f]}"`).join(',\n  ')

      // Build context from already filled fields
      const filledFields = Object.entries(editingChar)
        .filter(([k, v]) => k !== 'id' && k !== 'work' && v && v !== '0' && v !== 0)
        .map(([k, v]) => `${aiFieldPrompts[k] || k}: ${v}`)
      const contextStr = filledFields.length ? `\n\n已有角色信息：\n${filledFields.join('\n')}` : ''

      const prompt = `请为小说《${currentWorkTitle}》的一个角色生成以下字段（JSON格式）：
{
  ${fieldsDesc}
}
要求只返回JSON，字段名用英文。${contextStr}`

      const reply = await callAI(prompt)
      const parsed = parseAIJson(reply)
      if (parsed) {
        setEditingChar(prev => ({ ...prev, ...parsed }))
      } else {
        alert('AI 返回格式解析失败')
      }
    } catch (err: any) {
      alert(err.message || 'AI 请求失败')
    }
    setGeneratingGroup(null)
  }

  const generateAllEmpty = async () => {
    setAiLoading(true)
    try {
      const allFields = Object.keys(aiFieldPrompts) as (keyof Character)[]
      const fieldsToGenerate = allFields.filter(f => {
        const val = editingChar[f]
        return !val || val === '0' || val === 0
      })
      if (fieldsToGenerate.length === 0) {
        setAiLoading(false)
        return
      }

      const fieldsDesc = fieldsToGenerate.map(f => `"${f}": "${aiFieldPrompts[f]}"`).join(',\n  ')

      const filledFields = Object.entries(editingChar)
        .filter(([k, v]) => k !== 'id' && k !== 'work' && v && v !== '0' && v !== 0)
        .map(([k, v]) => `${aiFieldPrompts[k] || k}: ${v}`)
      const contextStr = filledFields.length ? `\n\n已有角色信息：\n${filledFields.join('\n')}` : ''

      const prompt = `请为小说《${currentWorkTitle}》的一个角色生成以下字段（JSON格式）：
{
  ${fieldsDesc}
}
要求只返回JSON，字段名用英文。${contextStr}`

      const reply = await callAI(prompt)
      const parsed = parseAIJson(reply)
      if (parsed) {
        setEditingChar(prev => ({ ...prev, ...parsed }))
      } else {
        alert('AI 返回格式解析失败')
      }
    } catch (err: any) {
      alert(err.message || 'AI 请求失败')
    }
    setAiLoading(false)
  }

  const handleTextImport = async () => {
    if (!importText.trim()) return
    setAiLoading(true)
    try {
      const prompt = `从以下文本中提取角色信息，返回JSON格式（中文）：
${importText}

返回格式：{"name":"", "gender":"男/女/其他", "age":0, "identity":"", "faction":"", "personality":"", "role":"主角/配角/反派/路人", "ability":"", "appearance":"", "background":"", "motivation":"", "arc":"", "debutChapter":"", "status":"存活/死亡/失踪"}`
      const reply = await callAI(prompt)
      const parsed = parseAIJson(reply)
      if (parsed) {
        setEditingChar({ ...emptyChar, ...parsed, work: currentWorkId || '' })
        setShowImport(false)
        setShowDialog(true)
        setFormTab('basic')
      } else {
        alert('AI 解析失败')
      }
    } catch (err) {
      console.error('Import failed:', err)
      alert('导入失败')
    } finally {
      setAiLoading(false)
    }
  }

  if (!currentWorkId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">请先选择一部作品</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">角色管理</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <FileText className="w-4 h-4 mr-1" />
            文字导入
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1" />
            添加角色
          </Button>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Users className="w-16 h-16 mb-4 opacity-30" />
          <p>还没有角色</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <Card key={char.id} className="hover:border-gray-300 transition-colors cursor-pointer" onClick={() => openEdit(char)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{char.name}</h3>
                      <Badge variant={roleColorMap[char.role] as any || 'secondary'}>{char.role}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {char.gender} · {char.age ? `${char.age}岁` : '未知年龄'} · {char.status}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={(e) => { e.stopPropagation(); openEdit(char) }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleDelete(char.id) }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {char.identity && <p className="text-sm text-gray-500 mb-1">{char.identity}</p>}
                {char.faction && <Badge variant="purple" className="mr-1 mb-1">{char.faction}</Badge>}
                {char.personality && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{char.personality}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Character Edit/Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogHeader>
          <DialogTitle>{editingChar.id ? '编辑角色' : '添加角色'}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Tabs value={formTab} onValueChange={setFormTab}>
            <TabsList>
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="detail">详细设定</TabsTrigger>
              <TabsTrigger value="story">故事相关</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-3">
              <div className="flex justify-end mb-1">
                <Button variant="outline" size="sm" onClick={() => generateFieldGroup('basic')} disabled={generatingGroup !== null}>
                  {generatingGroup === 'basic' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                  AI 生成
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">姓名</label>
                  <Input value={editingChar.name} onChange={(e) => setEditingChar({ ...editingChar, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">性别</label>
                  <Select
                    value={editingChar.gender}
                    onChange={(e) => setEditingChar({ ...editingChar, gender: e.target.value })}
                    options={[{ value: '男', label: '男' }, { value: '女', label: '女' }, { value: '其他', label: '其他' }]}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">年龄</label>
                  <Input type="number" value={editingChar.age || ''} onChange={(e) => setEditingChar({ ...editingChar, age: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">身份</label>
                  <Input value={editingChar.identity} onChange={(e) => setEditingChar({ ...editingChar, identity: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">角色定位</label>
                  <Select value={editingChar.role} onChange={(e) => setEditingChar({ ...editingChar, role: e.target.value })}
                    options={[{ value: '主角', label: '主角' }, { value: '配角', label: '配角' }, { value: '反派', label: '反派' }, { value: '路人', label: '路人' }]} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">状态</label>
                  <Select value={editingChar.status} onChange={(e) => setEditingChar({ ...editingChar, status: e.target.value })}
                    options={[{ value: '存活', label: '存活' }, { value: '死亡', label: '死亡' }, { value: '失踪', label: '失踪' }]} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">所属势力</label>
                <Input value={editingChar.faction} onChange={(e) => setEditingChar({ ...editingChar, faction: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">性格</label>
                <Textarea rows={2} value={editingChar.personality} onChange={(e) => setEditingChar({ ...editingChar, personality: e.target.value })} />
              </div>
            </TabsContent>

            {/* Detail Tab */}
            <TabsContent value="detail" className="space-y-3">
              <div className="flex justify-end mb-1">
                <Button variant="outline" size="sm" onClick={() => generateFieldGroup('detail')} disabled={generatingGroup !== null}>
                  {generatingGroup === 'detail' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                  AI 生成
                </Button>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">外貌</label>
                <Textarea rows={3} value={editingChar.appearance} onChange={(e) => setEditingChar({ ...editingChar, appearance: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">能力</label>
                <Textarea rows={3} value={editingChar.ability} onChange={(e) => setEditingChar({ ...editingChar, ability: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">背景故事</label>
                <Textarea rows={4} value={editingChar.background} onChange={(e) => setEditingChar({ ...editingChar, background: e.target.value })} />
              </div>
            </TabsContent>

            {/* Story Tab */}
            <TabsContent value="story" className="space-y-3">
              <div className="flex justify-end mb-1">
                <Button variant="outline" size="sm" onClick={() => generateFieldGroup('story')} disabled={generatingGroup !== null}>
                  {generatingGroup === 'story' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                  AI 生成
                </Button>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">动机</label>
                <Textarea rows={2} value={editingChar.motivation} onChange={(e) => setEditingChar({ ...editingChar, motivation: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">角色弧光</label>
                <Textarea rows={3} value={editingChar.arc} onChange={(e) => setEditingChar({ ...editingChar, arc: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">登场章节</label>
                <Input value={editingChar.debutChapter} onChange={(e) => setEditingChar({ ...editingChar, debutChapter: e.target.value })} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={generateAllEmpty} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
            AI 补全空白字段
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button onClick={handleSave} disabled={loading || !editingChar.name.trim()}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </DialogFooter>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogHeader><DialogTitle>文字导入角色</DialogTitle></DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-500 mb-3">粘贴包含角色描述的文字，AI 将自动解析并填充表单。</p>
          <Textarea
            rows={6}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="粘贴角色描述文字..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowImport(false)}>取消</Button>
          <Button onClick={handleTextImport} disabled={aiLoading || !importText.trim()}>
            <Sparkles className="w-4 h-4 mr-1" />
            {aiLoading ? '解析中...' : 'AI 解析'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
