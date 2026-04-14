'use client'

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { DailyTrend, TeamComparison, BugDistribution } from '@/lib/data/types'
import { formatNumber } from '@/lib/utils'

export function CodeTrendChart({ data }: { data: DailyTrend[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
      <h3 className="text-base font-semibold text-slate-800 mb-4">代码生成量趋势</h3>
      <div className="h-64" aria-label="代码生成量趋势图">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => value.slice(5)}
              stroke="#cbd5e1"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => formatNumber(value)}
              stroke="#cbd5e1"
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
              formatter={(value: number) => [formatNumber(value), '代码行数']}
            />
            <Line
              type="monotone"
              dataKey="codeLines"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function TestPassRateChart({ data }: { data: DailyTrend[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
      <h3 className="text-base font-semibold text-slate-800 mb-4">测试通过率</h3>
      <div className="h-64" aria-label="测试通过率趋势图">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => value.slice(5)}
              stroke="#cbd5e1"
            />
            <YAxis
              domain={[80, 100]}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              stroke="#cbd5e1"
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, '通过率']}
            />
            <Area
              type="monotone"
              dataKey="testPassRate"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTest)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function BugDistributionChart({ data }: { data: BugDistribution[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
      <h3 className="text-base font-semibold text-slate-800 mb-4">Bug 分布</h3>
      <div className="h-64" aria-label="Bug 分布饼图">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function TeamComparisonChart({ data }: { data: TeamComparison[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
      <h3 className="text-base font-semibold text-slate-800 mb-4">团队效能对比</h3>
      <div className="h-64" aria-label="团队效能对比柱状图">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="team"
              tick={{ fill: '#64748b', fontSize: 11 }}
              stroke="#cbd5e1"
              interval={0}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => formatNumber(value)}
              stroke="#cbd5e1"
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
              formatter={(value: number) => [formatNumber(value), '代码行数']}
            />
            <Bar dataKey="codeLines" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
