import { EventLog } from '@/lib/data/types'
import { cn } from '@/lib/utils'
import { CheckCircle, AlertTriangle, XCircle, GitCommit, FlaskConical, Bug, Rocket } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface EventTableProps {
  events: EventLog[]
}

const TYPE_ICONS = {
  commit: GitCommit,
  test: FlaskConical,
  bugfix: Bug,
  deploy: Rocket,
}

const TYPE_LABELS = {
  commit: '提交',
  test: '测试',
  bugfix: '修复',
  deploy: '部署',
}

const STATUS_STYLES = {
  success: { icon: CheckCircle, className: 'bg-emerald-50 text-emerald-700' },
  warning: { icon: AlertTriangle, className: 'bg-amber-50 text-amber-700' },
  error: { icon: XCircle, className: 'bg-rose-50 text-rose-700' },
}

export function EventTable({ events }: EventTableProps) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-100 text-center">
        <p className="text-slate-500">暂无事件记录</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-800">最近事件日志</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">描述</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">项目</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">团队</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.slice(0, 10).map((event) => {
              const TypeIcon = TYPE_ICONS[event.type]
              const StatusConfig = STATUS_STYLES[event.status]
              const StatusIcon = StatusConfig.icon
              
              return (
                <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">{TYPE_LABELS[event.type]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-900">{event.description}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{event.project}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{event.team}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {format(new Date(event.time), 'MM-dd HH:mm', { locale: zhCN })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', StatusConfig.className)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {event.status === 'success' && '成功'}
                      {event.status === 'warning' && '警告'}
                      {event.status === 'error' && '失败'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
