import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TopBar } from './sections/TopBar';
import { TokenRanking } from './sections/TokenRanking';
import { PRSiliconChart } from './sections/PRSiliconChart';
import { TeamAIUsageChart } from './sections/TeamAIUsageChart';
import { DeployMetricsChart } from './sections/DeployMetricsChart';
import { KPICards } from './sections/KPICards';
import { SystemHealth } from './sections/SystemHealth';
import { AdminPage } from './pages/AdminPage';

function Dashboard() {
  return (
    <>
      {/* KPI Cards */}
      <KPICards />

      {/* Main dashboard grid */}
      <main className="flex-1 p-4 grid gap-4" style={{
        gridTemplateRows: 'minmax(0, 1fr) minmax(0, 280px)',
        gridTemplateColumns: '1fr 1fr 1fr',
        minHeight: 0,
      }}>
        {/* Row 1 */}
        <div style={{ gridRow: '1 / 2', gridColumn: '1 / 2' }}>
          <TokenRanking />
        </div>
        <div style={{ gridRow: '1 / 2', gridColumn: '2 / 3' }}>
          <PRSiliconChart />
        </div>
        <div style={{ gridRow: '1 / 2', gridColumn: '3 / 4' }}>
          <TeamAIUsageChart />
        </div>

        {/* Row 2 */}
        <div style={{ gridRow: '2 / 3', gridColumn: '1 / 3' }}>
          <DeployMetricsChart />
        </div>
        <div style={{ gridRow: '2 / 3', gridColumn: '3 / 4' }}>
          <SystemHealth />
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

        {/* Top bar with marquee */}
        <TopBar />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
