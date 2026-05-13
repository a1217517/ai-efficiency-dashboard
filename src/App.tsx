import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TopBar } from './sections/TopBar';
import { TokenRanking } from './sections/TokenRanking';
import { PRSiliconChart } from './sections/PRSiliconChart';
import { DeployMetricsChart } from './sections/DeployMetricsChart';
import { KPICards } from './sections/KPICards';
import { AdminPage } from './pages/AdminPage';
import type { DateRangeValue } from './components/ui/date-range-picker';

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

function Dashboard({ dateRange }: { dateRange: DateRange }) {
  return (
    <>
      {/* KPI Cards */}
      <KPICards dateRange={dateRange} />

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

  const handleDateChange = (value: DateRangeValue) => {
    setDateRange({
      startDate: value.startDate,
      endDate: value.endDate,
      label: value.label,
    });
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen grid-bg flex flex-col" style={{ background: '#080e1a' }}>
        {/* Scan line effect */}
        <div className="scanline" />

        <TopBar dateRange={dateRange} onDateRangeChange={handleDateChange} />

        <Routes>
          <Route path="/" element={<Dashboard dateRange={dateRange} />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
