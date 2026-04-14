import { cn } from '@/lib/utils'

interface FilterBarProps {
  timeRange: '7d' | '30d' | 'quarter'
  onTimeRangeChange: (range: '7d' | '30d' | 'quarter') => void
  selectedTeam: string
  onTeamChange: (team: string) => void
  selectedProject: string
  onProjectChange: (project: string) => void
  teams: string[]
  projects: string[]
}

export function FilterBar({
  timeRange,
  onTimeRangeChange,
  selectedTeam,
  onTeamChange,
  selectedProject,
  onProjectChange,
  teams,
  projects,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
      <select
        value={selectedTeam}
        onChange={(e) => onTeamChange(e.target.value)}
        className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="选择团队"
      >
        <option value="">全部团队</option>
        {teams.map((team) => (
          <option key={team} value={team}>{team}</option>
        ))}
      </select>
      
      <select
        value={selectedProject}
        onChange={(e) => onProjectChange(e.target.value)}
        className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="选择项目"
      >
        <option value="">全部项目</option>
        {projects.map((project) => (
          <option key={project} value={project}>{project}</option>
        ))}
      </select>
      
      <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden">
        {(['7d', '30d', 'quarter'] as const).map((range) => (
          <button
            key={range}
            onClick={() => onTimeRangeChange(range)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium transition-colors',
              timeRange === range
                ? 'bg-primary-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            )}
            aria-pressed={timeRange === range}
          >
            {range === '7d' && '近 7 天'}
            {range === '30d' && '近 30 天'}
            {range === 'quarter' && '本季度'}
          </button>
        ))}
      </div>
    </div>
  )
}
