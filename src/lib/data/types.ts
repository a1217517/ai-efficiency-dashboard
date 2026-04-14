export interface DailyTrend {
  date: string
  codeLines: number
  testPassRate: number
  bugCount: number
  deliveryDays: number
}

export interface TeamComparison {
  team: string
  codeLines: number
  testPassRate: number
  bugCount: number
  avgDeliveryDays: number
}

export interface BugDistribution {
  name: string
  value: number
  color: string
}

export interface EventLog {
  id: string
  time: string
  project: string
  team: string
  type: 'commit' | 'test' | 'bugfix' | 'deploy'
  description: string
  status: 'success' | 'warning' | 'error'
}

export interface MetricSummary {
  totalCodeLines: number
  codeLinesChange: number
  testPassRate: number
  testPassRateChange: number
  bugRate: number
  bugRateChange: number
  avgDeliveryDays: number
  deliveryDaysChange: number
}
