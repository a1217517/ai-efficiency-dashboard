'use client'

import { useMemo, useState } from 'react'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { FilterBar } from '@/components/dashboard/filter-bar'
import {
  CodeTrendChart,
  TestPassRateChart,
  BugDistributionChart,
  TeamComparisonChart,
} from '@/components/dashboard/charts'
import { EventTable } from '@/components/dashboard/event-table'
import { MOCK_DATA } from '@/lib/data/mock'

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'quarter'>('30d')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedProject, setSelectedProject] = useState('')

  const dailyData = useMemo(() => {
    const base =
      timeRange === '7d'
        ? MOCK_DATA.dailyTrend7d
        : timeRange === '30d'
        ? MOCK_DATA.dailyTrend30d
        : MOCK_DATA.dailyTrendQuarter

    if (!selectedTeam && !selectedProject) return base

    // Apply team/project filter by scaling data slightly for demo effect
    return base.map((day) => ({
      ...day,
      codeLines: Math.round(day.codeLines * (selectedTeam ? 0.6 + Math.random() * 0.3 : 1)),
      testPassRate: Math.min(100, day.testPassRate + (selectedTeam ? Math.random() * 4 - 2 : 0)),
      bugCount: Math.round(day.bugCount * (selectedTeam ? 0.7 + Math.random() * 0.4 : 1)),
    }))
  }, [timeRange, selectedTeam])

  const metrics = useMemo(() => MOCK_DATA.calculateMetrics(dailyData), [dailyData])

  const filteredEvents = useMemo(() => {
    return MOCK_DATA.eventLogs.filter((e) => {
      if (selectedTeam && e.team !== selectedTeam) return false
      if (selectedProject && e.project !== selectedProject) return false
      return true
    })
  }, [selectedTeam, selectedProject])

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Efficiency Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">AI-Native 开发效能指标监控</p>
          </div>
          <FilterBar
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            selectedTeam={selectedTeam}
            onTeamChange={setSelectedTeam}
            selectedProject={selectedProject}
            onProjectChange={setSelectedProject}
            teams={MOCK_DATA.TEAMS}
            projects={MOCK_DATA.PROJECTS}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="AI 代码生成量"
            value={metrics.totalCodeLines}
            change={metrics.codeLinesChange}
            formatter="number"
            icon="code"
          />
          <KpiCard
            title="测试通过率"
            value={metrics.testPassRate}
            change={metrics.testPassRateChange}
            formatter="percent"
            icon="test"
          />
          <KpiCard
            title="Bug 发现率"
            value={metrics.bugRate}
            change={metrics.bugRateChange}
            formatter="percent"
            icon="bug"
          />
          <KpiCard
            title="平均交付时间"
            value={metrics.avgDeliveryDays}
            change={metrics.deliveryDaysChange}
            formatter="days"
            icon="delivery"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CodeTrendChart data={dailyData} />
          <TestPassRateChart data={dailyData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BugDistributionChart data={MOCK_DATA.bugDistribution} />
          <TeamComparisonChart data={MOCK_DATA.teamComparison} />
        </div>

        <EventTable events={filteredEvents} />
      </div>
    </main>
  )
}
