import { useState } from 'react';
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

function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      label: '最近30天',
    };
  });
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(dateRange.startDate);
  const [customEnd, setCustomEnd] = useState(dateRange.endDate);

  const presets = [
    { label: '最近7天', days: 7 },
    { label: '最近15天', days: 15 },
    { label: '最近30天', days: 30 },
    { label: '最近90天', days: 90 },
  ];

  const applyPreset = (days: number, label: string) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    const range = {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      label,
    };
    setDateRange(range);
    setCustomStart(range.startDate);
    setCustomEnd(range.endDate);
    setShowCustom(false);
  };

  const applyCustom = () => {
    if (customStart && customEnd) {
      setDateRange({
        startDate: customStart,
        endDate: customEnd,
        label: `${customStart} ~ ${customEnd}`,
      });
      setShowCustom(false);
    }
  };

  return (
    <>
      {/* Top bar with marquee */}
      <TopBar dateRange={dateRange} />

      {/* KPI Cards */}
      <KPICards dateRange={dateRange} />

      {/* Date Filter */}
      <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
        <span className="text-slate-500 text-xs">时间范围:</span>
        {presets.map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.days, p.label)}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              dateRange.label === p.label
                ? 'bg-cyan-600 text-white'
                : 'bg-[#1a2235] text-slate-400 border border-slate-700 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-2.5 py-1 text-xs rounded transition-colors ${
            showCustom || !presets.some(p => p.label === dateRange.label)
              ? 'bg-cyan-600 text-white'
              : 'bg-[#1a2235] text-slate-400 border border-slate-700 hover:text-white'
          }`}
        >
          自定义
        </button>
        <span className="text-cyan-400 text-xs ml-1">{dateRange.label}</span>
        {showCustom && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="h-7 rounded border border-slate-700 bg-[#1a2235] text-white px-2 text-xs"
            />
            <span className="text-slate-500 text-xs">~</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="h-7 rounded border border-slate-700 bg-[#1a2235] text-white px-2 text-xs"
            />
            <button
              onClick={applyCustom}
              className="px-2 py-1 text-xs rounded bg-cyan-600 text-white hover:bg-cyan-500"
            >
              确定
            </button>
          </div>
        )}
      </div>

      {/* Main dashboard grid */}
      <main className="flex-1 p-4 grid gap-4" style={{
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: 'minmax(0, 1fr)',
        minHeight: 0,
      }}>
        <div style={{ gridRow: '1 / 2', gridColumn: '1 / 2' }}>
          <PRSiliconChart />
        </div>
        <div style={{ gridRow: '1 / 2', gridColumn: '2 / 3' }}>
          <TokenRanking dateRange={dateRange} />
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

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen grid-bg flex flex-col" style={{ background: '#080e1a' }}>
        {/* Scan line effect */}
        <div className="scanline" />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
