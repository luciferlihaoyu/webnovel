import { useState, useEffect } from 'react'
import { pb } from '../lib/pb'
import { useAppStore } from '../store/useAppStore'
import { TrendingUp, BookOpen, Flame, Clock } from 'lucide-react'

const DAYS = ['周一','周二','周三','周四','周五','周六','周日']

export default function StatsPage() {
  const { currentWorkId } = useAppStore()
  const [weeklyData, setWeeklyData] = useState<number[]>([500,1000,1500,1000,2000,3000,1500])
  const [totalWords, setTotalWords] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!currentWorkId) return
    // Load stats from PocketBase chapters
    pb.collection('chapters').getFullList({ filter: `work="${currentWorkId}"` })
      .then(chapters => {
        const total = chapters.reduce((sum: number, c: any) => sum + (c.wordCount || 0), 0)
        setTotalWords(total)
      }).catch(console.error)
    setStreak(6) // placeholder
  }, [currentWorkId])

  const maxVal = Math.max(...weeklyData, 1)
  const weeklyTotal = weeklyData.reduce((a,b)=>a+b,0)

  const stats = [
    { label: '总字数', value: totalWords.toLocaleString(), icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { label: '连续天数', value: `${streak} 天`, icon: Flame, color: 'text-orange-600 bg-orange-50' },
    { label: '日均字数', value: totalWords ? Math.round(totalWords/30).toLocaleString() : '0', icon: Clock, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">数据统计</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900">本周字数</h3>
            <p className="text-sm text-gray-500">{weeklyTotal.toLocaleString()} 字</p>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-md">
            <TrendingUp className="w-3 h-3" /> ↑ 32%
          </div>
        </div>
        <div className="flex items-end gap-2 h-48">
          {weeklyData.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-xs text-gray-600 font-medium">{val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}</span>
              <div className="w-full bg-primary-500 rounded-t-md hover:bg-primary-600 transition-colors cursor-pointer"
                style={{ height: `${(val/maxVal)*100}%`, minHeight: 4 }} />
              <span className="text-xs text-gray-400">{DAYS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder for more stats */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
        更多统计功能即将上线 — 写作热力图、章节进度、时间分布
      </div>
    </div>
  )
}
