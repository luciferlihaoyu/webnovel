import { cn } from '../lib/utils'

interface DailyProgressProps {
  currentWords: number
  targetWords: number
  className?: string
}

export default function DailyProgress({ currentWords, targetWords, className }: DailyProgressProps) {
  const percentage = Math.min(Math.round((currentWords / targetWords) * 100), 100)
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = () => {
    if (percentage >= 66) return '#10b981'
    if (percentage >= 33) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="progress-ring-circle"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
          <span className="text-xs text-gray-500 mt-0.5">
            {currentWords.toLocaleString()}/{targetWords.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
