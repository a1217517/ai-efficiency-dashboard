import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity, Bug, Clock } from 'lucide-react'
import { formatNumber, formatPercent, cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: number
  change: number
  formatter: 'number' | 'percent' | 'days'
  icon: 'code' | 'test' | 'bug' | 'delivery'
}

const ICONS = {
  code: TrendingUp,
  test: Activity,
  bug: Bug,
  delivery: Clock,
}

const FORMATTERS = {
  number: formatNumber,
  percent: formatPercent,
  days: (v: number) => `${v.toFixed(1)} 天`,
}

export function KpiCard({ title, value, change, formatter, icon }: KpiCardProps) {
  const Icon = ICONS[icon]
  const isPositive = change >= 0
  const isBug = icon === 'bug'
  const goodDirection = isBug ? !isPositive : isPositive
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{FORMATTERS[formatter](value)}</p>
          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-3',
            goodDirection ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          )}>
            {goodDirection ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            {isPositive ? '+' : ''}
            {formatter === 'number' ? `${change.toFixed(1)}%` : FORMATTERS[formatter](change)}
            <span className="text-slate-400 ml-1">环比</span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
      </div>
    </div>
  )
}
