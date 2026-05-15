interface WeeklyChartProps {
  data: { day: string; words: number }[]
  trend?: string
}

export default function WeeklyChart({ data, trend }: WeeklyChartProps) {
  const maxWords = Math.max(...data.map((d) => d.words), 1)

  const getBarColor = (words: number) => {
    const ratio = words / maxWords
    if (ratio >= 0.8) return '#3b82f6'
    if (ratio >= 0.4) return '#93c5fd'
    return '#bfdbfe'
  }

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-1 h-32 px-1">
        {data.map((item, i) => {
          const height = (item.words / maxWords) * 100
          return (
            <div key={i} className="flex flex-col items-center flex-1 gap-1">
              <span className="text-[10px] text-gray-500 font-medium">
                {item.words > 0 ? (item.words >= 1000 ? `${(item.words / 1000).toFixed(1)}k` : item.words) : ''}
              </span>
              <div
                className="w-full max-w-[28px] rounded-t-md transition-all duration-500"
                style={{
                  height: `${Math.max(height, 4)}%`,
                  backgroundColor: getBarColor(item.words),
                }}
              />
              <span className="text-[10px] text-gray-400 mt-1">{item.day}</span>
            </div>
          )
        })}
      </div>
      {trend && (
        <div className="text-center mt-2">
          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {trend}
          </span>
        </div>
      )}
    </div>
  )
}
