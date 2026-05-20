import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TopBar } from './sections/TopBar';
import { TokenRanking } from './sections/TokenRanking';
import { PRSiliconChart } from './sections/PRSiliconChart';
import { DeployMetricsChart } from './sections/DeployMetricsChart';
import { KPICards } from './sections/KPICards';
import { AdminPage } from './pages/AdminPage';

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

const API_BASE = 'http://47.103.58.81:8082/api/v1';

interface ThresholdConfig {
  metric_type: string;
  threshold_value: number;
  description: string;
  updated_at: string;
}

function Dashboard({ dateRange, thresholdM, siliconThreshold }: { dateRange: DateRange; thresholdM: number; siliconThreshold: number }) {
  return (
    <>
      {/* KPI Cards */}
      <KPICards dateRange={dateRange} thresholdM={thresholdM} siliconThreshold={siliconThreshold} />

      {/* Main dashboard grid */}
      <main className="flex-1 p-4 grid gap-4" style={{
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: 'minmax(0, 1fr)',
        minHeight: 0,
      }}>
        <div style={{ gridRow: '1 / 2', gridColumn: '1 / 2' }}>
          <PRSiliconChart dateRange={dateRange} siliconThreshold={siliconThreshold} />
        </div>
        <div style={{ gridRow: '1 / 2', gridColumn: '2 / 3' }}>
          <TokenRanking dateRange={dateRange} thresholdM={thresholdM} />
        </div>
        <div style={{ gridRow: '1 / 2', gridColumn: '3 / 4' }}>
          <DeployMetricsChart />
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-2 border-t border-slate-800/40 flex items-center justify-between">
        <span className="text-slate-700 text-xs">AI-Native 效能看板 · Powered by Costrict + GitLab + OpenTelemetry + Apache Doris</span>
        <span className="text-slate-700 text-xs font-mono">v1.0.0</span>
      </footer>
    </>
  );
}

function getDateRangeFromDays(days: number): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    label: `最近${days}天`,
  };
}

function App() {
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromDays(30));
  const [thresholdM, setThresholdM] = useState(1);
  const [siliconThreshold, setSiliconThreshold] = useState(50);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/thresholds`)
      .then(res => res.json())
      .then(data => {
        if (data.code === 0 && Array.isArray(data.data)) {
          const configs: ThresholdConfig[] = data.data;
          const tokenCfg = configs.find(c => c.metric_type === 'token_daily_avg');
          const siliconCfg = configs.find(c => c.metric_type === 'pr_silicon_ratio');
          const daysCfg = configs.find(c => c.metric_type === 'date_range_days');

          const tokenVal = tokenCfg ? tokenCfg.threshold_value : 1;
          const siliconVal = siliconCfg ? siliconCfg.threshold_value : 50;
          const daysVal = daysCfg ? Math.round(daysCfg.threshold_value) : 30;

          setThresholdM(tokenVal);
          setSiliconThreshold(siliconVal);
          setDateRange(getDateRangeFromDays(daysVal));
        }
        setConfigLoaded(true);
      })
      .catch(() => {
        setConfigLoaded(true);
      });
  }, []);

  if (!configLoaded) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center" style={{ background: '#080e1a' }}>
        <div className="text-cyan-400 text-sm">加载配置中...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen grid-bg flex flex-col" style={{ background: '#080e1a' }}>
        {/* Scan line effect */}
        <div className="scanline" />

        <TopBar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          thresholdM={thresholdM}
          onThresholdChange={setThresholdM}
          siliconThreshold={siliconThreshold}
          onSiliconThresholdChange={setSiliconThreshold}
        />

        <Routes>
          <Route path="/" element={<Dashboard dateRange={dateRange} thresholdM={thresholdM} siliconThreshold={siliconThreshold} />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;