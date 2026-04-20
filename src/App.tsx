// React import not needed with new JSX transform
import { TopBar } from './sections/TopBar';
import { TokenRanking } from './sections/TokenRanking';
import { PRSiliconChart } from './sections/PRSiliconChart';
import { TeamAIUsageChart } from './sections/TeamAIUsageChart';
import { DeployMetricsChart } from './sections/DeployMetricsChart';
import { ProjectEfficiencyChart } from './sections/ProjectEfficiencyChart';

function App() {
  return (
    <div className="min-h-screen grid-bg flex flex-col" style={{ background: '#080e1a' }}>
      {/* Scan line effect */}
      <div className="scanline" />

      {/* Top bar */}
      <TopBar />

      {/* Main dashboard grid */}
      <main className="flex-1 p-4 grid gap-3" style={{
        gridTemplateRows: 'minmax(0, 1fr) minmax(0, 0.75fr) minmax(0, 0.75fr)',
        gridTemplateColumns: '1fr 1fr 1fr',
        minHeight: 0,
      }}>
        {/* Row 1: Token Ranking (spans 2 rows) + PR Silicon + Team AI Usage */}
        <div style={{ gridRow: '1 / 3', gridColumn: '1 / 2' }}>
          <TokenRanking />
        </div>

        <div style={{ gridRow: '1 / 2', gridColumn: '2 / 3' }}>
          <PRSiliconChart />
        </div>

        <div style={{ gridRow: '1 / 2', gridColumn: '3 / 4' }}>
          <TeamAIUsageChart />
        </div>

        {/* Row 2: Deploy metrics (spans 2 cols) */}
        <div style={{ gridRow: '2 / 3', gridColumn: '2 / 4' }}>
          <DeployMetricsChart />
        </div>

        {/* Row 3: Project efficiency (full width) */}
        <div style={{ gridRow: '3 / 4', gridColumn: '1 / 4' }}>
          <ProjectEfficiencyChart />
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-2 border-t border-slate-800/40 flex items-center justify-between">
        <span className="text-slate-700 text-xs">AI-Native 效能看板 · Powered by Costrict + GitLab + OpenTelemetry + Apache Doris</span>
        <span className="text-slate-700 text-xs font-mono">v1.0.0</span>
      </footer>
    </div>
  );
}

export default App;
