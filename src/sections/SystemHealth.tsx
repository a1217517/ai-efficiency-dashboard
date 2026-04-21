import React from 'react';

const healthData = [
  { name: 'Costrict API', status: 'normal', latency: '45ms' },
  { name: 'GitLab Webhook', status: 'normal', latency: '120ms' },
  { name: 'Doris 数据库', status: 'normal', latency: '12ms' },
  { name: 'OpenTelemetry', status: 'warning', latency: '230ms' },
];

export const SystemHealth: React.FC = () => {
  return (
    <div className="dashboard-card h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-emerald-400 rounded-full" />
          <h2 className="text-white font-semibold text-base">系统健康度</h2>
        </div>
        <span className="px-2 py-0.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded">
          正常
        </span>
      </div>

      <div className="flex-1 space-y-3">
        {healthData.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800/60"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  item.status === 'normal' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
                style={{
                  boxShadow: item.status === 'normal' 
                    ? '0 0 8px rgba(52,211,153,0.8)' 
                    : '0 0 8px rgba(251,191,36,0.8)',
                }}
              />
              <span className="text-slate-300 text-sm">{item.name}</span>
            </div>
            <span className="text-slate-500 text-xs font-mono">{item.latency}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">整体可用性</span>
          <span className="text-emerald-400 font-mono">99.9%</span>
        </div>
      </div>
    </div>
  );
};