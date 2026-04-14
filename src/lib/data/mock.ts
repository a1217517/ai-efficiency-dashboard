import { DailyTrend, TeamComparison, BugDistribution, EventLog, MetricSummary } from './types'

const TEAMS = ['平台团队', '业务中台', '数据智能', '前端体验', '基础设施']
const PROJECTS = ['AI-Observe', 'DeerFlow', 'StarOffice', 'ClawHub', 'DataLens', 'CodeMate', 'AutoTest', 'DocGen']

function generateDailyTrend(days: number): DailyTrend[] {
  const data: DailyTrend[] = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const baseMultiplier = isWeekend ? 0.3 : 1
    
    data.push({
      date: date.toISOString().split('T')[0],
      codeLines: Math.round((Math.random() * 3000 + 2000) * baseMultiplier),
      testPassRate: Math.min(100, Math.max(85, 92 + Math.random() * 6 - Math.random() * 3)),
      bugCount: Math.round((Math.random() * 8 + 2) * baseMultiplier),
      deliveryDays: Math.round((Math.random() * 2 + 1.5) * 10) / 10,
    })
  }
  
  return data
}

function generateTeamComparison(): TeamComparison[] {
  return TEAMS.map((team) => ({
    team,
    codeLines: Math.round(Math.random() * 15000 + 5000),
    testPassRate: Math.min(100, Math.max(80, 88 + Math.random() * 10)),
    bugCount: Math.round(Math.random() * 20 + 5),
    avgDeliveryDays: Math.round((Math.random() * 2 + 1.5) * 10) / 10,
  }))
}

function generateBugDistribution(): BugDistribution[] {
  return [
    { name: 'UI 样式', value: Math.round(Math.random() * 15 + 10), color: '#3b82f6' },
    { name: '逻辑错误', value: Math.round(Math.random() * 12 + 8), color: '#f43f5e' },
    { name: '类型安全', value: Math.round(Math.random() * 10 + 5), color: '#f59e0b' },
    { name: '性能问题', value: Math.round(Math.random() * 8 + 3), color: '#8b5cf6' },
    { name: '边界情况', value: Math.round(Math.random() * 6 + 2), color: '#10b981' },
  ]
}

const EVENT_TYPES: EventLog['type'][] = ['commit', 'test', 'bugfix', 'deploy']
const EVENT_TEMPLATES = {
  commit: ['新增 AI 代码审查流水线', '重构用户认证模块', '优化数据库查询', '升级组件库版本', '修复响应式布局'],
  test: ['单元测试覆盖率 87%', 'E2E 测试通过 42 个场景', '视觉回归测试完成', '性能基准测试更新', '安全扫描通过'],
  bugfix: ['修复登录态丢失问题', '修复图表渲染异常', '修复表单校验绕过', '修复数据导出超时', '修复暗黑模式颜色错误'],
  deploy: ['生产环境 v2.3.1 发布', 'Canary 部署完成', '预发环境同步', '热修复补丁部署', '文档站点更新'],
}

function generateEventLogs(count: number): EventLog[] {
  const logs: EventLog[] = []
  const now = new Date()
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now)
    time.setHours(time.getHours() - Math.round(Math.random() * 72))
    const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)]
    const desc = EVENT_TEMPLATES[type][Math.floor(Math.random() * EVENT_TEMPLATES[type].length)]
    const rand = Math.random()
    const status: EventLog['status'] = rand > 0.85 ? 'error' : rand > 0.7 ? 'warning' : 'success'
    
    logs.push({
      id: `evt-${Date.now()}-${i}`,
      time: time.toISOString(),
      project: PROJECTS[Math.floor(Math.random() * PROJECTS.length)],
      team: TEAMS[Math.floor(Math.random() * TEAMS.length)],
      type,
      description: desc,
      status,
    })
  }
  
  return logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

function calculateMetrics(data: DailyTrend[]): MetricSummary {
  const totalCodeLines = data.reduce((sum, d) => sum + d.codeLines, 0)
  const avgTestPassRate = data.reduce((sum, d) => sum + d.testPassRate, 0) / data.length
  const totalBugs = data.reduce((sum, d) => sum + d.bugCount, 0)
  const bugRate = totalCodeLines > 0 ? (totalBugs / (totalCodeLines / 1000)) * 100 : 0
  const avgDeliveryDays = data.reduce((sum, d) => sum + d.deliveryDays, 0) / data.length
  
  const mid = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, mid)
  const secondHalf = data.slice(mid)
  
  const firstCode = firstHalf.reduce((sum, d) => sum + d.codeLines, 0)
  const secondCode = secondHalf.reduce((sum, d) => sum + d.codeLines, 0)
  const codeLinesChange = firstCode > 0 ? ((secondCode - firstCode) / firstCode) * 100 : 0
  
  const firstTest = firstHalf.reduce((sum, d) => sum + d.testPassRate, 0) / firstHalf.length
  const secondTest = secondHalf.reduce((sum, d) => sum + d.testPassRate, 0) / secondHalf.length
  const testPassRateChange = secondTest - firstTest
  
  const firstBugs = firstHalf.reduce((sum, d) => sum + d.bugCount, 0)
  const secondBugs = secondHalf.reduce((sum, d) => sum + d.bugCount, 0)
  const firstBugRate = firstCode > 0 ? (firstBugs / (firstCode / 1000)) * 100 : 0
  const secondBugRate = secondCode > 0 ? (secondBugs / (secondCode / 1000)) * 100 : 0
  const bugRateChange = secondBugRate - firstBugRate
  
  const firstDelivery = firstHalf.reduce((sum, d) => sum + d.deliveryDays, 0) / firstHalf.length
  const secondDelivery = secondHalf.reduce((sum, d) => sum + d.deliveryDays, 0) / secondHalf.length
  const deliveryDaysChange = secondDelivery - firstDelivery
  
  return {
    totalCodeLines,
    codeLinesChange,
    testPassRate: avgTestPassRate,
    testPassRateChange,
    bugRate,
    bugRateChange,
    avgDeliveryDays,
    deliveryDaysChange,
  }
}

export const MOCK_DATA = {
  dailyTrend7d: generateDailyTrend(7),
  dailyTrend30d: generateDailyTrend(30),
  dailyTrendQuarter: generateDailyTrend(90),
  teamComparison: generateTeamComparison(),
  bugDistribution: generateBugDistribution(),
  eventLogs: generateEventLogs(20),
  calculateMetrics,
  TEAMS,
  PROJECTS,
}
